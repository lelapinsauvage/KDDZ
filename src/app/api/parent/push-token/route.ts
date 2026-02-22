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
  token: z.string().min(1),
  os: z.string().optional().default("0"),
});

const deleteSchema = z.object({
  del: z.string().min(1),
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  // Check if this is a delete request
  const deleteCheck = deleteSchema.safeParse(body);
  if (deleteCheck.success) {
    return handleDelete(deleteCheck.data.del);
  }

  // Otherwise treat as registration
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ result: "Missing Paramaters" });
  }

  const { token, os } = parsed.data;

  try {
    // Map OS string to platform enum
    const platform = os === "1" ? "IOS" as const : os === "2" ? "ANDROID" as const : "WEB" as const;

    // Check if token already exists
    const existing = await db.pushToken.findUnique({
      where: { token },
    });

    if (existing) {
      // Reactivate — update to point to this parent user
      await db.pushToken.update({
        where: { token },
        data: { parentUserId: parentUser.id, platform },
      });
    } else {
      // Create new
      await db.pushToken.create({
        data: {
          parentUserId: parentUser.id,
          token,
          platform,
        },
      });
    }

    return jsonSuccess({ result: "Values inserted Successfully" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

async function handleDelete(tokenString: string) {
  try {
    const existing = await db.pushToken.findUnique({
      where: { token: tokenString },
    });

    if (!existing) {
      return jsonSuccess({ result: "No Such Token Exists" });
    }

    await db.pushToken.delete({
      where: { token: tokenString },
    });

    return jsonSuccess({ result: "Token Deleted Successfully" });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
