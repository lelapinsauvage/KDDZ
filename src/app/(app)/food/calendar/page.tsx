import { getFoodCalendarMonth, getFoods } from "@/lib/actions/food";
import { getBranches } from "@/lib/actions/branches";
import { FoodCalendarClient } from "./food-calendar-client";

export default async function FoodCalendarPage() {
  const branchesResult = await getBranches();
  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const defaultBranchId = branches[0]?.id ?? "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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
      initialCalendar={serializedCalendar}
      foods={serializedFoods}
    />
  );
}
