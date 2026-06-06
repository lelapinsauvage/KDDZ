import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { createHash } from "crypto";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  createParentToken,
  jsonError,
  jsonSuccess,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/parent-auth";

const loginSchema = z.object({
  name: z.string().min(1),
  pass: z.string().min(1),
});

const LOGIN_LOOKUP_TIMEOUT_MS = 5_000;
const LEGACY_PARENT_REPORT_URL =
  "https://kiddzonline.com/Garderie_parent/Front/templates/admin/users/login.php";

class LoginLookupTimeoutError extends Error {
  constructor() {
    super("Parent login lookup timed out");
    this.name = "LoginLookupTimeoutError";
  }
}

function failedLogin(feedback = "") {
  return jsonSuccess({
    id: 0,
    usites: 0,
    status: false,
    fname: "",
    lname: "",
    url: "",
    urlLabel: "View Full Reports",
    feedback,
    token: "",
    childId: "",
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new LoginLookupTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
    promise.catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per minute per IP
  const rlKey = getRateLimitKey(request, "login");
  if (!checkRateLimit(rlKey, 10, 60_000)) {
    return jsonError("Too many login attempts", 429);
  }

  const body = await readRequestBody(request);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return failedLogin();
  }

  const { name, pass } = parsed.data;
  const username = name.trim();

  try {
    const parentUser = await withTimeout(
      db.parentUser.findUnique({
        where: { username },
        include: { child: true },
      }),
      LOGIN_LOOKUP_TIMEOUT_MS
    );

    if (!parentUser || !parentUser.isActive) {
      return failedLogin();
    }

    const isPasswordValid = await verifyPassword(pass, parentUser.passwordHash);
    if (!isPasswordValid) {
      return failedLogin();
    }

    // Generate JWT token
    const token = await createParentToken(parentUser);

    // Persist token on the ParentUser row (matches old PHP behavior)
    await withTimeout(
      db.parentUser.update({
        where: { id: parentUser.id },
        data: { token },
      }),
      LOGIN_LOOKUP_TIMEOUT_MS
    );

    const child = parentUser.child;
    const legacyId = parentUser.legacyId ?? parentUser.id;
    const legacyChildId = parentUser.legacyChildId ?? child.legacyId ?? child.id;
    const reportUrl = token
      ? `${LEGACY_PARENT_REPORT_URL}?token=${encodeURIComponent(token)}`
      : "";

    return jsonSuccess({
      id: legacyId,
      usites: legacyChildId,
      status: true,
      fname: child.firstName,
      lname: child.lastName,
      url: reportUrl,
      urlLabel: "View Full Reports",
      feedback: "",
      token,
      childId: child.id,
      modernParentUserId: parentUser.id,
    });
  } catch (error) {
    if (error instanceof LoginLookupTimeoutError) {
      return failedLogin("Login temporarily unavailable");
    }
    return failedLogin();
  }
}

async function verifyPassword(password: string, passwordHash: string) {
  if (await compare(password, passwordHash)) return true;

  const md5 = createHash("md5").update(password).digest("hex");
  return compare(`md5:${md5}`, passwordHash);
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
