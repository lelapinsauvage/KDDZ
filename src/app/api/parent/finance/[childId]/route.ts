import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatChildName,
  formatDate,
  jsonError,
  jsonSuccess,
  makeHeader,
  verifyChildAccess,
} from "@/lib/parent-auth";

type ParentFinanceChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

type ParentFinanceUser = {
  childId: string;
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

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const parentUser = auth.parentUser as ParentFinanceUser;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  if (request.method === "POST") {
    const postedChildId = await readPostedChildId(request);
    if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);
    if (!matchesChildId(parentUser.child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const child = parentUser.child;
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
    const form = await request.formData();
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  return null;
}

function matchesChildId(child: ParentFinanceChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
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
