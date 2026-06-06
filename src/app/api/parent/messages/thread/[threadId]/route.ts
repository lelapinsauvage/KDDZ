import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  try {
    const threadMessages = await loadThreadMessages(threadId);
    if (threadMessages.length === 0) {
      return jsonSuccess([]);
    }

    const hasAccess = threadMessages.some(
      (message) =>
        (message.senderId === parentUser.id && message.senderType === "PARENT") ||
        (message.recipientId === parentUser.id && message.recipientType === "PARENT")
    );

    if (!hasAccess) {
      return jsonError("Access denied", 403);
    }

    const uniqueMessages = dedupeMessages(threadMessages);

    // Mark parent-recipient rows in this thread as viewed, matching the mobile
    // read-on-open behavior without touching staff recipients.
    const unreadParentIds = threadMessages
      .filter(
        (message) =>
          message.recipientId === parentUser.id &&
          message.recipientType === "PARENT" &&
          !message.isRead
      )
      .map((message) => message.id);

    if (unreadParentIds.length > 0) {
      await db.message.updateMany({
        where: { id: { in: unreadParentIds } },
        data: { isRead: true },
      });
    }

    const payload = Object.fromEntries(
      uniqueMessages.map((message, index) => [
        String(index + 1),
        {
          thread_id: message.legacyThreadId
            ? String(message.legacyThreadId)
            : message.threadId ?? message.id,
          modern_thread_id: message.threadId,
          legacy_thread_id: message.legacyThreadId,
          datetime:
            message.createdAt instanceof Date
              ? message.createdAt.toISOString()
              : String(message.createdAt),
          sender:
            message.legacySenderType !== null && message.legacySenderType !== undefined
              ? String(message.legacySenderType)
              : message.senderType === "PARENT"
                ? "1"
                : "0",
          sender_type: message.senderType,
          subject: message.subject ?? "",
          message: message.body,
          is_read: message.isRead,
        },
      ])
    );

    return jsonSuccess(payload);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function loadThreadMessages(threadId: string) {
  if (UUID_RE.test(threadId)) {
    const messages = await db.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
    if (messages.length > 0) return messages;
  }

  const legacyThreadId = Number(threadId);
  if (!Number.isInteger(legacyThreadId)) return [];

  return db.message.findMany({
    where: { legacyThreadId },
    orderBy: { createdAt: "asc" },
  });
}

type ThreadMessage = Awaited<ReturnType<typeof loadThreadMessages>>[number];

function dedupeMessages(messages: ThreadMessage[]) {
  const map = new Map<string, ThreadMessage>();

  for (const message of messages) {
    const key = message.legacyId ? `legacy:${message.legacyId}` : `modern:${message.id}`;
    if (!map.has(key)) {
      map.set(key, message);
    }
  }

  return [...map.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}
