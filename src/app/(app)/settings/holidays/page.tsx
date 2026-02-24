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
    description: (h.description ?? "") as string,
    date: (h.date as Date).toISOString().split("T")[0],
    endDate: h.endDate ? (h.endDate as Date).toISOString().split("T")[0] : "",
    repeated: (h.repeated ?? false) as boolean,
    type: (h.type ?? "HOLIDAY") as string,
    isActive: (h.isActive ?? true) as boolean,
    notificationTitle: (h.notificationTitle ?? "") as string,
    notificationMessage: (h.notificationMessage ?? "") as string,
    daysBefore: (h.daysBefore ?? 0) as number,
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
