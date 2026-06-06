import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  formatChildName,
  makeHeader,
  jsonError,
  jsonSuccess,
  verifyParentToken,
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
  legacyChildId: number | null;
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

  const postedChildId = request.method === "POST" ? await readPostedChildId(request) : null;
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;

  try {
    let parentUser = auth?.parentUser ?? null;
    if (parentUser && !matchesParentUserChildId(parentUser, childId)) {
      return jsonError("Access denied", 403);
    }

    if (request.method === "POST") {
      if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);

      if (parentUser) {
        if (!matchesParentUserChildId(parentUser, postedChildId)) {
          return jsonError("Access denied", 403);
        }
      } else {
        parentUser = await resolveLegacyParentMessageUser(postedChildId);
        if (!parentUser) return jsonSuccess([makeHeader("", false, 0)]);
      }
    }

    if (!parentUser) {
      return jsonError("Unauthorized", 401);
    }

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

  return { parentUser: parentUser as ParentMessagesUser };
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
      firstName: true,
      middleName: true,
      lastName: true,
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

  return parentUser ? (parentUser as ParentMessagesUser) : null;
}

function matchesParentUserChildId(
  parentUser: ParentMessagesUser,
  childId: string
) {
  return (
    childId === parentUser.childId ||
    childId === parentUser.child.id ||
    childId === String(parentUser.legacyChildId ?? "") ||
    childId === String(parentUser.child.legacyId ?? "")
  );
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

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
