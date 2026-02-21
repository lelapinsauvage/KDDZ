import { getDailyReports } from "@/lib/actions/daily-reports";
import { getBranches } from "@/lib/actions/branches";
import { DailyReportsClient } from "./daily-reports-client";

export default async function DailyReportsPage() {
  const [{ reports, total }, branchesResult] = await Promise.all([
    getDailyReports(),
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
  }));

  return (
    <DailyReportsClient
      reports={serializedReports}
      total={total}
      branches={branches}
    />
  );
}
