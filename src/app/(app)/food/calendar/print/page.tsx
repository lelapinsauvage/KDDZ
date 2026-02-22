import { getBranches } from "@/lib/actions/branches";
import { getFoodCalendarMonth } from "@/lib/actions/food";
import PrintClient from "./print-client";

export default async function PrintFoodCalendarPage() {
  const branchesResult = await getBranches();
  const branches = Array.isArray(branchesResult.data) ? branchesResult.data : [];

  const branchOptions = branches.map((b: { id: string; name: string }) => ({
    id: b.id,
    name: b.name,
  }));

  const firstBranchId = branchOptions[0]?.id ?? "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let initialCalendar = {};
  if (firstBranchId) {
    const result = await getFoodCalendarMonth({
      branchId: firstBranchId,
      year,
      month,
    });
    if ("calendar" in result && result.calendar) {
      initialCalendar = JSON.parse(JSON.stringify(result.calendar));
    }
  }

  return (
    <PrintClient
      branches={branchOptions}
      initialCalendar={initialCalendar}
      initialBranchId={firstBranchId}
      initialYear={year}
      initialMonth={month}
    />
  );
}
