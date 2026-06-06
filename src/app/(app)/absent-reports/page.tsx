import { getAbsenceReports } from "@/lib/actions/absent-reports";
import { getBranches } from "@/lib/actions/branches";
import {
  AbsentReportsClient,
  type AbsenceReportRow,
} from "./absent-reports-client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

function normalizeStatus(status?: string) {
  const value = status?.toUpperCase();
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "ALL") {
    return value;
  }
  return "APPROVED";
}

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

export default async function AbsentReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialStatusFilter = normalizeStatus(params.status);

  const [{ reports: absenceReports, total }, branchesResult] = await Promise.all([
    getAbsenceReports({
      pageSize: 500,
      status: initialStatusFilter === "ALL" ? undefined : initialStatusFilter,
    }),
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
      initialStatusFilter={initialStatusFilter}
    />
  );
}
