"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  CalendarDays,
  Trash2,
  Check,
  ChevronsUpDown,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { FOOD_CATEGORY_COLORS } from "@/lib/food-colors";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getFoodCalendarMonth,
  setFoodCalendarDay,
  deleteFoodCalendarEntry,
} from "@/lib/actions/food";
import { toast } from "sonner";

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

const MEALS: { type: MealType; label: string }[] = [
  { type: "BREAKFAST", label: "Breakfast" },
  { type: "LUNCH", label: "Lunch" },
  { type: "SNACK", label: "Snack" },
  { type: "DESSERT", label: "Dessert" },
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

function buildCalendarPath(branchId: string, year: number, month: number): string {
  const params = new URLSearchParams();
  if (branchId) {
    params.set("branch", branchId);
  }
  params.set("month", String(month).padStart(2, "0"));
  params.set("year", String(year));
  return `/food/calendar?${params.toString()}`;
}

function buildPrintPath(branchId: string, year: number, month: number): string {
  const params = new URLSearchParams();
  if (branchId) {
    params.set("branch", branchId);
  }
  params.set("month", String(month).padStart(2, "0"));
  params.set("year", String(year));
  return `/food/calendar/print?${params.toString()}`;
}

// ── Searchable Combobox ─────────────────────────
function MealCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  showNoneProminent,
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: FoodOption[];
  placeholder: string;
  showNoneProminent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedFood = options.find((f) => f.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value === "NONE" ? (
            <span className="text-muted-foreground">None</span>
          ) : selectedFood ? (
            selectedFood.name
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {showNoneProminent ? (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onValueChange("NONE");
                    setOpen(false);
                  }}
                  className="font-medium"
                >
                  <X className={cn("mr-2 size-4", value === "NONE" ? "opacity-100" : "opacity-0")} />
                  None (no dessert)
                </CommandItem>
              ) : (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onValueChange("NONE");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === "NONE" ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
              )}
              {options.map((food) => (
                <CommandItem
                  key={food.id}
                  value={food.name}
                  onSelect={() => {
                    onValueChange(food.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === food.id ? "opacity-100" : "opacity-0")} />
                  {food.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Props ───────────────────────────────────────
interface FoodCalendarClientProps {
  branches: Array<{ id: string; name: string }>;
  initialBranchId: string;
  initialYear: number;
  initialMonth: number;
  initialCalendar: CalendarData;
  foods: FoodOption[];
  permissions?: {
    canAddFoodToCalendar: boolean;
    canEditFoodCalendar: boolean;
    canApplyFoodAllBranches: boolean;
  };
}

// ── Page Component ──────────────────────────────
export function FoodCalendarClient({
  branches,
  initialBranchId,
  initialYear,
  initialMonth,
  initialCalendar,
  foods,
  permissions = {
    canAddFoodToCalendar: true,
    canEditFoodCalendar: true,
    canApplyFoodAllBranches: true,
  },
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
  const [dialogSnack, setDialogSnack] = useState("NONE");
  const [dialogDessert, setDialogDessert] = useState("NONE");
  const [applyTarget, setApplyTarget] = useState<"branch" | "all">("branch");

  const replaceCalendarUrl = useCallback(
    (branchId: string, nextYear: number, nextMonth: number) => {
      window.history.replaceState(
        null,
        "",
        buildCalendarPath(branchId, nextYear, nextMonth)
      );
    },
    []
  );

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
    replaceCalendarUrl(branch, newYear, newMonth);
    startTransition(() => {
      fetchCalendar(branch, newYear, newMonth);
    });
  }, [branch, month, year, fetchCalendar, replaceCalendarUrl, startTransition]);

  const nextMonth = useCallback(() => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    replaceCalendarUrl(branch, newYear, newMonth);
    startTransition(() => {
      fetchCalendar(branch, newYear, newMonth);
    });
  }, [branch, month, year, fetchCalendar, replaceCalendarUrl, startTransition]);

  const handleBranchChange = useCallback(
    (newBranch: string) => {
      setBranch(newBranch);
      replaceCalendarUrl(newBranch, year, month);
      startTransition(() => {
        fetchCalendar(newBranch, year, month);
      });
    },
    [year, month, fetchCalendar, replaceCalendarUrl, startTransition]
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    setYear(todayYear);
    setMonth(todayMonth);
    replaceCalendarUrl(branch, todayYear, todayMonth);
    startTransition(() => {
      fetchCalendar(branch, todayYear, todayMonth);
    });
  }, [branch, fetchCalendar, replaceCalendarUrl, startTransition]);

  // Open day assignment dialog
  const openDayDialog = useCallback(
    (day: number) => {
      const dateKey = toISODate(year, month, day);
      const dayData = calendar[dateKey] ?? {};
      const hasMeals = Object.keys(dayData).length > 0;
      const canOpen = hasMeals
        ? permissions.canEditFoodCalendar
        : permissions.canAddFoodToCalendar;
      if (!canOpen) {
        toast.error("Access denied");
        return;
      }
      setSelectedDate(dateKey);
      setDialogBreakfast(dayData["BREAKFAST"]?.foodId ?? "NONE");
      setDialogLunch(dayData["LUNCH"]?.foodId ?? "NONE");
      setDialogSnack(dayData["SNACK"]?.foodId ?? "NONE");
      setDialogDessert(dayData["DESSERT"]?.foodId ?? "NONE");
      setApplyTarget("branch");
      setDialogOpen(true);
    },
    [year, month, calendar, permissions]
  );

  const selectedDateHasMeals = Boolean(
    selectedDate && Object.keys(calendar[selectedDate] ?? {}).length > 0
  );

  // Save day assignment
  const handleSaveDay = useCallback(() => {
    if (!branch || !selectedDate) return;
    if (selectedDateHasMeals && !permissions.canEditFoodCalendar) {
      toast.error("Access denied");
      return;
    }
    if (!selectedDateHasMeals && !permissions.canAddFoodToCalendar) {
      toast.error("Access denied");
      return;
    }
    if (applyTarget === "all" && !permissions.canApplyFoodAllBranches) {
      toast.error("Access denied");
      return;
    }

    startTransition(async () => {
      const mealSelections: { mealType: MealType; foodId: string | null }[] = [
        { mealType: "BREAKFAST", foodId: dialogBreakfast },
        { mealType: "LUNCH", foodId: dialogLunch },
        { mealType: "SNACK", foodId: dialogSnack },
        { mealType: "DESSERT", foodId: dialogDessert },
      ];

      const result = await setFoodCalendarDay({
        branchId: branch,
        date: selectedDate,
        applyToAllBranches: applyTarget === "all" && !selectedDateHasMeals,
        meals: mealSelections.map((meal) => ({
          ...meal,
          foodId: meal.foodId === "NONE" ? null : meal.foodId,
        })),
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      await fetchCalendar(branch, year, month);
      setDialogOpen(false);
      toast.success(
        result.branchCount && result.branchCount > 1
          ? `Meals updated for ${result.branchCount} branches`
          : "Meals updated"
      );
    });
  }, [
    branch,
    selectedDate,
    applyTarget,
    selectedDateHasMeals,
    dialogBreakfast,
    dialogLunch,
    dialogSnack,
    dialogDessert,
    year,
    month,
    fetchCalendar,
    startTransition,
    permissions,
  ]);

  // Clear all meals for the selected day
  const handleClearDay = useCallback(() => {
    if (!branch || !selectedDate) return;
    if (!permissions.canEditFoodCalendar) {
      toast.error("Access denied");
      return;
    }

    startTransition(async () => {
      const dayData = calendar[selectedDate] ?? {};
      for (const entry of Object.values(dayData)) {
        if (entry?.id) {
          await deleteFoodCalendarEntry(entry.id);
        }
      }
      await fetchCalendar(branch, year, month);
      setDialogOpen(false);
      toast.success("Day cleared");
    });
  }, [branch, selectedDate, calendar, year, month, fetchCalendar, startTransition, permissions]);

  // Foods filtered by category for combobox options
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

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [daysInMonth, firstDayOfWeek]);

  const printHref = useMemo(
    () => buildPrintPath(branch, year, month),
    [branch, year, month]
  );

  return (
    <>
      <PageHeader
        title="Food Calendar"
        breadcrumbs={[
          { label: "Food", href: "/food" },
          { label: "Calendar" },
        ]}
        actions={
          <Link href={printHref}>
            <Button variant="outline">
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          </Link>
        }
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
              size="sm"
              onClick={goToToday}
              disabled={isPending}
              className="gap-1.5"
            >
              <CalendarDays className="size-4" />
              Today
            </Button>
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
                <Loader2 className="ml-2 size-3.5 animate-spin text-muted-foreground" />
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
        </div>

        {/* Calendar Grid */}
        {branches.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">
              No branches available. Create a branch first.
            </p>
          </div>
        ) : (
          <Card className="overflow-hidden rounded-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {DAY_NAMES.map((day) => (
                        <th
                          key={day}
                          className="border-b bg-muted/50 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[14.28%]"
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
                                className="border-b border-r last:border-r-0 bg-muted/20 p-2 align-top h-[120px]"
                              />
                            );
                          }

                          const dateKey = toISODate(year, month, day);
                          const dayData = calendar[dateKey] ?? {};
                          const hasMeals = Object.keys(dayData).length > 0;
                          const canOpenDay = hasMeals
                            ? permissions.canEditFoodCalendar
                            : permissions.canAddFoodToCalendar;
                          const isWeekend = dayIdx === 0 || dayIdx === 6;
                          const now = new Date();
                          const isToday =
                            day === now.getDate() &&
                            month === now.getMonth() + 1 &&
                            year === now.getFullYear();

                          return (
                            <td
                              key={dayIdx}
                              className={cn(
                                "border-b border-r last:border-r-0 p-1.5 align-top h-[120px] transition-colors group",
                                canOpenDay && "cursor-pointer hover:bg-primary/5",
                                isWeekend && !hasMeals && "bg-muted/10",
                                isToday && "ring-2 ring-inset ring-primary/40"
                              )}
                              onClick={() => {
                                if (canOpenDay) openDayDialog(day);
                              }}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <span
                                  className={cn(
                                    "inline-flex size-7 items-center justify-center rounded-full text-sm font-medium",
                                    isToday
                                      ? "bg-primary text-primary-foreground"
                                      : "text-foreground"
                                  )}
                                >
                                  {day}
                                </span>
                                {canOpenDay && !hasMeals && (
                                  <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="size-3" />
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                {MEALS.map((meal) => {
                                  const entry = dayData[meal.type];
                                  if (!entry) return null;
                                  const colors = FOOD_CATEGORY_COLORS[meal.type];
                                  return (
                                    <span
                                      key={meal.type}
                                      className={cn(
                                        "inline-block truncate rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
                                        colors.bg,
                                        colors.text
                                      )}
                                      title={`${meal.label}: ${entry.foodName}`}
                                    >
                                      {entry.foodName}
                                    </span>
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
          {MEALS.map((meal) => {
            const colors = FOOD_CATEGORY_COLORS[meal.type];
            return (
              <span
                key={meal.type}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
                  colors.bg,
                  colors.text
                )}
              >
                {meal.label}
              </span>
            );
          })}
          {permissions.canAddFoodToCalendar || permissions.canEditFoodCalendar ? (
            <span className="ml-2 text-muted-foreground">
              Click a day to assign meals
            </span>
          ) : null}
        </div>
      </div>

      {/* Day Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-sm">
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
            <DialogDescription>
              Choose breakfast, lunch, snack, and dessert for this day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Breakfast */}
            <div className="space-y-1.5">
              <label className={cn("text-sm font-medium", FOOD_CATEGORY_COLORS.BREAKFAST.text)}>
                Breakfast
              </label>
              <MealCombobox
                value={dialogBreakfast}
                onValueChange={setDialogBreakfast}
                options={foodsByCategory.BREAKFAST}
                placeholder="Select breakfast"
              />
            </div>

            {/* Lunch */}
            <div className="space-y-1.5">
              <label className={cn("text-sm font-medium", FOOD_CATEGORY_COLORS.LUNCH.text)}>
                Lunch
              </label>
              <MealCombobox
                value={dialogLunch}
                onValueChange={setDialogLunch}
                options={foodsByCategory.LUNCH}
                placeholder="Select lunch"
              />
            </div>

            {/* Snack */}
            <div className="space-y-1.5">
              <label className={cn("text-sm font-medium", FOOD_CATEGORY_COLORS.SNACK.text)}>
                Snack
              </label>
              <MealCombobox
                value={dialogSnack}
                onValueChange={setDialogSnack}
                options={foodsByCategory.SNACK}
                placeholder="Select snack"
              />
            </div>

            {/* Dessert */}
            <div className="space-y-1.5">
              <label className={cn("text-sm font-medium", FOOD_CATEGORY_COLORS.DESSERT.text)}>
                Dessert
              </label>
              <MealCombobox
                value={dialogDessert}
                onValueChange={setDialogDessert}
                options={foodsByCategory.DESSERT}
                placeholder="Select dessert"
                showNoneProminent
              />
            </div>

            {!selectedDateHasMeals && branches.length > 1 && permissions.canApplyFoodAllBranches && (
              <fieldset className="space-y-2 rounded-sm border p-3">
                <legend className="px-1 text-sm font-medium">Apply To</legend>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex flex-1 items-center gap-2 rounded-sm border px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="food-calendar-apply-target"
                      value="branch"
                      checked={applyTarget === "branch"}
                      onChange={() => setApplyTarget("branch")}
                    />
                    This Branch
                  </label>
                  <label className="flex flex-1 items-center gap-2 rounded-sm border px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="food-calendar-apply-target"
                      value="all"
                      checked={applyTarget === "all"}
                      onChange={() => setApplyTarget("all")}
                    />
                    All Branches
                  </label>
                </div>
              </fieldset>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {selectedDateHasMeals && permissions.canEditFoodCalendar && (
              <Button
                variant="destructive"
                onClick={handleClearDay}
                disabled={isPending}
                className="gap-1.5 sm:mr-auto"
              >
                <Trash2 className="size-3.5" />
                Clear Day
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveDay}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
