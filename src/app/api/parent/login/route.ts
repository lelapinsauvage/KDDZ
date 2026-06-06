import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return failedLogin("Missing credentials");
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

    const isPasswordValid = await compare(pass, parentUser.passwordHash);
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

    return jsonSuccess({
      id: parentUser.id,
      usites: child.id,
      status: true,
      fname: child.firstName,
      lname: child.lastName,
      url: "",
      urlLabel: "View Full Reports",
      feedback: "",
      token, // new field: the JWT for subsequent API calls
    });
  } catch (error) {
    if (error instanceof LoginLookupTimeoutError) {
      return failedLogin("Login temporarily unavailable");
    }
    return failedLogin();
  }
}
