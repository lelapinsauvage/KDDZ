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

type ParentAbsenceChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

type ParentAbsenceUser = {
  childId: string;
  child: ParentAbsenceChild;
};

type AbsenceReportRow = {
  id: string;
  legacyId: number | null;
  date: Date;
  reason: string | null;
  absentFrom: Date | null;
  absentTo: Date | null;
  hospitalized: boolean;
  hospitalName: string | null;
  doctorName: string | null;
  status: string;
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
  const parentUser = auth.parentUser as ParentAbsenceUser;

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
    const reports = await db.absenceReport.findMany({
      where: { childId: child.id },
      orderBy: [{ legacyId: "asc" }, { date: "desc" }],
    });

    const header = makeHeader(formatChildName(child), true, reports.length);
    return jsonSuccess([header, ...reports.map(mapAbsenceReport)]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

function mapAbsenceReport(report: AbsenceReportRow) {
  const legacy = asRecord(report.legacyData);

  return {
    report_id: readString(legacy, ["report_id"]) ?? report.legacyId ?? report.id,
    reportdate: readString(legacy, ["reportdate"]) ?? formatDate(report.date),
    ab_reason: readString(legacy, ["ab_reason"]) ?? report.reason ?? "",
    ab_from: readString(legacy, ["ab_from"]) ?? formatDate(report.absentFrom),
    ab_to: readString(legacy, ["ab_to"]) ?? formatDate(report.absentTo),
    attend_hos:
      readString(legacy, ["attend_hos"]) ?? (report.hospitalized ? "1" : "0"),
    hos_name: readString(legacy, ["hos_name"]) ?? report.hospitalName ?? "",
    dr_name: readString(legacy, ["dr_name"]) ?? report.doctorName ?? "",
    is_rep_draft:
      readString(legacy, ["is_rep_draft"]) ??
      (report.status === "PENDING" ? "1" : "0"),
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

function matchesChildId(child: ParentAbsenceChild, postedChildId: string) {
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
