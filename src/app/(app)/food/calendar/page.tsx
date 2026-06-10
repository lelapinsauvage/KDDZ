import { getFoodCalendarMonth, getFoods } from "@/lib/actions/food";
import { getBranches } from "@/lib/actions/branches";
import { getLegacyFoodCalendarActionPermissions } from "@/lib/legacy-food-calendar-action-permissions";
import { requireOrgSafe } from "@/lib/require-org";
import { FoodCalendarClient } from "./food-calendar-client";

interface PageProps {
  searchParams: Promise<{
    branch?: string;
    month?: string;
    year?: string;
    view?: string;
    date?: string;
  }>;
}

type CalendarViewMode = "month" | "week" | "day";

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

function parseView(value?: string): CalendarViewMode {
  return value === "week" || value === "day" ? value : "month";
}

function parseDateParam(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [dateYear, dateMonth, dateDay] = value.split("-").map(Number);
    const date = new Date(dateYear, dateMonth - 1, dateDay);
    if (
      date.getFullYear() === dateYear &&
      date.getMonth() === dateMonth - 1 &&
      date.getDate() === dateDay
    ) {
      return { date: value, year: dateYear, month: dateMonth };
    }
  }

  return null;
}

function parseFocusedDate(value: string | undefined, year: number, month: number) {
  const parsedDate = parseDateParam(value);
  if (parsedDate) return parsedDate.date;

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export default async function FoodCalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orgResult = await requireOrgSafe();
  const foodCalendarPermissions = orgResult.ok
    ? await getLegacyFoodCalendarActionPermissions(orgResult.ctx)
    : {
        canAddFoodToCalendar: false,
        canEditFoodCalendar: false,
        canApplyFoodAllBranches: false,
      };
  const branchesResult = await getBranches();
  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const requestedBranchId = params.branch?.trim();
  const defaultBranchId =
    requestedBranchId && branches.some((branch) => branch.id === requestedBranchId)
      ? requestedBranchId
      : branches[0]?.id ?? "";
  const now = new Date();
  const parsedDate = parseDateParam(params.date);
  const year = parseYear(params.year) ?? parsedDate?.year ?? now.getFullYear();
  const month = parseMonth(params.month) ?? parsedDate?.month ?? now.getMonth() + 1;
  const viewMode = parseView(params.view);
  const focusedDate = parseFocusedDate(params.date, year, month);

  const [calendarResult, { foods }] = await Promise.all([
    defaultBranchId
      ? getFoodCalendarMonth({ branchId: defaultBranchId, year, month })
      : Promise.resolve({ calendar: {} }),
    getFoods({ isActive: true }),
  ]);

  const calendar =
    ("calendar" in calendarResult ? calendarResult.calendar : {}) ?? {};

  const serializedFoods = foods.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category as "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK",
  }));

  // Serialize calendar entries
  const serializedCalendar: Record<
    string,
    Record<string, { id: string; foodId: string; foodName: string }>
  > = {};
  for (const [dateKey, meals] of Object.entries(calendar)) {
    serializedCalendar[dateKey] = {};
    for (const [mealType, entry] of Object.entries(
      meals as Record<
        string,
        { id: string; foodId: string; food: { name: string } }
      >
    )) {
      if (entry) {
        serializedCalendar[dateKey][mealType] = {
          id: entry.id,
          foodId: entry.foodId,
          foodName: entry.food.name,
        };
      }
    }
  }

  return (
    <FoodCalendarClient
      branches={branches}
      initialBranchId={defaultBranchId}
      initialYear={year}
      initialMonth={month}
      initialViewMode={viewMode}
      initialFocusedDate={focusedDate}
      initialCalendar={serializedCalendar}
      foods={serializedFoods}
      permissions={foodCalendarPermissions}
    />
  );
}
