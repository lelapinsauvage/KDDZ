import { NextRequest } from "next/server";
import {
  formatChildName,
  jsonError,
  jsonSuccess,
  makeHeader,
} from "@/lib/parent-auth";
import {
  loadParentDailyReports,
  mapLegacyDetailedDailyReport,
  matchesParentDailyUserChildId,
  optionalAuthenticateParentDaily,
  readPostedParentDailyChildId,
  resolveLegacyParentDailyChild,
  resolveTakenMedicineNames,
  type ParentDailyChild,
  type ParentDailyUser,
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

  const postedChildId =
    request.method === "POST" ? await readPostedParentDailyChildId(request) : null;
  const auth = await optionalAuthenticateParentDaily(request);
  if (auth && "error" in auth) return auth.error;
  const parentUser = auth?.parentUser as ParentDailyUser | undefined;

  try {
    let child: ParentDailyChild | null = parentUser?.child ?? null;

    if (parentUser && !matchesParentDailyUserChildId(parentUser, childId)) {
      return jsonError("Access denied", 403);
    }

    if (request.method === "POST") {
      if (!postedChildId) return jsonSuccess([makeHeader("", false, 0)]);

      if (parentUser) {
        if (!matchesParentDailyUserChildId(parentUser, postedChildId)) {
          return jsonError("Access denied", 403);
        }
      } else {
        child = await resolveLegacyParentDailyChild(postedChildId);
        if (!child) return jsonSuccess([makeHeader("", false, 0)]);
      }
    }

    if (!child) {
      return jsonError("Unauthorized", 401);
    }

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
