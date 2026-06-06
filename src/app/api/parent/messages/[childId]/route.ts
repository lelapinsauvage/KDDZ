import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  try {
    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) {
      return jsonSuccess([makeHeader("", false, 0)]);
    }

    // Find all messages where the parent is sender or recipient
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: parentUser.id, senderType: "PARENT" },
          { recipientId: parentUser.id, recipientType: "PARENT" },
        ],
      },
      include: { thread: true },
      orderBy: { createdAt: "desc" },
    });

    // Group by threadId and get the latest message per thread
    const threadMap = new Map<
      string,
      {
        threadId: string;
        modernThreadId: string;
        legacyThreadId: number | null;
        subject: string;
        lastMessage: string;
        lastSenderType: string;
        datetime: Date;
      }
    >();

    for (const msg of messages) {
      const tid = msg.threadId ?? msg.id; // fallback to msg id if no thread
      if (!threadMap.has(tid)) {
        const truncatedBody =
          msg.body.length > 60 ? msg.body.slice(0, 60) + "..." : msg.body;
        const prefix =
          msg.senderType === "PARENT" ? "You: " : "";

        threadMap.set(tid, {
          threadId: msg.legacyThreadId ? String(msg.legacyThreadId) : tid,
          modernThreadId: tid,
          legacyThreadId: msg.legacyThreadId,
          subject: msg.thread?.subject ?? msg.subject ?? "",
          lastMessage: prefix + truncatedBody,
          lastSenderType: msg.senderType,
          datetime: msg.createdAt,
        });
      }
    }

    // Find original sender for each thread
    const threadIds = [...threadMap.keys()];
    const originalMessages =
      threadIds.length > 0
        ? await db.message.findMany({
            where: { threadId: { in: threadIds } },
            orderBy: { createdAt: "asc" },
            distinct: ["threadId"],
            select: { threadId: true, senderType: true },
          })
        : [];

    const originalSenderMap = new Map<string, string>();
    for (const m of originalMessages) {
      if (m.threadId) {
        originalSenderMap.set(
          m.threadId,
          m.senderType === "PARENT" ? "Parent" : "Administration"
        );
      }
    }

    const threads = [...threadMap.values()].sort(
      (a, b) => b.datetime.getTime() - a.datetime.getTime()
    );

    const header = makeHeader(formatChildName(child), true, threads.length);

    const items = threads.map((t) => ({
      datetime: t.datetime.toISOString(),
      thread_id: t.threadId,
      modern_thread_id: t.modernThreadId,
      legacy_thread_id: t.legacyThreadId,
      subject: t.subject,
      last_message: t.lastMessage,
      original_sender:
        originalSenderMap.get(t.threadId) ?? "Administration",
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
