import { getBranches } from "@/lib/actions/branches";
import { getFoodCalendarMonth } from "@/lib/actions/food";
import PrintClient from "./print-client";

interface PageProps {
  searchParams: Promise<{
    autoprint?: string;
    branch?: string;
    month?: string;
    year?: string;
  }>;
}

function parseMonth(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
}

function parseYear(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1970 && parsed <= 2100
    ? parsed
    : null;
}

export default async function PrintFoodCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const branchesResult = await getBranches();
  const branches = Array.isArray(branchesResult.data) ? branchesResult.data : [];

  const branchOptions = branches.map((b: { id: string; name: string }) => ({
    id: b.id,
    name: b.name,
  }));

  const firstBranchId = branchOptions[0]?.id ?? "";
  const now = new Date();
  const requestedBranchId = params.branch?.trim();
  const initialBranchId =
    requestedBranchId && branchOptions.some((b) => b.id === requestedBranchId)
      ? requestedBranchId
      : firstBranchId;
  const year = parseYear(params.year) ?? now.getFullYear();
  const month = parseMonth(params.month) ?? now.getMonth() + 1;

  let initialCalendar = {};
  if (initialBranchId) {
    const result = await getFoodCalendarMonth({
      branchId: initialBranchId,
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
      initialBranchId={initialBranchId}
      initialYear={year}
      initialMonth={month}
      autoPrint={params.autoprint === "1"}
    />
  );
}
