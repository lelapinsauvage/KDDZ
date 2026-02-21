"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFoodCalendar, setFoodCalendarEntry } from "@/lib/actions/food";

// ── Types ───────────────────────────────────────
type MealType = "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK";

interface FoodOption {
  id: string;
  name: string;
  category: MealType;
}

interface CalendarEntryData {
  id: string;
  foodId: string;
  foodName: string;
}

type CalendarData = Record<string, Record<string, CalendarEntryData>>;

// ── Helpers ─────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const MEALS: { type: MealType; label: string; bg: string }[] = [
  { type: "BREAKFAST", label: "Breakfast", bg: "bg-blue-50" },
  { type: "LUNCH", label: "Lunch", bg: "bg-green-50" },
  { type: "DESSERT", label: "Dessert", bg: "bg-pink-50" },
  { type: "SNACK", label: "Snack", bg: "bg-yellow-50" },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return `${formatShortDate(monday)} - ${formatShortDate(friday)}, ${monday.getFullYear()}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Props ───────────────────────────────────────
interface FoodCalendarClientProps {
  branches: Array<{ id: string; name: string }>;
  initialBranchId: string;
  initialWeekStart: string;
  initialCalendar: CalendarData;
  foods: FoodOption[];
}

// ── Page Component ──────────────────────────────
export function FoodCalendarClient({
  branches,
  initialBranchId,
  initialWeekStart,
  initialCalendar,
  foods,
}: FoodCalendarClientProps) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart + "T00:00:00"));
  const [branch, setBranch] = useState(initialBranchId);
  const [calendar, setCalendar] = useState<CalendarData>(initialCalendar);
  const [isPending, startTransition] = useTransition();

  // Fetch calendar data when branch or week changes
  const fetchCalendar = useCallback(
    async (branchId: string, monday: Date) => {
      if (!branchId) return;
      const result = await getFoodCalendar({
        branchId,
        weekStart: toISODate(monday),
      });
      if ("calendar" in result && result.calendar) {
        const newCalendar: CalendarData = {};
        for (const [dateKey, meals] of Object.entries(result.calendar)) {
          newCalendar[dateKey] = {};
          for (const [mealType, entry] of Object.entries(
            meals as Record<string, { id: string; foodId: string; food: { name: string } }>
          )) {
            if (entry) {
              newCalendar[dateKey][mealType] = {
                id: entry.id,
                foodId: entry.foodId,
                foodName: entry.food.name,
              };
            }
          }
        }
        setCalendar(newCalendar);
      }
    },
    []
  );

  const prevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      startTransition(() => {
        fetchCalendar(branch, d);
      });
      return d;
    });
  }, [branch, fetchCalendar, startTransition]);

  const nextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      startTransition(() => {
        fetchCalendar(branch, d);
      });
      return d;
    });
  }, [branch, fetchCalendar, startTransition]);

  const handleBranchChange = useCallback(
    (newBranch: string) => {
      setBranch(newBranch);
      startTransition(() => {
        fetchCalendar(newBranch, weekStart);
      });
    },
    [weekStart, fetchCalendar, startTransition]
  );

  // Get date for a given day column
  const getDayDate = useCallback(
    (dayIndex: number) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dayIndex);
      return d;
    },
    [weekStart]
  );

  // Get food for a cell
  const getFood = useCallback(
    (dayIndex: number, mealType: MealType): string | null => {
      const dateKey = toISODate(getDayDate(dayIndex));
      return calendar[dateKey]?.[mealType]?.foodId ?? null;
    },
    [calendar, getDayDate]
  );

  // Get food name for a cell
  const getFoodName = useCallback(
    (foodId: string | null): string => {
      if (!foodId) return "";
      return foods.find((f) => f.id === foodId)?.name ?? "";
    },
    [foods]
  );

  // Set food for a cell
  const handleSetFood = useCallback(
    async (dayIndex: number, mealType: MealType, foodId: string | null) => {
      if (!foodId || !branch) return;
      const dateStr = toISODate(getDayDate(dayIndex));

      // Optimistic update
      setCalendar((prev) => {
        const updated = { ...prev };
        if (!updated[dateStr]) updated[dateStr] = {};
        updated[dateStr] = {
          ...updated[dateStr],
          [mealType]: {
            id: "",
            foodId,
            foodName: getFoodName(foodId),
          },
        };
        return updated;
      });

      // Persist
      await setFoodCalendarEntry({
        branchId: branch,
        date: dateStr,
        mealType,
        foodId,
      });
    },
    [branch, getDayDate, getFoodName]
  );

  // Foods filtered by meal type for the selector
  const getFoodOptionsForMeal = useMemo(() => {
    const map: Record<MealType, FoodOption[]> = {
      BREAKFAST: foods.filter((f) => f.category === "BREAKFAST"),
      LUNCH: foods.filter((f) => f.category === "LUNCH"),
      DESSERT: foods.filter((f) => f.category === "DESSERT"),
      SNACK: foods.filter((f) => f.category === "SNACK"),
    };
    return map;
  }, [foods]);

  return (
    <>
      <PageHeader
        title="Food Calendar"
        breadcrumbs={[
          { label: "Food Management", href: "/food" },
          { label: "Food Calendar" },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch selector */}
          <Select value={branch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek} disabled={isPending}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-[#333]">
              <CalendarIcon className="size-4 text-muted-foreground" />
              {formatDateRange(weekStart)}
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek} disabled={isPending}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {branches.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No branches available. Create a branch first.</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-[120px] border-b border-r bg-[#f1f3f6] px-4 py-3 text-left text-xs font-semibold uppercase text-[#6f7b8a]">
                        Meal
                      </th>
                      {DAYS.map((day, i) => (
                        <th
                          key={day}
                          className="border-b border-r last:border-r-0 bg-[#f1f3f6] px-4 py-3 text-center text-xs font-semibold uppercase text-[#6f7b8a]"
                        >
                          <div>{day}</div>
                          <div className="mt-0.5 text-[10px] font-normal normal-case text-muted-foreground">
                            {formatShortDate(getDayDate(i))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEALS.map((meal) => (
                      <tr key={meal.type}>
                        <td
                          className={`border-b border-r px-4 py-3 text-sm font-medium text-[#333] ${meal.bg}`}
                        >
                          {meal.label}
                        </td>
                        {DAYS.map((_, dayIdx) => {
                          const currentFoodId = getFood(dayIdx, meal.type);
                          const options = getFoodOptionsForMeal[meal.type];
                          return (
                            <td
                              key={dayIdx}
                              className={`border-b border-r last:border-r-0 px-2 py-2 ${meal.bg}`}
                            >
                              <Select
                                value={currentFoodId ?? "NONE"}
                                onValueChange={(v) =>
                                  handleSetFood(
                                    dayIdx,
                                    meal.type,
                                    v === "NONE" ? null : v
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-full border-transparent bg-white/70 text-xs shadow-none hover:border-[#1caf9a]/30">
                                  <SelectValue placeholder="Select...">
                                    {currentFoodId
                                      ? getFoodName(currentFoodId)
                                      : "Select..."}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE">
                                    <span className="text-muted-foreground">
                                      -- None --
                                    </span>
                                  </SelectItem>
                                  {options.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      {f.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
