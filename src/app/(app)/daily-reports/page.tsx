import { getDailyReports } from "@/lib/actions/daily-reports";
import { getBranches } from "@/lib/actions/branches";
import { DailyReportsClient, type DailyReportRow } from "./daily-reports-client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

function normalizeStatus(status?: string) {
  const value = status?.toUpperCase();
  if (value === "DRAFT" || value === "SUBMITTED" || value === "ALL") {
    return value;
  }
  return "SUBMITTED";
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

export default async function DailyReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialStatusFilter = normalizeStatus(params.status);

  const [{ reports, total }, branchesResult] = await Promise.all([
    getDailyReports({
      pageSize: 500,
      status: initialStatusFilter === "ALL" ? undefined : initialStatusFilter,
    }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  // Serialize dates for client component
  const serializedReports: DailyReportRow[] = reports.map((report) => {
    const legacyStatus = legacyString(report.legacyData, "status");
    return {
      id: report.id,
      legacyReportId: legacyNumber(report.legacyData, "report_id"),
      childId: report.childId,
      childNumber: report.child.childNumber ?? report.child.legacyId?.toString() ?? "—",
      photo: report.child.photo ?? null,
      firstName: report.child.firstName,
      lastName: report.child.lastName,
      childName: `${report.child.firstName} ${report.child.lastName}`,
      classId: report.child.classId ?? null,
      className: report.child.class?.name ?? "—",
      branchId: report.child.branchId,
      branchName: report.child.branch?.name ?? "—",
      dailyStatus: legacyStatus ?? "present",
      reportDate: report.reportDate.toISOString().split("T")[0],
      createdAt: report.createdAt.toISOString(),
      workflowStatus: report.status,
      createdBy: report.createdBy?.name ?? report.createdBy?.email ?? "—",
    };
  });

  return (
    <DailyReportsClient
      reports={serializedReports}
      total={total}
      branches={branches}
      initialStatusFilter={initialStatusFilter}
    />
  );
}
