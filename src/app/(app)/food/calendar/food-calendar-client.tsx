"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFoodCalendarMonth,
  setFoodCalendarEntry,
  deleteFoodCalendarEntry,
} from "@/lib/actions/food";

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
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MEALS: { type: MealType; label: string; color: string; bg: string; abbr: string }[] = [
  { type: "BREAKFAST", label: "Breakfast", color: "text-blue-700", bg: "bg-blue-100", abbr: "B" },
  { type: "LUNCH", label: "Lunch", color: "text-green-700", bg: "bg-green-100", abbr: "L" },
  { type: "DESSERT", label: "Dessert", color: "text-pink-700", bg: "bg-pink-100", abbr: "D" },
  { type: "SNACK", label: "Snack", color: "text-amber-700", bg: "bg-amber-100", abbr: "S" },
];

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ── Props ───────────────────────────────────────
interface FoodCalendarClientProps {
  branches: Array<{ id: string; name: string }>;
  initialBranchId: string;
  initialYear: number;
  initialMonth: number;
  initialCalendar: CalendarData;
  foods: FoodOption[];
}

// ── Page Component ──────────────────────────────
export function FoodCalendarClient({
  branches,
  initialBranchId,
  initialYear,
  initialMonth,
  initialCalendar,
  foods,
}: FoodCalendarClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [branch, setBranch] = useState(initialBranchId);
  const [calendar, setCalendar] = useState<CalendarData>(initialCalendar);
  const [isPending, startTransition] = useTransition();

  // Day assignment dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dialogBreakfast, setDialogBreakfast] = useState("NONE");
  const [dialogLunch, setDialogLunch] = useState("NONE");
  const [dialogDessert, setDialogDessert] = useState("NONE");
  const [dialogSnack, setDialogSnack] = useState("NONE");

  const fetchCalendar = useCallback(
    async (branchId: string, y: number, m: number) => {
      if (!branchId) return;
      const result = await getFoodCalendarMonth({ branchId, year: y, month: m });
      if ("calendar" in result && result.calendar) {
        const newCalendar: CalendarData = {};
        for (const [dateKey, meals] of Object.entries(result.calendar)) {
          newCalendar[dateKey] = {};
          for (const [mealType, entry] of Object.entries(
            meals as Record<
              string,
              { id: string; foodId: string; food: { name: string } }
            >
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

  const prevMonth = useCallback(() => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    startTransition(() => {
      fetchCalendar(branch, newYear, newMonth);
    });
  }, [branch, month, year, fetchCalendar, startTransition]);

  const nextMonth = useCallback(() => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    startTransition(() => {
      fetchCalendar(branch, newYear, newMonth);
    });
  }, [branch, month, year, fetchCalendar, startTransition]);

  const handleBranchChange = useCallback(
    (newBranch: string) => {
      setBranch(newBranch);
      startTransition(() => {
        fetchCalendar(newBranch, year, month);
      });
    },
    [year, month, fetchCalendar, startTransition]
  );

  // Open day assignment dialog
  const openDayDialog = useCallback(
    (day: number) => {
      const dateKey = toISODate(year, month, day);
      setSelectedDate(dateKey);
      const dayData = calendar[dateKey] ?? {};
      setDialogBreakfast(dayData["BREAKFAST"]?.foodId ?? "NONE");
      setDialogLunch(dayData["LUNCH"]?.foodId ?? "NONE");
      setDialogDessert(dayData["DESSERT"]?.foodId ?? "NONE");
      setDialogSnack(dayData["SNACK"]?.foodId ?? "NONE");
      setDialogOpen(true);
    },
    [year, month, calendar]
  );

  // Save day assignment
  const handleSaveDay = useCallback(() => {
    if (!branch || !selectedDate) return;

    startTransition(async () => {
      const mealSelections: { type: MealType; foodId: string }[] = [
        { type: "BREAKFAST", foodId: dialogBreakfast },
        { type: "LUNCH", foodId: dialogLunch },
        { type: "DESSERT", foodId: dialogDessert },
        { type: "SNACK", foodId: dialogSnack },
      ];

      for (const { type, foodId } of mealSelections) {
        const existing = calendar[selectedDate]?.[type];
        if (foodId === "NONE") {
          // Remove if existed
          if (existing?.id) {
            await deleteFoodCalendarEntry(existing.id);
          }
        } else {
          await setFoodCalendarEntry({
            branchId: branch,
            date: selectedDate,
            mealType: type,
            foodId,
          });
        }
      }

      // Refresh
      await fetchCalendar(branch, year, month);
      setDialogOpen(false);
    });
  }, [
    branch,
    selectedDate,
    dialogBreakfast,
    dialogLunch,
    dialogDessert,
    dialogSnack,
    calendar,
    year,
    month,
    fetchCalendar,
    startTransition,
  ]);

  // Foods filtered by category
  const foodsByCategory = useMemo(() => {
    const map: Record<MealType, FoodOption[]> = {
      BREAKFAST: foods.filter((f) => f.category === "BREAKFAST"),
      LUNCH: foods.filter((f) => f.category === "LUNCH"),
      DESSERT: foods.filter((f) => f.category === "DESSERT"),
      SNACK: foods.filter((f) => f.category === "SNACK"),
    };
    return map;
  }, [foods]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const calendarWeeks = useMemo(() => {
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill trailing blanks
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [daysInMonth, firstDayOfWeek]);


  return (
    <>
      <PageHeader
        title="Food Calendar"
        breadcrumbs={[
          { label: "Food Management", href: "/food" },
          { label: "Food Calendar" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch selector */}
          <Select value={branch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
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

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              disabled={isPending}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-medium text-foreground min-w-[180px] justify-center">
              {MONTH_NAMES[month - 1]} {year}
              {isPending && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Loading...
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              disabled={isPending}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Link href="/food/calendar/print">
            <Button variant="outline">
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          </Link>
        </div>

        {/* Calendar Grid */}
        {branches.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">
              No branches available. Create a branch first.
            </p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {DAY_NAMES.map((day) => (
                        <th
                          key={day}
                          className="border-b bg-muted/50 px-2 py-2.5 text-center text-xs font-semibold uppercase text-muted-foreground w-[14.28%]"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarWeeks.map((week, weekIdx) => (
                      <tr key={weekIdx}>
                        {week.map((day, dayIdx) => {
                          if (day === null) {
                            return (
                              <td
                                key={dayIdx}
                                className="border-b border-r last:border-r-0 bg-gray-50/50 p-2 align-top h-[120px]"
                              />
                            );
                          }

                          const dateKey = toISODate(year, month, day);
                          const dayData = calendar[dateKey] ?? {};
                          const hasMeals = Object.keys(dayData).length > 0;
                          const isWeekend = dayIdx === 0 || dayIdx === 6;

                          return (
                            <td
                              key={dayIdx}
                              className={`border-b border-r last:border-r-0 p-1.5 align-top h-[120px] cursor-pointer transition-colors hover:bg-primary/5 group ${
                                isWeekend ? "bg-gray-50/70" : "bg-white"
                              }`}
                              onClick={() => openDayDialog(day)}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span
                                  className={`text-sm font-medium ${
                                    hasMeals
                                      ? "text-primary"
                                      : "text-foreground"
                                  }`}
                                >
                                  {day}
                                </span>
                                {!hasMeals && (
                                  <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="size-3" />
                                  </span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                {MEALS.map((meal) => {
                                  const entry = dayData[meal.type];
                                  if (!entry) return null;
                                  return (
                                    <div
                                      key={meal.type}
                                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${meal.bg} ${meal.color}`}
                                      title={`${meal.label}: ${entry.foodName}`}
                                    >
                                      <span className="font-semibold">
                                        {meal.abbr}
                                      </span>{" "}
                                      {entry.foodName}
                                    </div>
                                  );
                                })}
                              </div>
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

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {MEALS.map((meal) => (
            <span key={meal.type} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${meal.bg} ${meal.color}`}>
              <span className="font-bold">{meal.abbr}</span>
              {meal.label}
            </span>
          ))}
          <span className="ml-2 text-muted-foreground">
            Click a day to assign meals
          </span>
        </div>
      </div>

      {/* Day Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Assign Meals &mdash;{" "}
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Breakfast */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-blue-600">
                Breakfast
              </label>
              <Select
                value={dialogBreakfast}
                onValueChange={setDialogBreakfast}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select breakfast..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground">-- None --</span>
                  </SelectItem>
                  {foodsByCategory.BREAKFAST.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lunch */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-green-600">
                Lunch
              </label>
              <Select value={dialogLunch} onValueChange={setDialogLunch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lunch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground">-- None --</span>
                  </SelectItem>
                  {foodsByCategory.LUNCH.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dessert */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-pink-600">
                Dessert
              </label>
              <Select value={dialogDessert} onValueChange={setDialogDessert}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dessert..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground">-- None --</span>
                  </SelectItem>
                  {foodsByCategory.DESSERT.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Snack */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-yellow-600">
                Snack
              </label>
              <Select value={dialogSnack} onValueChange={setDialogSnack}>
                <SelectTrigger>
                  <SelectValue placeholder="Select snack..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground">-- None --</span>
                  </SelectItem>
                  {foodsByCategory.SNACK.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
             
              className="text-white"
              onClick={handleSaveDay}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
