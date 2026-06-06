import { getPendingAbsenceReports } from "@/lib/actions/absent-reports";
import { getBranches } from "@/lib/actions/branches";
import {
  AbsentReportsClient,
  type AbsenceReportRow,
} from "../absent-reports-client";

function legacyString(legacyData: unknown, key: string) {
  if (!legacyData || typeof legacyData !== "object" || Array.isArray(legacyData)) {
    return null;
  }
  const value = (legacyData as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function legacyNumber(legacyData: unknown, key: string) {
  if (!legacyData || typeof legacyData !== "object" || Array.isArray(legacyData)) {
    return null;
  }
  const value = (legacyData as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function DraftAbsentReportsPage() {
  const [{ reports: absenceReports, total }, branchesResult] = await Promise.all([
    getPendingAbsenceReports({ pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const reports: AbsenceReportRow[] = absenceReports.map((report) => ({
    id: report.id,
    legacyReportId: report.legacyId ?? legacyNumber(report.legacyData, "report_id"),
    childId: report.childId,
    childNumber: report.child.childNumber ?? report.child.legacyId?.toString() ?? "—",
    photo: report.child.photo ?? null,
    firstName: report.child.firstName,
    lastName: report.child.lastName,
    childName: `${report.child.firstName} ${report.child.lastName}`,
    branchId: report.child.branchId,
    branchName: report.child.branch?.name ?? "—",
    classId: report.child.classId ?? null,
    className: report.child.class?.name ?? "—",
    absenceReason: legacyString(report.legacyData, "ab_reason") ?? report.reason ?? "",
    reportDate: report.date.toISOString().split("T")[0],
    createdAt: report.createdAt.toISOString(),
    workflowStatus: report.status,
    createdBy: report.createdBy?.name ?? report.createdBy?.email ?? "—",
  }));

  return (
    <AbsentReportsClient
      reports={reports}
      total={total}
      branches={branches}
      initialStatusFilter="PENDING"
      variant="drafts"
    />
  );
}
