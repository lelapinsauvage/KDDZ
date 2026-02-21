import { getVaccinations } from "@/lib/actions/medical";
import { VaccinationsClient } from "./vaccinations-client";

export default async function VaccinationsPage() {
  const { vaccinations, total } = await getVaccinations();

  const serializedVaccinations = vaccinations.map((v) => {
    // Compute status based on nextDueDate
    let status: "Up to date" | "Overdue" | "Upcoming" = "Up to date";
    if (v.nextDueDate) {
      const now = new Date();
      const dueDate = new Date(v.nextDueDate);
      if (dueDate < now) {
        status = "Overdue";
      } else {
        // Upcoming if within 60 days
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
        if (dueDate <= sixtyDaysFromNow) {
          status = "Upcoming";
        }
      }
    }

    return {
      id: v.id,
      childName: `${v.child.firstName} ${v.child.lastName}`,
      vaccine: v.vaccineName,
      dateGiven: v.dateGiven ? v.dateGiven.toISOString().split("T")[0] : null,
      nextDue: v.nextDueDate ? v.nextDueDate.toISOString().split("T")[0] : null,
      status,
      branchName: v.child.branch?.name ?? "—",
    };
  });

  return <VaccinationsClient vaccinations={serializedVaccinations} total={total} />;
}
