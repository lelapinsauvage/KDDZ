import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  formatDate,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  try {
    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) {
      return jsonSuccess([makeHeader("", false, 0)]);
    }

    const reports = await db.absenceReport.findMany({
      where: { childId },
      orderBy: { date: "desc" },
    });

    const header = makeHeader(formatChildName(child), true, reports.length);

    const items = reports.map((r) => ({
      report_id: r.id,
      reportdate: formatDate(r.date),
      ab_reason: r.reason ?? "",
      ab_from: formatDate(r.date),
      ab_to: formatDate(r.date),
      attend_hos: "",
      hos_name: "",
      dr_name: "",
      is_rep_draft: r.status === "PENDING" ? "1" : "0",
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
