import { getVaccinationDueAlarms } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { VaccinationsClient } from "./vaccinations-client";

export default async function VaccinationAlarmsPage() {
  const [vaccinationsResult, branchesResult] = await Promise.all([
    getVaccinationDueAlarms(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVaccinations = (vaccinationsResult.success ? vaccinationsResult.data : []) as Array<any>;

  const serializedVaccinations = rawVaccinations.map((v) => {
    return {
      id: v.id as string,
      childId: v.childId as string,
      childName: v.childName as string,
      vaccine: v.vaccineName as string,
      dueDate: (v.dueDate as Date).toISOString().split("T")[0],
      daysUntilDue: v.daysUntilDue as number,
      branchId: v.branchId as string,
      branch: v.branchName as string,
      className: (v.className ?? "—") as string,
      message: v.message as string,
    };
  });

  return (
    <VaccinationsClient
      vaccinations={serializedVaccinations}
      branches={branches}
    />
  );
}
