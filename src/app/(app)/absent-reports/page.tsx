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

  // Serialize to plain objects — match daily reports structure
  const reports = absenceReports.map((r) => ({
    id: r.id,
    photo: r.child.photo ?? null,
    firstName: r.child.firstName,
    lastName: r.child.lastName,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    status: r.status as "PENDING" | "APPROVED" | "REJECTED",
    branchId: r.child.branchId,
    branchName: r.child.branch?.name ?? "—",
    className: r.child.class?.name ?? "—",
    reportDate: r.date.toISOString().split("T")[0],
    createdAt: r.createdAt.toISOString(),
    reason: r.reason ?? "",
  }));

  return (
    <AbsentReportsClient
      reports={reports}
      branches={branches}
      initialStatusFilter={params.status ?? "all"}
    />
  );
}
