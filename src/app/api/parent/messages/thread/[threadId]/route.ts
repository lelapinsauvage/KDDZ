import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  isPrismaConnectionError,
  jsonError,
  jsonSuccess,
  verifyParentToken,
} from "@/lib/parent-auth";
import {
  buildEmptyLegacyMessageThread,
  buildLegacyMessageThreadItem,
  buildLegacyMessageThreadPayload,
} from "@/lib/parent-message-contracts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  return handleRequest(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  return handleRequest(request, { params });
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId: routeThreadId } = await params;

    const auth = await optionalAuthenticateParent(request);
    if (auth && "error" in auth) return auth.error;
    if (request.method !== "POST" && !auth?.parentUser) {
      return jsonError("Unauthorized", 401);
    }

    const postedThreadId =
      request.method === "POST" ? await readPostedThreadId(request) : null;
    const threadId = postedThreadId || routeThreadId;
    const threadMessages = await loadThreadMessages(threadId);
    if (threadMessages.length === 0) {
      return jsonSuccess(buildEmptyLegacyMessageThread());
    }

    const parentUser = auth?.parentUser;
    if (parentUser) {
      const hasAccess = threadMessages.some(
        (message) =>
          (message.senderId === parentUser.id && message.senderType === "PARENT") ||
          (message.recipientId === parentUser.id && message.recipientType === "PARENT")
      );

      if (!hasAccess) {
        return jsonError("Access denied", 403);
      }
    }

    const uniqueMessages = dedupeMessages(threadMessages);

    // Mark parent-recipient rows in this thread as viewed, matching the mobile
    // read-on-open behavior without touching staff recipients.
    if (parentUser) {
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
    }

    const payload = buildLegacyMessageThreadPayload(
      uniqueMessages.map((message) =>
        buildLegacyMessageThreadItem({
          threadId: message.legacyThreadId
            ? String(message.legacyThreadId)
            : message.threadId ?? message.id,
          modernThreadId: message.threadId,
          legacyThreadId: message.legacyThreadId,
          datetime: messageDateTime(message),
          sender:
            message.legacySenderType !== null && message.legacySenderType !== undefined
              ? String(message.legacySenderType)
              : message.senderType === "PARENT"
                ? "1"
                : "0",
          senderType: message.senderType,
          subject: message.subject ?? "",
          message: message.body,
          isRead: message.isRead,
        })
      )
    );

    return jsonSuccess(payload);
  } catch (error) {
    if (request.method === "POST" || isPrismaConnectionError(error)) {
      return jsonSuccess(buildEmptyLegacyMessageThread());
    }
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

  const legacyMessages = await db.message.findMany({
    where: { legacyThreadId },
    orderBy: { createdAt: "asc" },
  });
  const threadIds = [
    ...new Set(legacyMessages.map((message) => message.threadId).filter(Boolean)),
  ] as string[];

  if (threadIds.length === 0) return legacyMessages;

  return db.message.findMany({
    where: {
      OR: [{ legacyThreadId }, { threadId: { in: threadIds } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

type ThreadMessage = Awaited<ReturnType<typeof loadThreadMessages>>[number];

function dedupeMessages(messages: ThreadMessage[]) {
  const map = new Map<string, ThreadMessage>();

  for (const message of messages) {
    const key = message.legacyId
      ? `legacy:${message.legacyId}`
      : [
          "modern-fanout",
          message.threadId ?? message.id,
          message.senderId,
          message.senderType,
          message.subject ?? "",
          message.body,
          message.createdAt.toISOString(),
        ].join(":");
    if (!map.has(key)) {
      map.set(key, message);
    }
  }

  return [...map.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}

async function readPostedThreadId(request: NextRequest) {
  const body = await readRequestBody(request);
  return readString(asRecord(body), ["usites", "thread_id", "threadid", "id"]);
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
  });

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser };
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

function messageDateTime(message: ThreadMessage) {
  const legacy = asRecord(message.legacyData as Prisma.JsonValue | null);
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
