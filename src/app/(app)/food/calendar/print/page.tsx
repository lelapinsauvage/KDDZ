import { getBranches } from "@/lib/actions/branches";
import { getFoodCalendar } from "@/lib/actions/food";
import PrintClient from "./print-client";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PrintFoodCalendarPage() {
  const branchesResult = await getBranches();
  const branches = Array.isArray(branchesResult.data) ? branchesResult.data : [];

  const branchOptions = branches.map((b: { id: string; name: string }) => ({
    id: b.id,
    name: b.name,
  }));

  const firstBranchId = branchOptions[0]?.id ?? "";
  const monday = getMonday(new Date());
  const weekStartISO = monday.toISOString().split("T")[0];

  // Fetch initial calendar data for the first branch and current week
  let initialCalendar = {};
  if (firstBranchId) {
    const result = await getFoodCalendar({
      branchId: firstBranchId,
      weekStart: weekStartISO,
    });
    if (result.calendar) {
      // Serialize dates - the calendar is already keyed by date strings
      initialCalendar = JSON.parse(JSON.stringify(result.calendar));
    }
  }

  return (
    <PrintClient
      branches={branchOptions}
      initialCalendar={initialCalendar}
      initialBranchId={firstBranchId}
    />
  );
}
