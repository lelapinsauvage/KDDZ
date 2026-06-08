import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  getRateLimitKey,
  isPrismaConnectionError,
  jsonError,
  jsonSuccess,
  verifyParentToken,
} from "@/lib/parent-auth";
import {
  buildEmptyLegacyPushShowResult,
  buildLegacyPushResult,
  LEGACY_PUSH_RESULTS,
  mapLegacyPushPlatform,
  mapLegacyPushToken,
} from "@/lib/parent-push-token-contracts";

const legacyString = z.union([z.string(), z.number()]).transform(String);

const registerSchema = z.object({
  cid: legacyString.optional(),
  token: legacyString.pipe(z.string().min(1)),
  os: legacyString.optional().default("0"),
});

const deleteSchema = z.object({
  del: legacyString.pipe(z.string().min(1)),
});

const showSchema = z.object({
  show: z.union([z.string(), z.boolean()]).optional(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PushParentChild = {
  id: string;
  legacyId: number | null;
};

type PushParentUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
  child: PushParentChild;
};

type LegacyPushOwner = {
  parentUser: PushParentUser | null;
  child: PushParentChild | null;
};

export async function POST(request: NextRequest) {
  // Rate limit: 30 push-token operations per minute per IP
  const rlKey = getRateLimitKey(request, "push-token");
  if (!checkRateLimit(rlKey, 30, 60_000)) {
    return jsonError("Too many requests", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await readRequestBody(request);
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;
  const parentUser = auth?.parentUser ?? null;

  const showCheck = showSchema.safeParse(body);
  const shouldShow = showCheck.success && showCheck.data.show !== undefined;

  // Check if this is a delete request
  const deleteCheck = deleteSchema.safeParse(body);
  if (deleteCheck.success) {
    const result = await handleDelete(deleteCheck.data.del, parentUser?.id ?? null);
    return shouldShow ? handleShow(parentUser?.id ?? null) : result;
  }

  // Otherwise treat as registration
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return shouldShow
      ? handleShow(parentUser?.id ?? null)
      : jsonSuccess(buildLegacyPushResult(LEGACY_PUSH_RESULTS.missingParameters));
  }

  const { cid, token, os } = parsed.data;

  const result = await handleRegister({ cid, token, os }, parentUser);
  return shouldShow ? handleShow(parentUser?.id ?? null) : result;
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

  return { parentUser: parentUser as PushParentUser };
}

async function handleRegister(
  data: { cid?: string; token: string; os: string },
  parentUser: PushParentUser | null
) {
  try {
    const { cid, token, os } = data;
    let owner: LegacyPushOwner;

    if (parentUser) {
      if (cid && !matchesChildId(parentUser, cid)) {
        return jsonError("Access denied", 403);
      }
      owner = { parentUser, child: parentUser.child };
    } else {
      if (!cid) {
        return jsonSuccess(
          buildLegacyPushResult(LEGACY_PUSH_RESULTS.missingParameters)
        );
      }
      owner = await resolveLegacyPushOwner(cid);
    }

    const platform = mapLegacyPushPlatform(os);
    const legacyData = {
      source: "ws/pnotifications.php",
      cid: cid ?? owner.child?.id ?? parentUser?.childId ?? "",
      os,
      childId: owner.child?.id ?? null,
      legacyChildId: owner.parentUser?.legacyChildId ?? owner.child?.legacyId ?? parseLegacyInt(cid),
      registeredBy: parentUser ? "parent-api-auth" : "legacy-native-unauth",
    } as Prisma.InputJsonValue;

    // Check if token already exists
    const existing = await db.pushToken.findUnique({
      where: { token },
    });

    if (existing) {
      // Reactivate — update to point to this parent user
      await db.pushToken.update({
        where: { token },
        data: {
          parentUserId: owner.parentUser?.id ?? existing.parentUserId,
          userId: owner.parentUser ? null : existing.userId,
          platform,
          isActive: true,
          legacyData,
        },
      });
    } else {
      // Create new
      await db.pushToken.create({
        data: {
          parentUserId: owner.parentUser?.id ?? null,
          token,
          platform,
          isActive: true,
          legacyData,
        },
      });
    }

    return jsonSuccess(buildLegacyPushResult(LEGACY_PUSH_RESULTS.inserted));
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return jsonSuccess(
        buildLegacyPushResult(LEGACY_PUSH_RESULTS.missingParameters)
      );
    }
    return jsonError("Internal server error", 500);
  }
}

async function handleDelete(tokenString: string, parentUserId: string | null) {
  try {
    const existing = await db.pushToken.findFirst({
      where: parentUserId
        ? { token: tokenString, parentUserId }
        : { token: tokenString },
      select: { id: true },
    });

    if (!existing) {
      return jsonSuccess(buildLegacyPushResult(LEGACY_PUSH_RESULTS.noToken));
    }

    await db.pushToken.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return jsonSuccess(buildLegacyPushResult(LEGACY_PUSH_RESULTS.deleted));
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return jsonSuccess(buildLegacyPushResult(LEGACY_PUSH_RESULTS.noToken));
    }
    return jsonError("Internal server error", 500);
  }
}

async function handleShow(parentUserId: string | null) {
  try {
    const tokens = await db.pushToken.findMany({
      where: parentUserId ? { parentUserId } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        parentUserId: true,
        token: true,
        platform: true,
        isActive: true,
        legacyData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonSuccess({ result: tokens.map(mapLegacyPushToken) });
  } catch {
    return jsonSuccess(buildEmptyLegacyPushShowResult());
  }
}

async function readRequestBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => null);
    return json && typeof json === "object" && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    if (!form) return {};
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  const text = await request.text().catch(() => "");
  if (!text.trim()) return {};
  return Object.fromEntries(new URLSearchParams(text).entries());
}

async function resolveLegacyPushOwner(cid: string): Promise<LegacyPushOwner> {
  const legacyChildId = parseLegacyInt(cid);
  const parentWhere = [];
  const childWhere = [];

  if (UUID_RE.test(cid)) {
    parentWhere.push({ childId: cid });
    childWhere.push({ id: cid });
  }
  if (legacyChildId !== null) {
    parentWhere.push({ legacyChildId });
    parentWhere.push({ child: { legacyId: legacyChildId } });
    childWhere.push({ legacyId: legacyChildId });
  }

  const parentUser = parentWhere.length
    ? await db.parentUser.findFirst({
        where: { OR: parentWhere },
        include: { child: true },
        orderBy: { createdAt: "asc" },
      })
    : null;

  if (parentUser) {
    return { parentUser: parentUser as PushParentUser, child: parentUser.child };
  }

  const child = childWhere.length
    ? await db.child.findFirst({
        where: { OR: childWhere },
        select: { id: true, legacyId: true },
        orderBy: { createdAt: "asc" },
      })
    : null;

  return { parentUser: null, child };
}

function matchesChildId(parentUser: PushParentUser, childId: string) {
  return (
    childId === parentUser.childId ||
    childId === parentUser.child.id ||
    childId === String(parentUser.legacyChildId ?? "") ||
    childId === String(parentUser.child.legacyId ?? "")
  );
}

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
