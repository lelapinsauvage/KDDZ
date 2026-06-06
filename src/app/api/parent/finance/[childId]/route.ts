import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  formatChildName,
  formatDate,
  jsonError,
  jsonSuccess,
  makeHeader,
  verifyParentToken,
} from "@/lib/parent-auth";

type ParentFinanceChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

type ParentFinanceUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
  child: ParentFinanceChild;
};

type PaymentRow = {
  legacyId: number | null;
  amount: unknown;
  currency: string;
  date: Date;
  dateFrom: Date | null;
  dateTo: Date | null;
  method: string;
  category: string;
  notes: string | null;
  legacyData: Prisma.JsonValue | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  return handleRequest(request, { params });
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const postedChildId = request.method === "POST" ? await readPostedChildId(request) : null;
  const auth = await optionalAuthenticateParent(request);
  if (auth && "error" in auth) return auth.error;
  const parentUser = auth?.parentUser;

  try {
    let child = parentUser?.child ?? null;

    if (parentUser && !matchesParentUserChildId(parentUser, childId)) {
      return jsonError("Access denied", 403);
    }

    if (request.method === "POST") {
      if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);

      if (parentUser) {
        if (!matchesParentUserChildId(parentUser, postedChildId)) {
          return jsonError("Access denied", 403);
        }
      } else {
        child = await resolveLegacyFinanceChild(postedChildId);
        if (!child) return jsonSuccess([makeHeader("", false, 0)]);
      }
    }

    if (!child) {
      return jsonError("Unauthorized", 401);
    }

    const payments = await db.payment.findMany({
      where: { childId: child.id, deletedAt: null },
      orderBy: [{ legacyId: "asc" }, { date: "desc" }],
    });

    const header = makeHeader(formatChildName(child), true, payments.length);
    return jsonSuccess([header, ...payments.map(mapFinancePayment)]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

function mapFinancePayment(payment: PaymentRow) {
  const legacy = asRecord(payment.legacyData);

  return {
    type: readString(legacy, ["type"]) ?? payment.method,
    target: readString(legacy, ["target"]) ?? payment.category,
    for: readString(legacy, ["for"]) ?? payment.notes ?? "",
    year: readString(legacy, ["year"]) ?? String(payment.date.getUTCFullYear()),
    from: readString(legacy, ["from"]) ?? formatDate(payment.dateFrom),
    to: readString(legacy, ["to"]) ?? formatDate(payment.dateTo),
    currency: readString(legacy, ["currency"]) ?? payment.currency,
    datetime: readString(legacy, ["datetime"]) ?? formatDate(payment.date),
    amount: readString(legacy, ["amount"]) ?? String(payment.amount),
  };
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
  }).catch(() => "db-error" as const);

  if (parentUser === "db-error") {
    return { error: jsonError("Internal server error", 500) };
  }

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser: parentUser as ParentFinanceUser };
}

async function resolveLegacyFinanceChild(childId: string) {
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
    },
    orderBy: { createdAt: "asc" },
  });
}

function matchesParentUserChildId(parentUser: ParentFinanceUser, childId: string) {
  return (
    childId === parentUser.childId ||
    childId === parentUser.child.id ||
    childId === String(parentUser.legacyChildId ?? "") ||
    childId === String(parentUser.child.legacyId ?? "")
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
