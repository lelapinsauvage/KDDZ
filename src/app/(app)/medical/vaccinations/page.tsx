import { getVaccinations } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { VaccinationsPageClient } from "./vaccinations-page-client";

export default async function VaccinationsPage() {
  const { organizationId: orgId } = await requireOrg();

  const [{ vaccinations, total }, branchesResult] = await Promise.all([
    getVaccinations({ pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedVaccinations = vaccinations.map((v) => {
    let vacStatus: "Up to date" | "Overdue" | "Upcoming" = "Up to date";
    if (v.nextDueDate) {
      const now = new Date();
      const dueDate = new Date(v.nextDueDate);
      if (dueDate < now) {
        vacStatus = "Overdue";
      } else {
        const sixtyDays = new Date();
        sixtyDays.setDate(sixtyDays.getDate() + 60);
        if (dueDate <= sixtyDays) {
          vacStatus = "Upcoming";
        }
      }
    }

    return {
      id: v.id,
      childId: v.childId,
      childName: `${v.child.firstName} ${v.child.lastName}`,
      vaccine: v.vaccineName,
      dateGiven: v.dateGiven ? v.dateGiven.toISOString().split("T")[0] : null,
      nextDue: v.nextDueDate ? v.nextDueDate.toISOString().split("T")[0] : null,
      notes: v.notes ?? "",
      vacStatus,
      branchId: v.child.branchId,
      branchName: v.child.branch?.name ?? "\u2014",
    };
  });

  // Fetch children with DOB for the timeline view
  const childrenWithDob = await db.child.findMany({
    where: { isActive: true, branch: { organizationId: orgId } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      branchId: true,
      branch: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childrenForTimeline = childrenWithDob.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    dob: c.dateOfBirth ? c.dateOfBirth.toISOString().split("T")[0] : null,
    branchId: c.branchId,
    branchName: c.branch?.name ?? "\u2014",
  }));

  return (
    <VaccinationsPageClient
      vaccinations={serializedVaccinations}
      total={total}
      branches={branches}
      children={childrenForTimeline}
    />
  );
}
