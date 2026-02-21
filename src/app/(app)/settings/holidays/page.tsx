import { getHolidays } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { HolidaysClient } from "./holidays-client";

export default async function HolidayCalendarPage() {
  const [holidaysResult, branchesResult] = await Promise.all([
    getHolidays(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHolidays = (holidaysResult.success ? holidaysResult.data : []) as Array<any>;

  const serializedHolidays = rawHolidays.map((h) => ({
    id: h.id as string,
    name: h.name as string,
    date: (h.date as Date).toISOString().split("T")[0],
    branch: h.branch ? (h.branch.name as string) : "All Branches",
    branchId: (h.branchId ?? null) as string | null,
  }));

  return (
    <HolidaysClient
      holidays={serializedHolidays}
      branches={branches}
    />
  );
}
