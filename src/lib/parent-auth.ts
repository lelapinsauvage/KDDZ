import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { db } from "./db";
import type { PortionSize } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// JWT Token Management
// ─────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.PARENT_JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "PARENT_JWT_SECRET or AUTH_SECRET environment variable must be set"
    );
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

export interface ParentTokenPayload {
  sub: string; // parentUser.id
  childId: string;
  username: string;
}

export async function createParentToken(parentUser: {
  id: string;
  childId: string;
  username: string;
}): Promise<string> {
  return new SignJWT({
    childId: parentUser.childId,
    username: parentUser.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(parentUser.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyParentToken(
  request: NextRequest
): Promise<ParentTokenPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      childId: payload.childId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Authentication Helpers
// ─────────────────────────────────────────────

export async function authenticateParent(request: NextRequest) {
  const payload = await verifyParentToken(request);
  if (!payload) {
    return { error: jsonError("Unauthorized", 401) };
  }

  const parentUser = await db.parentUser.findUnique({
    where: { id: payload.sub, isActive: true },
    include: { child: true },
  });

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser };
}

export function verifyChildAccess(
  parentUser: { childId: string },
  childId: string
): boolean {
  return parentUser.childId === childId;
}

// ─────────────────────────────────────────────
// Response Helpers
// ─────────────────────────────────────────────

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function jsonSuccess(data: unknown) {
  return Response.json(data);
}

// ─────────────────────────────────────────────
// Data Mapping Helpers
// ─────────────────────────────────────────────

export function formatChildName(child: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}): string {
  return [child.firstName, child.middleName, child.lastName]
    .filter(Boolean)
    .join(" ");
}

/** Map PortionSize enum → legacy numeric value (0=unset, 1=none, 2=little, 3=half, 4=well) */
export function mapPortionSize(portion: PortionSize | null | undefined): number {
  if (!portion) return 0;
  const map: Record<string, number> = {
    NONE: 1,
    LITTLE: 2,
    HALF: 3,
    MOST: 4,
    ALL: 4,
  };
  return map[portion] ?? 0;
}

/** Format a Prisma Time/DateTime field as "HH:mm" string */
export function formatTime(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Format a date as "YYYY-MM-DD" */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

/** Format a date as "F j Y, g:i a" (e.g., "February 22 2026, 3:00 pm") matching old PHP format */
export function formatDateTimeLong(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

/** Create standard header object matching old PHP API format */
export function makeHeader(
  name: string,
  status: boolean,
  count: number,
  extra?: Record<string, unknown>
) {
  return { name, status, count, ...extra };
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = (error as { code?: unknown }).code;
  return (
    code === "ECONNREFUSED" ||
    code === "P1001" ||
    code === "P1017"
  );
}

// ─────────────────────────────────────────────
// Rate Limiting (simple in-memory)
// ─────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function getRateLimitKey(request: NextRequest, suffix: string): string {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  return `${ip}:${suffix}`;
}
