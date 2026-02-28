import { getAbsenceReports } from "@/lib/actions/absent-reports";
import { getBranches } from "@/lib/actions/branches";
import { AbsentReportsClient } from "./absent-reports-client";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AbsentReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [{ reports: absenceReports }, branchesResult] = await Promise.all([
    getAbsenceReports({ pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  // Serialize to plain objects
  const reports = absenceReports.map((r) => ({
    id: r.id,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    date: r.date.toISOString().slice(0, 10),
    reason: r.reason ?? "",
    status: r.status as "PENDING" | "APPROVED" | "REJECTED",
    createdBy: r.createdBy?.name ?? r.createdBy?.email ?? "Unknown",
    branchId: r.child.branchId,
    branchName: r.child.branch?.name ?? "Unknown",
  }));

  return (
    <AbsentReportsClient
      reports={reports}
      branches={branches}
      initialStatusFilter={params.status ?? "ALL"}
    />
  );
}
