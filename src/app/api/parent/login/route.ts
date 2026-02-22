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
    return jsonSuccess({
      id: 0,
      usites: 0,
      status: false,
      fname: "",
      lname: "",
      url: "",
      urlLabel: "View Full Reports",
      feedback: "Missing credentials",
    });
  }

  const { name, pass } = parsed.data;

  try {
    const parentUser = await db.parentUser.findUnique({
      where: { username: name },
      include: { child: true },
    });

    if (!parentUser || !parentUser.isActive) {
      return jsonSuccess({
        id: 0,
        usites: 0,
        status: false,
        fname: "",
        lname: "",
        url: "",
        urlLabel: "View Full Reports",
        feedback: "",
      });
    }

    const isPasswordValid = await compare(pass, parentUser.passwordHash);
    if (!isPasswordValid) {
      return jsonSuccess({
        id: 0,
        usites: 0,
        status: false,
        fname: "",
        lname: "",
        url: "",
        urlLabel: "View Full Reports",
        feedback: "",
      });
    }

    // Generate JWT token
    const token = await createParentToken(parentUser);

    // Persist token on the ParentUser row (matches old PHP behavior)
    await db.parentUser.update({
      where: { id: parentUser.id },
      data: { token },
    });

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
  } catch {
    return jsonError("Internal server error", 500);
  }
}
