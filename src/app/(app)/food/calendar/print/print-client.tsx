"use client";

import { useState, useMemo, useCallback, useTransition, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFoodCalendarMonth } from "@/lib/actions/food";

// Types
type MealTypeKey = "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK";

interface BranchOption {
  id: string;
  name: string;
}

interface FoodCalendarEntry {
  id: string;
  foodId: string;
  food: {
    id: string;
    name: string;
    category: string;
    isActive: boolean;
  };
}

type CalendarData = Record<string, Partial<Record<MealTypeKey, FoodCalendarEntry>>>;

// Constants
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MEALS: { type: MealTypeKey; label: string }[] = [
  { type: "BREAKFAST", label: "B" },
  { type: "LUNCH", label: "L" },
  { type: "DESSERT", label: "D" },
  { type: "SNACK", label: "S" },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface PrintClientProps {
  branches: BranchOption[];
  initialCalendar: CalendarData;
  initialBranchId: string;
  initialYear: number;
  initialMonth: number;
}

export default function PrintClient({
  branches,
  initialCalendar,
  initialBranchId,
  initialYear,
  initialMonth,
}: PrintClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [branch, setBranch] = useState(initialBranchId);
  const [calendar, setCalendar] = useState<CalendarData>(initialCalendar);
  const [isPending, startTransition] = useTransition();

  const branchName = branches.find((b) => b.id === branch)?.name ?? "Branch";

  // Fetch when branch or month changes
  useEffect(() => {
    if (!branch) return;
    startTransition(async () => {
      const result = await getFoodCalendarMonth({ branchId: branch, year, month });
      if ("calendar" in result && result.calendar) {
        setCalendar(result.calendar as CalendarData);
      }
    });
  }, [branch, year, month]);

  const prevMonth = useCallback(() => {
    if (month <= 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month >= 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

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

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden">
        <PageHeader
          title="Print Food Calendar"
          breadcrumbs={[
            { label: "Food Management", href: "/food" },
            { label: "Food Calendar", href: "/food/calendar" },
            { label: "Print" },
          ]}
        />
      </div>

      {/* Screen-only toolbar */}
      <div className="space-y-4 p-4 md:p-6 print:hidden">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={branch} onValueChange={setBranch}>
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-medium text-[#333] min-w-[180px] justify-center">
              {MONTH_NAMES[month - 1]} {year}
              {isPending && (
                <span className="text-xs text-muted-foreground ml-1">
                  Loading...
                </span>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            className="bg-[#1caf9a] text-white hover:bg-[#18a08d]"
            onClick={() => window.print()}
          >
            <Printer className="mr-1 size-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable area */}
      <div className="p-6 print:p-0">
        {/* Print-only title */}
        <div className="mb-4 hidden text-center print:block">
          <h1 className="text-2xl font-bold text-[#333]">
            Monthly Food Calendar
          </h1>
          <p className="mt-1 text-base text-[#555]">
            {branchName} &mdash; {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        {/* Calendar Table */}
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              {DAY_NAMES.map((day) => (
                <th
                  key={day}
                  className="border border-gray-300 bg-[#f1f3f6] px-2 py-2 text-center text-xs font-semibold uppercase text-[#6f7b8a] print:bg-gray-100 print:text-[9px]"
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
                        className="border border-gray-300 bg-gray-50 p-1 align-top h-[90px] print:h-[70px]"
                      />
                    );
                  }

                  const dateKey = toISODate(year, month, day);
                  const dayData = calendar[dateKey] ?? {};

                  return (
                    <td
                      key={dayIdx}
                      className="border border-gray-300 p-1.5 align-top h-[90px] print:h-[70px] print:p-1"
                    >
                      <div className="text-xs font-semibold text-[#333] mb-0.5 print:text-[9px]">
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {MEALS.map((meal) => {
                          const entry = dayData[meal.type];
                          if (!entry) return null;
                          return (
                            <div
                              key={meal.type}
                              className="truncate text-[10px] leading-tight text-[#555] print:text-[8px]"
                            >
                              <span className="font-semibold">
                                {meal.label}:
                              </span>{" "}
                              {entry.food?.name ?? ""}
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

        {/* Print legend */}
        <div className="mt-2 flex gap-4 text-[10px] text-[#888] print:text-[8px]">
          <span>B = Breakfast</span>
          <span>L = Lunch</span>
          <span>D = Dessert</span>
          <span>S = Snack</span>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          [data-slot="sidebar"],
          [data-slot="sidebar-trigger"],
          nav,
          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </>
  );
}
