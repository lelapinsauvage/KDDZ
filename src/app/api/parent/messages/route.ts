import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  getRateLimitKey,
  jsonError,
  jsonSuccess,
  verifyParentToken,
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
  legacyChildId: number | null;
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

  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;

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

  try {
    let parentUser = auth?.parentUser ?? null;
    const isAuthenticatedParent = Boolean(parentUser);
    if (parentUser) {
      if (!matchesParentUserChildId(parentUser, usites)) {
        return jsonError("Access denied", 403);
      }
    } else {
      parentUser = await resolveLegacyParentMessageUser(usites);
      if (!parentUser) return failedSend();
    }

    const recipients = await resolveRecipients(to, parentUser.child);
    if (recipients.length === 0) return failedSend();

    let thread: { id: string };
    let legacyThreadId: number;

    if (threadid !== "0") {
      // Reply to an existing thread. Legacy mobile passes numeric t_alarms_msg.thread_id;
      // modern clients may pass the MessageThread UUID.
      const existingThread = await resolveParentThread(
        threadid,
        parentUser.id,
        isAuthenticatedParent,
        subject
      );
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

async function resolveParentThread(
  threadId: string,
  parentUserId: string,
  requireParentAccess: boolean,
  fallbackSubject: string
) {
  if (UUID_RE.test(threadId)) {
    const thread = await db.messageThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });
    if (!thread) return null;

    const firstMessage = await db.message.findFirst({
      where: {
        threadId: thread.id,
        ...(requireParentAccess
          ? {
              OR: [
                { senderId: parentUserId, senderType: "PARENT" },
                { recipientId: parentUserId, recipientType: "PARENT" },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { legacyThreadId: true },
    });
    return firstMessage || !requireParentAccess
      ? { id: thread.id, legacyThreadId: firstMessage?.legacyThreadId ?? null }
      : null;
  }

  const legacyThreadId = Number(threadId);
  if (!Number.isInteger(legacyThreadId)) return null;

  const message = await db.message.findFirst({
    where: {
      legacyThreadId,
      ...(requireParentAccess
        ? {
            OR: [
              { senderId: parentUserId, senderType: "PARENT" },
              { recipientId: parentUserId, recipientType: "PARENT" },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { threadId: true, legacyThreadId: true },
  });
  if (!message?.threadId) {
    if (requireParentAccess) return null;
    const thread = await db.messageThread.create({
      data: { subject: fallbackSubject },
      select: { id: true },
    });
    return { id: thread.id, legacyThreadId };
  }

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

async function optionalAuthenticateParent(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const hasBearer = authHeader?.startsWith("Bearer ");
  const payload = await verifyParentToken(request);

  if (hasBearer && !payload) {
    return { error: jsonError("Unauthorized", 401) };
  }
  if (!payload) return null;

  const parentUser = await db.parentUser.findUnique({
    where: { id: payload.sub, isActive: true },
    include: { child: true },
  }).catch(() => "db-error" as const);

  if (parentUser === "db-error") {
    return { error: jsonError("Internal server error", 500) };
  }

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser: parentUser as ParentMessageUser };
}

async function resolveLegacyParentMessageUser(childId: string) {
  const legacyChildId = parseLegacyInt(childId);
  const childWhere = [];

  if (UUID_RE.test(childId)) {
    childWhere.push({ id: childId });
  }
  if (legacyChildId !== null) {
    childWhere.push({ legacyId: legacyChildId });
  }
  if (childWhere.length === 0) return null;

  const child = await db.child.findFirst({
    where: { OR: childWhere },
    select: {
      id: true,
      legacyId: true,
      branchId: true,
    },
    orderBy: { createdAt: "asc" },
  });
  if (!child) return null;

  const parentUser = await db.parentUser.findFirst({
    where: {
      OR: [
        { childId: child.id },
        ...(child.legacyId !== null ? [{ legacyChildId: child.legacyId }] : []),
      ],
    },
    include: { child: true },
    orderBy: { createdAt: "asc" },
  });

  return parentUser ? (parentUser as ParentMessageUser) : null;
}

function matchesParentUserChildId(
  parentUser: ParentMessageUser,
  childId: string
) {
  return (
    childId === parentUser.childId ||
    matchesChildId(parentUser.child, childId) ||
    childId === String(parentUser.legacyChildId ?? "")
  );
}

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function failedSend() {
  return jsonSuccess({
    feedback: "Message Failed to Send",
    threadid: 0,
  });
}
