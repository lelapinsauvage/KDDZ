import type { NextRequest } from "next/server";

type RouteHandlerWithParams<T extends Record<string, string>> = (
  request: NextRequest,
  context: { params: Promise<T> },
) => Promise<Response | undefined>;

type RouteHandler = (request: NextRequest) => Promise<Response | undefined>;

export async function readLegacyWsParam(
  request: NextRequest,
  keys: string[],
) {
  for (const key of keys) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) return value;
  }

  if (request.method === "GET" || request.method === "HEAD") return null;

  const body = await readRequestBody(request.clone());
  for (const key of keys) {
    const value = body?.[key];
    if (value !== undefined && value !== null) {
      const text = String(value);
      if (text.length > 0) return text;
    }
  }

  return null;
}

export async function forwardLegacyChildWsRoute(
  request: NextRequest,
  handler: RouteHandlerWithParams<{ childId: string }>,
  keys = ["usites", "pid", "child_id", "childId"],
) {
  const childId = (await readLegacyWsParam(request, keys)) ?? "legacy";
  return handler(request, { params: Promise.resolve({ childId }) });
}

export async function forwardLegacyThreadWsRoute(
  request: NextRequest,
  handler: RouteHandlerWithParams<{ threadId: string }>,
  keys = ["usites", "thread_id", "threadid", "id"],
) {
  const threadId = (await readLegacyWsParam(request, keys)) ?? "legacy";
  return handler(request, { params: Promise.resolve({ threadId }) });
}

export function forwardLegacyAlarmWsRoute(
  request: NextRequest,
  handler: RouteHandlerWithParams<{ type: string }>,
  type: string,
) {
  return handler(request, { params: Promise.resolve({ type }) });
}

export function forwardLegacyWsRoute(
  request: NextRequest,
  handler: RouteHandler,
) {
  return handler(request);
}

async function readRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return asRecord(body);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request
      .clone()
      .formData()
      .catch(() => null);
    const entries = form ? [...form.entries()] : [];
    if (entries.length > 0) {
      return Object.fromEntries(
        entries.map(([key, value]) => [
          key,
          typeof value === "string" ? value : value.name,
        ]),
      );
    }
  }

  const text = await request.text().catch(() => "");
  if (!text.trim()) return null;
  return Object.fromEntries(new URLSearchParams(text).entries());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
