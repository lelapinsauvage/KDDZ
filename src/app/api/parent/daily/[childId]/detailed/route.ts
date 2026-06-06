import { NextRequest } from "next/server";
import {
  authenticateParent,
  formatChildName,
  jsonError,
  jsonSuccess,
  makeHeader,
  verifyChildAccess,
} from "@/lib/parent-auth";
import {
  loadParentDailyReports,
  mapLegacyDetailedDailyReport,
  matchesParentDailyChildId,
  readPostedParentDailyChildId,
  resolveTakenMedicineNames,
  type ParentDailyChild,
} from "@/lib/parent-daily-contract";

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
  const parentUser = auth.parentUser as {
    childId: string;
    child: ParentDailyChild;
  };

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  if (request.method === "POST") {
    const postedChildId = await readPostedParentDailyChildId(request);
    if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);
    if (!matchesParentDailyChildId(parentUser.child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const child = parentUser.child;
    const reports = await loadParentDailyReports(child.id);
    const medicineNames = await resolveTakenMedicineNames(reports);
    const header = makeHeader(formatChildName(child), true, reports.length);

    return jsonSuccess([
      header,
      ...reports.map((report) =>
        mapLegacyDetailedDailyReport(report, medicineNames)
      ),
    ]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
