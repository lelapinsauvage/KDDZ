import { getDraftReports } from "@/lib/actions/daily-reports";
import { getBranches } from "@/lib/actions/branches";
import { DraftDailyReportsClient } from "./draft-daily-reports-client";

export default async function DraftDailyReportsPage() {
  const [{ reports }, branchesResult] = await Promise.all([
    getDraftReports(),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const serializedReports = reports.map((report) => ({
    id: report.id,
    childName: `${report.child.firstName} ${report.child.lastName}`,
    date: report.reportDate.toISOString().split("T")[0],
    status: "DRAFT" as const,
    branchId: report.child.branchId,
    branchName: report.child.branch?.name ?? "—",
  }));

  return (
    <DraftDailyReportsClient
      reports={serializedReports}
      branches={branches}
    />
  );
}
