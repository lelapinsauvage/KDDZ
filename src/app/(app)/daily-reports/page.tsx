import { getDailyReports } from "@/lib/actions/daily-reports";
import { getBranches } from "@/lib/actions/branches";
import { DailyReportsClient } from "./daily-reports-client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function DailyReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [{ reports, total }, branchesResult] = await Promise.all([
    getDailyReports({ pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  // Serialize dates for client component
  const serializedReports = reports.map((report) => ({
    id: report.id,
    date: report.reportDate.toISOString().split("T")[0],
    childName: `${report.child.firstName} ${report.child.lastName}`,
    className: report.child.class?.name ?? "—",
    branchId: report.child.branchId,
    branchName: report.child.branch?.name ?? "—",
    breakfast: report.breakfastPortion ?? null,
    lunch: report.lunchPortion ?? null,
    sleep: report.isSleep,
    sleepFrom: report.sleepFrom
      ? report.sleepFrom.toISOString()
      : null,
    sleepTo: report.sleepTo
      ? report.sleepTo.toISOString()
      : null,
    mood: report.mood ?? null,
    status: report.status,
    createdBy: report.createdBy?.name ?? report.createdBy?.email ?? "—",
  }));

  return (
    <DailyReportsClient
      reports={serializedReports}
      total={total}
      branches={branches}
      initialStatusFilter={params.status ?? "all"}
    />
  );
}
