import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  authenticateParent,
  checkRateLimit,
  getRateLimitKey,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

const legacyString = z.union([z.string(), z.number()]).transform(String);
const requiredLegacyString = legacyString.pipe(z.string().min(1));

const sendMessageSchema = z.object({
  usites: requiredLegacyString,
  to: requiredLegacyString, // "1" = admin, "2" = teachers
  threadid: legacyString.optional(),
  subject: requiredLegacyString,
  message: requiredLegacyString,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ParentMessageChild = {
  id: string;
  legacyId: number | null;
  branchId: string | null;
};

type ParentMessageUser = {
  id: string;
  legacyId: number | null;
  childId: string;
  child: ParentMessageChild;
};

type RecipientTarget = {
  id: string;
  type: "ADMIN" | "TEACHER";
};

export async function POST(request: NextRequest) {
  // Rate limit: 20 messages per minute per IP
  const rlKey = getRateLimitKey(request, "messages");
  if (!checkRateLimit(rlKey, 20, 60_000)) {
    return jsonError("Too many requests", 429);
  }

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const parentUser = auth.parentUser as ParentMessageUser;

  const body = await readRequestBody(request);

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({
      feedback: "Message Failed to Send",
      threadid: 0,
    });
  }

  const {
    usites,
    to,
    subject,
    message: messageBody,
  } = parsed.data;
  const threadid = parsed.data.threadid || "0";

  // Verify the parent has access to this child
  if (!matchesChildId(parentUser.child, usites)) {
    return jsonError("Access denied", 403);
  }

  try {
    const recipients = await resolveRecipients(to, parentUser.child);
    if (recipients.length === 0) return failedSend();

    let thread: { id: string };
    let legacyThreadId: number;

    if (threadid !== "0") {
      // Reply to an existing thread. Legacy mobile passes numeric t_alarms_msg.thread_id;
      // modern clients may pass the MessageThread UUID.
      const existingThread = await resolveParentThread(threadid, parentUser.id);
      if (!existingThread) return failedSend();
      thread = { id: existingThread.id };
      legacyThreadId = existingThread.legacyThreadId ?? await nextLegacyThreadId();
    } else {
      // Create new thread
      legacyThreadId = await nextLegacyThreadId();
      thread = await db.messageThread.create({
        data: { subject },
      });
    }

    const createdAt = new Date();
    const legacyHref = `message_portal_single.php?thread=${legacyThreadId}`;
    const legacyData = {
      source: "parent-sendMessage",
      usites,
      to,
      threadid,
      subject,
      message: messageBody,
      legacyThreadId,
      legacyHref,
      childId: parentUser.child.id,
      legacyChildId: parentUser.child.legacyId,
    } as Prisma.InputJsonValue;

    await db.$transaction(
      recipients.map((recipient) =>
        db.message.create({
          data: {
            legacyThreadId,
            legacySenderId: parentUser.legacyId,
            legacySenderType: 1,
            legacyRecipientId: null,
            legacyRecipientType: 0,
            legacyDeliveryUserId: null,
            legacyDeliveryUserType: 0,
            legacyNature: "Mobile Message",
            legacyHref,
            legacyData,
            senderId: parentUser.id,
            senderType: "PARENT",
            recipientId: recipient.id,
            recipientType: recipient.type,
            subject,
            body: messageBody,
            threadId: thread.id,
            isRead: false,
            createdAt,
          },
        })
      )
    );

    return jsonSuccess({
      feedback: "Message Sent",
      threadid: legacyThreadId,
      modern_thread_id: thread.id,
    });
  } catch {
    return failedSend();
  }
}

async function resolveRecipients(
  to: string,
  child: ParentMessageChild
): Promise<RecipientTarget[]> {
  if (to === "1") {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return admin ? [{ id: admin.id, type: "ADMIN" }] : [];
  }

  const [admins, teachers] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    child.branchId
      ? db.user.findMany({
          where: {
            role: "TEACHER",
            isActive: true,
            branchId: child.branchId,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const recipients = new Map<string, RecipientTarget>();
  for (const admin of admins) {
    recipients.set(admin.id, { id: admin.id, type: "ADMIN" });
  }
  for (const teacher of teachers) {
    if (!recipients.has(teacher.id)) {
      recipients.set(teacher.id, { id: teacher.id, type: "TEACHER" });
    }
  }
  return [...recipients.values()];
}

async function resolveParentThread(threadId: string, parentUserId: string) {
  if (UUID_RE.test(threadId)) {
    const thread = await db.messageThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });
    if (!thread) return null;

    const hasAccess = await db.message.findFirst({
      where: {
        threadId: thread.id,
        OR: [
          { senderId: parentUserId, senderType: "PARENT" },
          { recipientId: parentUserId, recipientType: "PARENT" },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { legacyThreadId: true },
    });
    return hasAccess
      ? { id: thread.id, legacyThreadId: hasAccess.legacyThreadId }
      : null;
  }

  const legacyThreadId = Number(threadId);
  if (!Number.isInteger(legacyThreadId)) return null;

  const message = await db.message.findFirst({
    where: {
      legacyThreadId,
      OR: [
        { senderId: parentUserId, senderType: "PARENT" },
        { recipientId: parentUserId, recipientType: "PARENT" },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { threadId: true, legacyThreadId: true },
  });
  if (!message?.threadId) return null;

  const thread = await db.messageThread.findUnique({
    where: { id: message.threadId },
    select: { id: true },
  });
  return thread
    ? { id: thread.id, legacyThreadId: message.legacyThreadId ?? legacyThreadId }
    : null;
}

async function nextLegacyThreadId() {
  const result = await db.message.aggregate({
    _max: {
      legacyId: true,
      legacyThreadId: true,
    },
  });
  return Math.max(result._max.legacyId ?? 0, result._max.legacyThreadId ?? 0) + 1;
}

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json().catch(() => null);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  const text = await request.text().catch(() => "");
  if (!text.trim()) return null;
  return Object.fromEntries(new URLSearchParams(text).entries());
}

function matchesChildId(child: ParentMessageChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
}

function failedSend() {
  return jsonSuccess({
    feedback: "Message Failed to Send",
    threadid: 0,
  });
}
