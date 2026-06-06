import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatChildName,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

type ParentMessagesChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

type ParentMessagesUser = {
  id: string;
  childId: string;
  child: ParentMessagesChild;
};

type ParentMessageRow = {
  id: string;
  legacyThreadId: number | null;
  legacyData: Prisma.JsonValue | null;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  subject: string | null;
  body: string;
  threadId: string | null;
  createdAt: Date;
  thread: { subject: string | null } | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const parentUser = auth.parentUser as ParentMessagesUser;

  if (!matchesChildId(parentUser.child, childId)) {
    return jsonError("Access denied", 403);
  }

  if (request.method === "POST") {
    const postedChildId = await readPostedChildId(request);
    if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);
    if (!matchesChildId(parentUser.child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const child = parentUser.child;

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
        datetimeText: string;
      }
    >();

    for (const msg of messages as ParentMessageRow[]) {
      const tid = msg.threadId ?? msg.id; // fallback to msg id if no thread
      if (!threadMap.has(tid)) {
        const truncatedBody = `${msg.body.slice(0, 60)}...`;
        const prefix = msg.senderType === "PARENT" ? "You: " : "";

        threadMap.set(tid, {
          threadId: msg.legacyThreadId ? String(msg.legacyThreadId) : tid,
          modernThreadId: tid,
          legacyThreadId: msg.legacyThreadId,
          subject: msg.thread?.subject ?? msg.subject ?? "",
          lastMessage: prefix + truncatedBody,
          lastSenderType: msg.senderType,
          datetime: msg.createdAt,
          datetimeText: messageDateTime(msg),
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
      datetime: t.datetimeText,
      thread_id: t.threadId,
      modern_thread_id: t.modernThreadId,
      legacy_thread_id: t.legacyThreadId,
      subject: t.subject,
      last_message: t.lastMessage,
      original_sender:
        originalSenderMap.get(t.modernThreadId) ?? "Administration",
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function readPostedChildId(request: NextRequest) {
  const body = await readRequestBody(request);
  return readString(asRecord(body), ["usites", "pid", "child_id", "childId"]);
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

function matchesChildId(child: ParentMessagesChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
}

function messageDateTime(message: ParentMessageRow) {
  const legacy = asRecord(message.legacyData);
  const legacyMessage = asRecord(legacy?.message);

  return (
    readString(legacyMessage, ["datetime"]) ??
    readString(legacyMessage, ["curr_date"]) ??
    formatSqlDateTime(message.createdAt)
  );
}

function formatSqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return null;
}
