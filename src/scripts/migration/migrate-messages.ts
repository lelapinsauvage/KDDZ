/**
 * Migration: t_alarms_msg + custom_notifications_msg → MessageThread + Message
 *
 * Old DB structure:
 *   t_alarms_msg — the actual messages
 *     aid          → (old ID)
 *     sender       → senderId (user_id from login_users or parent_login_users)
 *     sender_type  → senderType (0 = ADMIN/TEACHER, 1 = PARENT)
 *     nature       → (category, not migrated)
 *     subject      → subject
 *     message      → body
 *     thread_id    → threadId (self-referencing: first msg sets thread_id = own aid)
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
 *   2. For each message, create a Message record with sender/recipient info
 *   3. For each recipient in custom_notifications_msg, create a Message record
 *      (or if 1:many, use the first recipient as the primary)
 *
 * Prerequisites: Users must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
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

export async function migrateMessages(prisma: PrismaClient) {
  log("=== Migrating Messages ===");
  const dryRun = isDryRun();

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
  let msgCount = 0;
  let skippedThreads = 0;

  for (const [oldThreadId, messages] of threadGroups) {
    // Sort messages in thread by aid
    messages.sort((a, b) => a.aid - b.aid);
    const firstMsg = messages[0];

    // Idempotency: check if thread already migrated
    const existingThread = await prisma.messageThread.findFirst({
      where: { subject: firstMsg.subject || `Thread ${oldThreadId}` },
    });
    if (existingThread) {
      setMapping("thread", oldThreadId, existingThread.id);
      skippedThreads++;
      continue;
    }

    const threadId = generateUUID();

    if (!dryRun) {
      await prisma.messageThread.create({
        data: {
          id: threadId,
          subject: cleanString(firstMsg.subject),
          createdAt: firstMsg.datetime
            ? new Date(firstMsg.datetime)
            : new Date(),
        },
      });
    }

    setMapping("thread", oldThreadId, threadId);
    threadCount++;

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
        if (!dryRun) {
          await prisma.message.create({
            data: {
              id: generateUUID(),
              senderId,
              senderType,
              recipientId: senderId, // self-reference as fallback
              recipientType: senderType as RecipientType,
              subject: cleanString(msg.subject),
              body: msg.message || "",
              threadId,
              isRead: true,
              createdAt: msg.datetime
                ? new Date(msg.datetime)
                : new Date(),
            },
          });
        }
        msgCount++;
      } else {
        // Create one Message per recipient
        for (const recip of recipients) {
          const recipType = mapRecipientType(recip.user_type);
          const recipMapping =
            recipType === "PARENT" ? "parent_user" : "user";
          const recipientId =
            getMapping(recipMapping, recip.cusntf_user_id) || generateUUID();

          if (!dryRun) {
            await prisma.message.create({
              data: {
                id: generateUUID(),
                senderId,
                senderType,
                recipientId,
                recipientType: recipType,
                subject: cleanString(msg.subject),
                body: msg.message || "",
                threadId,
                isRead: toBool(recip.cusntf_is_viewed),
                createdAt: msg.datetime
                  ? new Date(msg.datetime)
                  : new Date(),
              },
            });
          }
          msgCount++;
        }
      }
    }

    logProgress(threadCount, threadGroups.size, "Threads");
  }

  log(
    `Messages: ${threadCount} threads created, ${msgCount} messages created, ${skippedThreads} threads skipped${dryRun ? " [DRY RUN]" : ""}`
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
      await migrateMessages(prisma);
    } catch (err) {
      logError("Message migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
