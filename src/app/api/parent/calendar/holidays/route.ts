import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatDate,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  if (request.method === "POST") {
    const body = await readRequestBody(request);
    const postedChildId = readString(body, ["usites", "pid", "child_id", "childId"]);
    if (!postedChildId) {
      return jsonSuccess([makeHeader("", false, 0)]);
    }
    if (!matchesChildId(parentUser.child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const holidays = await db.holiday.findMany({
      where: { isActive: true },
      orderBy: { date: "asc" },
    });

    const header = makeHeader("", true, holidays.length);

    const items = holidays.map((h) => ({
      description: h.name || h.description || "",
      date: formatHolidayDate(h.date, h.repeated),
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
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

function matchesChildId(
  child: { id: string; legacyId: number | null },
  postedChildId: string
) {
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
    if (value !== undefined && value !== null) {
      const stringValue = String(value);
      if (stringValue.length > 0) return stringValue;
    }
  }
  return null;
}

function formatHolidayDate(date: Date, repeated: boolean) {
  if (!repeated) return formatDate(date);

  const nextDate = new Date(date);
  const currentYear = new Date().getFullYear();
  if (nextDate.getUTCFullYear() !== currentYear) {
    nextDate.setUTCFullYear(currentYear);
  }
  return formatDate(nextDate);
}
