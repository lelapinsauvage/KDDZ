/**
 * Migration: t_alarms_msg + custom_notifications_msg → MessageThread + Message
 *
 * Old DB structure:
 *   t_alarms_msg — the actual messages
 *     aid          → (old ID)
 *     sender       → senderId (user_id from login_users or parent_login_users)
 *     sender_type  → senderType (0 = ADMIN/TEACHER, 1 = PARENT)
 *     nature       → legacyNature
 *     subject      → subject
 *     message      → body
 *     thread_id    → threadId (self-referencing: first msg sets thread_id = own aid)
 *     href         → legacyHref
 *     curr_date    → createdAt
 *     datetime     → createdAt (fallback)
 *
 *   custom_notifications_msg — per-recipient delivery
 *     cusntf_notification_id → FK to t_alarms_msg.aid
 *     cusntf_user_id         → recipientId
 *     user_type              → recipientType (0 = ADMIN, 1 = PARENT)
 *     cusntf_is_viewed       → isRead
 *
 * Strategy:
 *   1. Group messages by thread_id → create one MessageThread per unique thread_id
 *   2. Reuse existing migrated threads by legacy source/thread provenance
 *   3. For each custom_notifications_msg delivery row, upsert one Message
 *      record preserving recipient, viewed status, nature, href, and source row
 *
 * Prerequisites: Users must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  cleanString,
  toBool,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldMessage {
  aid: number;
  sender: number;
  nature: string;
  subject: string;
  message: string;
  thread_id: number;
  href: string;
  curr_date: string;
  sender_type: number;
  datetime: string;
}

interface OldMsgRecipient {
  cusntf_notification_id: number;
  cusntf_user_id: number;
  user_type: number;
  cusntf_is_viewed: number;
}

type SenderType = "ADMIN" | "TEACHER" | "PARENT";
type RecipientType = "ADMIN" | "TEACHER" | "PARENT";

function mapSenderType(senderType: number): SenderType {
  // 0 = garderie/admin, 1 = parent
  return senderType === 1 ? "PARENT" : "ADMIN";
}

function mapRecipientType(userType: number): RecipientType {
  return userType === 1 ? "PARENT" : "ADMIN";
}

function asDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function legacyMessageKey(
  sourceDatabase: string,
  messageId: number,
  recipient: OldMsgRecipient | null,
) {
  if (!recipient) return `${sourceDatabase}:t_alarms_msg:${messageId}:self`;
  return [
    sourceDatabase,
    "custom_notifications_msg",
    messageId,
    recipient.user_type,
    recipient.cusntf_user_id,
  ].join(":");
}

function legacyMessageData(
  message: OldMessage,
  recipient: OldMsgRecipient | null,
) {
  return JSON.parse(JSON.stringify({ message, recipient }));
}

export async function migrateMessages(
  prisma: PrismaClient,
  organizationId?: string,
) {
  log("=== Migrating Messages ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";

  // Load all messages
  const allMessages = await queryMysql<OldMessage>(
    "SELECT * FROM t_alarms_msg ORDER BY thread_id, aid"
  );
  log(`Found ${allMessages.length} messages in t_alarms_msg`);

  if (allMessages.length === 0) {
    log("No messages to migrate");
    return;
  }

  // Load all recipients
  const allRecipients = await queryMysql<OldMsgRecipient>(
    "SELECT * FROM custom_notifications_msg"
  );
  log(`Found ${allRecipients.length} recipient records`);

  // Group recipients by message ID
  const recipientsByMsg = new Map<number, OldMsgRecipient[]>();
  for (const r of allRecipients) {
    const arr = recipientsByMsg.get(r.cusntf_notification_id) || [];
    arr.push(r);
    recipientsByMsg.set(r.cusntf_notification_id, arr);
  }

  // Group messages by thread_id
  const threadGroups = new Map<number, OldMessage[]>();
  for (const msg of allMessages) {
    const tid = msg.thread_id || msg.aid;
    const arr = threadGroups.get(tid) || [];
    arr.push(msg);
    threadGroups.set(tid, arr);
  }

  log(`Found ${threadGroups.size} message threads`);

  let threadCount = 0;
  let processedThreadCount = 0;
  let msgCount = 0;
  let updatedCount = 0;
  let skippedThreads = 0;

  for (const [oldThreadId, messages] of threadGroups) {
    // Sort messages in thread by aid
    messages.sort((a, b) => a.aid - b.aid);
    const firstMsg = messages[0];

    const existingThreadMessage = await prisma.message.findFirst({
      where: {
        sourceDatabase,
        legacyThreadId: oldThreadId,
        threadId: { not: null },
      },
      select: { threadId: true },
    });

    const existingThreadId = existingThreadMessage?.threadId ?? null;
    const threadId = existingThreadId ?? generateUUID();
    if (existingThreadId) {
      skippedThreads++;
    }

    if (!existingThreadId) {
      if (!dryRun) {
        await prisma.messageThread.create({
          data: {
            id: threadId,
            subject: cleanString(firstMsg.subject),
            organizationId: organizationId ?? null,
            createdAt: asDate(firstMsg.datetime || firstMsg.curr_date),
          },
        });
      }
      threadCount++;
    }

    setMapping("thread", oldThreadId, threadId);
    processedThreadCount++;

    // Create Message records for each message in this thread
    for (const msg of messages) {
      const recipients = recipientsByMsg.get(msg.aid) || [];

      // Resolve sender UUID
      const senderType = mapSenderType(msg.sender_type);
      const senderMapping =
        senderType === "PARENT" ? "parent_user" : "user";
      const senderId =
        getMapping(senderMapping, msg.sender) || generateUUID();

      if (recipients.length === 0) {
        // Message with no tracked recipients — create with a placeholder
        const legacyKey = legacyMessageKey(sourceDatabase, msg.aid, null);
        const data = {
          sourceDatabase,
          legacyKey,
          legacyId: msg.aid,
          legacyThreadId: msg.thread_id || msg.aid,
          legacySenderId: msg.sender,
          legacySenderType: msg.sender_type,
          legacyRecipientId: null,
          legacyRecipientType: null,
          legacyDeliveryUserId: null,
          legacyDeliveryUserType: null,
          legacyNature: cleanString(msg.nature),
          legacyHref: cleanString(msg.href),
          legacyData: legacyMessageData(msg, null),
          senderId,
          senderType,
          recipientId: senderId,
          recipientType: senderType as RecipientType,
          subject: cleanString(msg.subject),
          body: msg.message || "",
          threadId,
          organizationId: organizationId ?? null,
          isRead: true,
          createdAt: asDate(msg.datetime || msg.curr_date),
        };

        const existing = dryRun
          ? null
          : await prisma.message.findUnique({ where: { legacyKey } });
        if (!dryRun) {
          await prisma.message.upsert({
            where: { legacyKey },
            update: data,
            create: { id: generateUUID(), ...data },
          });
        }
        if (existing) updatedCount++;
        msgCount++;
      } else {
        // Create one Message per recipient
        for (const recip of recipients) {
          const recipType = mapRecipientType(recip.user_type);
          const recipMapping =
            recipType === "PARENT" ? "parent_user" : "user";
          const recipientId =
            getMapping(recipMapping, recip.cusntf_user_id) || generateUUID();
          const legacyKey = legacyMessageKey(sourceDatabase, msg.aid, recip);
          const data = {
            sourceDatabase,
            legacyKey,
            legacyId: msg.aid,
            legacyThreadId: msg.thread_id || msg.aid,
            legacySenderId: msg.sender,
            legacySenderType: msg.sender_type,
            legacyRecipientId: recip.cusntf_user_id,
            legacyRecipientType: recip.user_type,
            legacyDeliveryUserId: recip.cusntf_user_id,
            legacyDeliveryUserType: recip.user_type,
            legacyNature: cleanString(msg.nature),
            legacyHref: cleanString(msg.href),
            legacyData: legacyMessageData(msg, recip),
            senderId,
            senderType,
            recipientId,
            recipientType: recipType,
            subject: cleanString(msg.subject),
            body: msg.message || "",
            threadId,
            organizationId: organizationId ?? null,
            isRead: toBool(recip.cusntf_is_viewed),
            createdAt: asDate(msg.datetime || msg.curr_date),
          };
          const existing = dryRun
            ? null
            : await prisma.message.findUnique({ where: { legacyKey } });

          if (!dryRun) {
            await prisma.message.upsert({
              where: { legacyKey },
              update: data,
              create: { id: generateUUID(), ...data },
            });
          }
          if (existing) updatedCount++;
          msgCount++;
        }
      }
    }

    logProgress(processedThreadCount, threadGroups.size, "Threads");
  }

  log(
    `Messages: ${threadCount} threads created, ${msgCount} messages upserted, ${updatedCount} messages updated, ${skippedThreads} threads reused${dryRun ? " [DRY RUN]" : ""}`
  );
  log(`=== Messages migration complete ===`);
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      const organization = await prisma.organization.findFirst({
        select: { id: true },
      });
      await migrateMessages(prisma, organization?.id);
    } catch (err) {
      logError("Message migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
