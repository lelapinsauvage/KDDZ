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

const registerSchema = z.object({
  cid: z.string().optional(),
  token: z.string().min(1),
  os: z.string().optional().default("0"),
});

const deleteSchema = z.object({
  del: z.string().min(1),
});

const showSchema = z.object({
  show: z.union([z.string(), z.boolean()]).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit: 30 push-token operations per minute per IP
  const rlKey = getRateLimitKey(request, "push-token");
  if (!checkRateLimit(rlKey, 30, 60_000)) {
    return jsonError("Too many requests", 429);
  }

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  let body: Record<string, unknown>;
  try {
    body = await readRequestBody(request);
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const showCheck = showSchema.safeParse(body);
  if (showCheck.success && showCheck.data.show !== undefined) {
    return handleShow(parentUser.id);
  }

  // Check if this is a delete request
  const deleteCheck = deleteSchema.safeParse(body);
  if (deleteCheck.success) {
    return handleDelete(parentUser.id, deleteCheck.data.del);
  }

  // Otherwise treat as registration
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ result: "Missing Paramaters" });
  }

  const { cid, token, os } = parsed.data;

  if (cid && cid !== parentUser.childId) {
    return jsonError("Access denied", 403);
  }

  try {
    const platform = mapPlatform(os);
    const legacyData = {
      source: "parent-push-token",
      cid: cid ?? parentUser.childId,
      os,
      registeredBy: "parent-api",
    };

    // Check if token already exists
    const existing = await db.pushToken.findUnique({
      where: { token },
    });

    if (existing) {
      // Reactivate — update to point to this parent user
      await db.pushToken.update({
        where: { token },
        data: {
          parentUserId: parentUser.id,
          userId: null,
          platform,
          isActive: true,
          legacyData,
        },
      });
    } else {
      // Create new
      await db.pushToken.create({
        data: {
          parentUserId: parentUser.id,
          token,
          platform,
          isActive: true,
          legacyData,
        },
      });
    }

    return jsonSuccess({ result: "Values inserted Successfully" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function handleDelete(parentUserId: string, tokenString: string) {
  try {
    const existing = await db.pushToken.findFirst({
      where: { token: tokenString, parentUserId },
      select: { id: true },
    });

    if (!existing) {
      return jsonSuccess({ result: "No Such Token Exists" });
    }

    await db.pushToken.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return jsonSuccess({ result: "Token Deleted Successfully" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function handleShow(parentUserId: string) {
  try {
    const tokens = await db.pushToken.findMany({
      where: { parentUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        platform: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonSuccess({ result: tokens });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function readRequestBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await request.json();
    return json && typeof json === "object" && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  return {};
}

function mapPlatform(os: string) {
  // Legacy `notifications_tokens.os`: 1 = Android, 2 = iOS, 3 = other.
  if (os === "1") return "ANDROID" as const;
  if (os === "2") return "IOS" as const;
  return "WEB" as const;
}
