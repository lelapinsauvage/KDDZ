import { getFoodCalendar, getFoods } from "@/lib/actions/food";
import { getBranches } from "@/lib/actions/branches";
import { FoodCalendarClient } from "./food-calendar-client";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default async function FoodCalendarPage() {
  const branchesResult = await getBranches();
  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const defaultBranchId = branches[0]?.id ?? "";
  const weekStart = getMonday(new Date());

  const [calendarResult, { foods }] = await Promise.all([
    defaultBranchId
      ? getFoodCalendar({ branchId: defaultBranchId, weekStart })
      : Promise.resolve({ calendar: {} }),
    getFoods({ isActive: true }),
  ]);

  const calendar = ("calendar" in calendarResult ? calendarResult.calendar : {}) ?? {};

  const serializedFoods = foods.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category as "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK",
  }));

  // Serialize calendar: { [date]: { BREAKFAST?: { id, foodId, food }, ... } }
  const serializedCalendar: Record<
    string,
    Record<string, { id: string; foodId: string; foodName: string }>
  > = {};
  for (const [dateKey, meals] of Object.entries(calendar)) {
    serializedCalendar[dateKey] = {};
    for (const [mealType, entry] of Object.entries(meals as Record<string, { id: string; foodId: string; food: { name: string } }>)) {
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
      initialWeekStart={weekStart}
      initialCalendar={serializedCalendar}
      foods={serializedFoods}
    />
  );
}
