import { NextRequest, NextResponse } from "next/server";

import {
  loadMonthlyAttendance,
  monthKeyFromDate,
  normalizeMonthKey,
} from "@/app/(app)/reports/monthly/monthly-data";
import { renderMonthlyAttendanceFragment } from "@/lib/legacy/monthly-attendance-fragment";

export const runtime = "nodejs";

async function readField(request: NextRequest, name: string) {
  const queryValue = request.nextUrl.searchParams.get(name);
  if (queryValue) return queryValue;
  if (request.method !== "POST") return null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const value = body?.[name];
    return typeof value === "string" || typeof value === "number" ? String(value) : null;
  }

  const formData = await request.formData().catch(() => null);
  const value = formData?.get(name);
  return typeof value === "string" ? value : null;
}

function htmlResponse(html: string) {
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const from = await readField(request, "from");
  const monthKey =
    normalizeMonthKey(from ?? undefined) ?? monthKeyFromDate(new Date());
  const { rows } = await loadMonthlyAttendance({
    branchId: null,
    classId: null,
    monthKey,
  });

  return htmlResponse(
    renderMonthlyAttendanceFragment({
      rows,
      includeBranch: false,
    })
  );
}
