"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Calendar as CalendarIcon,
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
import { getFoodCalendar } from "@/lib/actions/food";

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
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const MEALS: { type: MealTypeKey; label: string }[] = [
  { type: "BREAKFAST", label: "Breakfast" },
  { type: "LUNCH", label: "Lunch" },
  { type: "DESSERT", label: "Dessert" },
  { type: "SNACK", label: "Snack" },
];

// Helpers
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

interface PrintClientProps {
  branches: BranchOption[];
  initialCalendar: CalendarData;
  initialBranchId: string;
}

export default function PrintClient({
  branches,
  initialCalendar,
  initialBranchId,
}: PrintClientProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [branch, setBranch] = useState(initialBranchId);
  const [calendar, setCalendar] = useState<CalendarData>(initialCalendar);
  const [isPending, startTransition] = useTransition();

  const branchName = branches.find((b) => b.id === branch)?.name ?? "Branch";

  // Fetch calendar data when branch or week changes
  useEffect(() => {
    startTransition(async () => {
      const result = await getFoodCalendar({
        branchId: branch,
        weekStart: toISODate(weekStart),
      });
      if (result.calendar) {
        setCalendar(result.calendar as CalendarData);
      }
    });
  }, [branch, weekStart]);

  const prevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const getDayDate = useCallback(
    (dayIndex: number) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dayIndex);
      return d;
    },
    [weekStart]
  );

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
      <div className="space-y-4 p-6 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={branch} onValueChange={setBranch}>
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-[#333]">
              <CalendarIcon className="size-4 text-muted-foreground" />
              {formatDateRange(weekStart)}
              {isPending && <span className="text-xs text-muted-foreground ml-1">Loading...</span>}
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek}>
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
        <div className="mb-6 hidden text-center print:block">
          <h1 className="text-2xl font-bold text-[#333]">
            Weekly Food Calendar
          </h1>
          <p className="mt-1 text-base text-[#555]">
            {branchName} &mdash; {formatDateRange(weekStart)}
          </p>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-[#f1f3f6] px-4 py-3 text-left text-xs font-semibold uppercase text-[#6f7b8a] print:bg-gray-100 print:text-[10px]">
                Meal
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className="border border-gray-300 bg-[#f1f3f6] px-4 py-3 text-center text-xs font-semibold uppercase text-[#6f7b8a] print:bg-gray-100 print:text-[10px]"
                >
                  <div>{day}</div>
                  <div className="mt-0.5 text-[10px] font-normal normal-case text-muted-foreground print:text-[9px]">
                    {formatShortDate(getDayDate(i))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map((meal) => (
              <tr key={meal.type}>
                <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-[#333] print:text-xs">
                  {meal.label}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const dateKey = toISODate(getDayDate(dayIdx));
                  const entry = calendar[dateKey]?.[meal.type];
                  const food = entry?.food?.name ?? "";
                  return (
                    <td
                      key={dayIdx}
                      className="border border-gray-300 px-4 py-3 text-center text-sm text-[#555] print:text-xs"
                    >
                      {food || <span className="text-gray-300">&mdash;</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
        }
      `}</style>
    </>
  );
}
