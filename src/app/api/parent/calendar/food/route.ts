import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  formatChildName,
  isPrismaConnectionError,
  jsonError,
  jsonSuccess,
  makeHeader,
  verifyParentToken,
} from "@/lib/parent-auth";
import {
  buildEmptyLegacyNativeListPayload,
  mapLegacyFoodCalendarItems,
  shouldUseLegacyNativeListFallback,
  stripLegacyFoodCalendarGroupingFields,
} from "@/lib/parent-native-list-contracts";

type ParentFoodChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  branchId: string;
};

type ParentFoodUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
  child: ParentFoodChild;
};

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const postedChildId = request.method === "POST" ? await readPostedChildId(request) : null;
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;

  try {
    let child = auth?.parentUser.child ?? null;
    if (request.method === "POST") {
      if (!postedChildId) {
        return jsonSuccess(buildEmptyLegacyNativeListPayload({ branch_id: 0 }));
      }

      if (auth?.parentUser) {
        if (!matchesChildId(auth.parentUser, postedChildId)) {
          return jsonError("Access denied", 403);
        }
      } else {
        child = await resolveLegacyFoodChild(postedChildId);
        if (!child) {
          return jsonSuccess(buildEmptyLegacyNativeListPayload({ branch_id: 0 }));
        }
      }
    }

    if (!child) {
      return jsonError("Unauthorized", 401);
    }

    const [branch, foodCalendars] = await Promise.all([
      db.branch.findUnique({
        where: { id: child.branchId },
        select: { legacyId: true },
      }),
      db.foodCalendar.findMany({
        where: { branchId: child.branchId },
        include: { food: true },
        orderBy: [{ legacyId: "asc" }, { date: "asc" }, { mealType: "asc" }],
      }),
    ]);

    const items = mapLegacyFoodCalendarItems(foodCalendars);
    const header = makeHeader(formatChildName(child), true, items.length, {
      branch_id: branch?.legacyId ?? child.branchId,
    });

    return jsonSuccess([header, ...items.map(stripLegacyFoodCalendarGroupingFields)]);
  } catch (error) {
    if (shouldUseLegacyNativeListFallback(request, error)) {
      return jsonSuccess(buildEmptyLegacyNativeListPayload({ branch_id: 0 }));
    }
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
    include: { child: true },
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

  return { parentUser: parentUser as ParentFoodUser };
}

async function resolveLegacyFoodChild(childId: string) {
  const legacyChildId = parseLegacyInt(childId);
  const childWhere = [];

  if (UUID_RE.test(childId)) {
    childWhere.push({ id: childId });
  }
  if (legacyChildId !== null) {
    childWhere.push({ legacyId: legacyChildId });
  }

  if (childWhere.length === 0) return null;

  return db.child.findFirst({
    where: { OR: childWhere },
    select: {
      id: true,
      legacyId: true,
      firstName: true,
      middleName: true,
      lastName: true,
      branchId: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

function matchesChildId(parentUser: ParentFoodUser, postedChildId: string) {
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
    if (value !== undefined && value !== null) return String(value);
  }
  return null;
}

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
