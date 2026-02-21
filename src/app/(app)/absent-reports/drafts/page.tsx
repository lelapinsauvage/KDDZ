import { db } from "@/lib/db";
import { getBranches } from "@/lib/actions/branches";
import { DraftsClient } from "./drafts-client";

// Note: The AbsenceReport schema does not have a "DRAFT" status.
// Draft absence reports are treated as PENDING absence reports
// that haven't been approved/rejected yet.

export default async function DraftAbsentReportsPage() {
  // Fetch pending absence reports (treated as drafts)
  const absenceReports = await db.absenceReport.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      child: {
        include: {
          branch: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Fetch branches for the filter
  const branchesResult = await getBranches();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branchesRaw = branchesResult.success ? (branchesResult.data as any[]) ?? [] : [];

  const branches = branchesRaw.map((b) => ({
    id: b.id as string,
    name: b.name as string,
  }));

  // Serialize to plain objects
  const drafts = absenceReports.map((r) => ({
    id: r.id,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    date: r.date.toISOString().slice(0, 10),
    reason: r.reason ?? "",
    status: "DRAFT" as const,
    createdBy: r.createdBy?.name ?? r.createdBy?.email ?? "Unknown",
    branchId: r.child.branchId,
    branchName: r.child.branch?.name ?? "Unknown",
  }));

  return (
    <DraftsClient
      drafts={drafts}
      branches={branches}
    />
  );
}
