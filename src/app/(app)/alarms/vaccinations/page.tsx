import { getOverdueVaccinations } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { VaccinationsClient } from "./vaccinations-client";

export default async function VaccinationAlarmsPage() {
  const [vaccinationsResult, branchesResult] = await Promise.all([
    getOverdueVaccinations(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVaccinations = (vaccinationsResult.success ? vaccinationsResult.data : []) as Array<any>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedVaccinations = rawVaccinations.map((v) => {
    const dueDate = v.nextDueDate ? new Date(v.nextDueDate) : new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: v.id as string,
      childId: v.child.id as string,
      childName: `${v.child.firstName} ${v.child.lastName}` as string,
      vaccine: v.vaccineName as string,
      dueDate: v.nextDueDate
        ? (v.nextDueDate as Date).toISOString().split("T")[0]
        : "",
      daysOverdue,
      branch: (v.child.branch?.name ?? "—") as string,
      className: (v.child.class?.name ?? "—") as string,
    };
  });

  return (
    <VaccinationsClient
      vaccinations={serializedVaccinations}
      branches={branches}
    />
  );
}
