import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  authenticateParent,
  checkRateLimit,
  getRateLimitKey,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

const sendMessageSchema = z.object({
  usites: z.string().min(1),
  to: z.string().min(1), // "1" = admin, "2" = teachers
  threadid: z.string().default("0"),
  subject: z.string().min(1),
  message: z.string().min(1),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // Rate limit: 20 messages per minute per IP
  const rlKey = getRateLimitKey(request, "messages");
  if (!checkRateLimit(rlKey, 20, 60_000)) {
    return jsonError("Too many requests", 429);
  }

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({
      feedback: "Message Failed to Send",
      threadid: 0,
    });
  }

  const { usites, to, threadid, subject, message: messageBody } = parsed.data;

  // Verify the parent has access to this child
  if (parentUser.childId !== usites) {
    return jsonError("Access denied", 403);
  }

  try {
    // Determine recipient(s)
    let recipientId: string;
    let recipientType: "ADMIN" | "TEACHER";

    if (to === "1") {
      // Send to admin — find first active admin user
      const admin = await db.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });
      if (!admin) {
        return jsonSuccess({
          feedback: "Message Failed to Send",
          threadid: 0,
        });
      }
      recipientId = admin.id;
      recipientType = "ADMIN";
    } else {
      // Send to teachers — find first active teacher's user at the child's branch
      const child = await db.child.findUnique({
        where: { id: usites },
        select: { branchId: true },
      });
      const teacher = await db.user.findFirst({
        where: {
          role: "TEACHER",
          isActive: true,
          branchId: child?.branchId,
        },
        select: { id: true },
      });
      if (!teacher) {
        return jsonSuccess({
          feedback: "Message Failed to Send",
          threadid: 0,
        });
      }
      recipientId = teacher.id;
      recipientType = "TEACHER";
    }

    let thread: { id: string };

    if (threadid !== "0") {
      // Reply to an existing thread. Legacy mobile passes numeric t_alarms_msg.thread_id;
      // modern clients may pass the MessageThread UUID.
      const existingThread = await resolveParentThread(threadid, parentUser.id);
      if (!existingThread) {
        return jsonSuccess({
          feedback: "Message Failed to Send",
          threadid: 0,
        });
      }
      thread = existingThread;
    } else {
      // Create new thread
      thread = await db.messageThread.create({
        data: { subject },
      });
    }

    // Create message
    await db.message.create({
      data: {
        senderId: parentUser.id,
        senderType: "PARENT",
        recipientId,
        recipientType,
        subject,
        body: messageBody,
        threadId: thread.id,
      },
    });

    return jsonSuccess({
      feedback: "Message Sent",
      threadid: threadid !== "0" ? threadid : thread.id,
    });
  } catch {
    return jsonSuccess({
      feedback: "Message Failed to Send",
      threadid: 0,
    });
  }
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
      select: { id: true },
    });
    return hasAccess ? thread : null;
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
    select: { threadId: true },
  });
  if (!message?.threadId) return null;

  return db.messageThread.findUnique({
    where: { id: message.threadId },
    select: { id: true },
  });
}
