import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  isPrismaConnectionError,
  makeHeader,
  jsonError,
  jsonSuccess,
  verifyParentToken,
} from "@/lib/parent-auth";
import {
  buildEmptyLegacyNativeListPayload,
  mapLegacyHoliday,
  shouldUseLegacyNativeListFallback,
} from "@/lib/parent-native-list-contracts";

type ParentHolidayUser = {
  childId: string;
  legacyChildId: number | null;
  child: {
    id: string;
    legacyId: number | null;
  };
};

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const body = request.method === "POST" ? await readRequestBody(request) : null;
  const postedChildId = readString(body, ["usites", "pid", "child_id", "childId"]);
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;

  if (request.method === "POST") {
    if (!postedChildId) {
      return jsonSuccess(buildEmptyLegacyNativeListPayload());
    }
    if (auth?.parentUser && !matchesChildId(auth.parentUser, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  } else if (!auth?.parentUser) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const holidays = await db.holiday.findMany({
      where: { isActive: true },
      orderBy: { date: "asc" },
    });

    const header = makeHeader("", true, holidays.length);

    const items = holidays.map(mapLegacyHoliday);

    return jsonSuccess([header, ...items]);
  } catch (error) {
    if (shouldUseLegacyNativeListFallback(request, error)) {
      return jsonSuccess(buildEmptyLegacyNativeListPayload());
    }
    return jsonError("Internal server error", 500);
  }
}

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return asRecord(body);
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
    include: {
      child: {
        select: {
          id: true,
          legacyId: true,
        },
      },
    },
  }).catch((error: unknown) => {
    if (isPrismaConnectionError(error)) return null;
    return "db-error" as const;
  });

  if (parentUser === "db-error") {
    return { error: jsonError("Internal server error", 500) };
  }

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser: parentUser as ParentHolidayUser };
}

function matchesChildId(parentUser: ParentHolidayUser, postedChildId: string) {
  return (
    postedChildId === parentUser.childId ||
    postedChildId === parentUser.child.id ||
    postedChildId === String(parentUser.legacyChildId ?? "") ||
    postedChildId === String(parentUser.child.legacyId ?? "")
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) {
      const stringValue = String(value);
      if (stringValue.length > 0) return stringValue;
    }
  }
  return null;
}
