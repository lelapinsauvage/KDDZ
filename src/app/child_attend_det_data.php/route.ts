import { NextRequest, NextResponse } from "next/server";

import {
  getChildAttendanceMatrix,
  type ChildAttendanceMatrix,
  type ChildAttendanceMatrixCell,
} from "@/lib/actions/attendance";
import { resolveLegacyChildId } from "@/lib/legacy-child";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY_COLUMNS = Array.from({ length: 31 }, (_, index) => index + 1);

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

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function legacyBadgeHref(cell: ChildAttendanceMatrixCell, childId: string) {
  if (!cell.href) return null;
  const encodedChildId = encodeURIComponent(childId);

  if (cell.code === "N" && cell.date) {
    return `/dailyreport.php?id=${encodedChildId}&date=${encodeURIComponent(cell.date)}`;
  }

  const dailyReportMatch = cell.href.match(/^\/daily-reports\/([^/?#]+)/);
  if (dailyReportMatch?.[1]) {
    return `/dailyreport.php?id=${encodedChildId}&fid=${encodeURIComponent(dailyReportMatch[1])}`;
  }

  const absenceReportMatch = cell.href.match(/^\/absent-reports\/([^/?#]+)/);
  if (absenceReportMatch?.[1]) {
    return `/absentreport.php?id=${encodedChildId}&fid=${encodeURIComponent(absenceReportMatch[1])}`;
  }

  return cell.href;
}

function renderLinkedBadge(cell: ChildAttendanceMatrixCell, childId: string, color: string) {
  const label = escapeHtml(cell.code);
  const href = legacyBadgeHref(cell, childId);
  if (!href) {
    return `<span class="badge" style="background: ${color};">${label}</span>`;
  }

  return `<a target="_blank" href="${escapeHtml(href)}" class="badge" style="background: ${color};">${label}</a>`;
}

function renderAttendanceCell(cell: ChildAttendanceMatrixCell, childId: string) {
  switch (cell.code) {
    case "N":
      return renderLinkedBadge(cell, childId, "purple");
    case "P":
      return renderLinkedBadge(cell, childId, "green");
    case "A":
      return renderLinkedBadge(cell, childId, "pink");
    case "W":
      return '<span class="badge badge-danger" style="background: red;">W</span>';
    case "H":
      return '<span class="badge" style="background: yellow; color: black">H</span>';
    case "-":
      return "-";
    default:
      return "";
  }
}

function renderChildAttendanceFragment(matrix: ChildAttendanceMatrix, childId: string) {
  const tableHeaders = ["Month", ...DAY_COLUMNS.map(String), "P/A"];
  const headerCells = tableHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyRows = matrix.months
    .map((month) => {
      const attendanceCells = month.cells.map((cell) => renderAttendanceCell(cell, childId));
      const presentAbsent = `${month.presentCount} / ${month.absentCount}`;

      return `<tr>${[
        `<th>${escapeHtml(month.monthLabel)}</th>`,
        ...attendanceCells.map((cellHtml) => `<th>${cellHtml}</th>`),
        `<th>${escapeHtml(presentAbsent)}</th>`,
      ].join("")}</tr>`;
    })
    .join("");

  return `<table class="table table-striped table-bordered table-hover" id="datatable_ajax">
    <thead>
        <tr class="heading">${headerCells}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
        <tr class="heading">${headerCells}</tr>
    </tfoot>
</table>`;
}

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
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
  const legacyChildId = await readField(request, "id");
  if (!legacyChildId?.trim()) {
    return htmlResponse("Child not found", 404);
  }

  const childId = await resolveLegacyChildId(legacyChildId);
  if (!childId) {
    return htmlResponse("Child not found", 404);
  }

  const matrix = await getChildAttendanceMatrix(childId);
  return htmlResponse(renderChildAttendanceFragment(matrix, childId));
}
