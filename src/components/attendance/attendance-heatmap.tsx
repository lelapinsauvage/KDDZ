"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DailyReportForm } from "@/components/daily-reports/daily-report-form";
import type {
  MonthlyAttendanceGrid,
  CellStatus,
} from "@/lib/actions/attendance";

// ── Types ────────────────────────────────────────

interface BranchOption {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface ChildOption {
  id: string;
  name: string;
  className: string;
}

interface FoodOption {
  id: string;
  name: string;
}

interface AttendanceHeatmapProps {
  grid: MonthlyAttendanceGrid;
  branches: BranchOption[];
  classes: ClassOption[];
  childrenList: ChildOption[];
  foods: {
    breakfast: FoodOption[];
    lunch: FoodOption[];
    dessert: FoodOption[];
  };
  initialMonth: number;
  initialYear: number;
  initialBranchId?: string;
  initialClassId?: string;
}

// ── Constants ────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<CellStatus, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-rose-500",
  NO_REPORT: "bg-violet-500",
};

const STATUS_HOVER: Record<CellStatus, string> = {
  PRESENT: "hover:bg-emerald-400",
  ABSENT: "hover:bg-rose-400",
  NO_REPORT: "hover:bg-violet-400 cursor-pointer",
};

// ── Component ────────────────────────────────────

export function AttendanceHeatmap({
  grid,
  branches,
  classes,
  childrenList,
  foods,
  initialMonth,
  initialYear,
  initialBranchId,
  initialClassId,
}: AttendanceHeatmapProps) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [branchId, setBranchId] = useState(initialBranchId ?? "all");
  const [classId, setClassId] = useState(initialClassId ?? "all");

  // Sheet state for filling missing reports
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const navigate = useCallback(
    (m: number, y: number, b: string, c: string) => {
      const params = new URLSearchParams();
      params.set("month", String(m));
      params.set("year", String(y));
      if (b !== "all") params.set("branchId", b);
      if (c !== "all") params.set("classId", c);
      router.push(`/attendance/heatmap?${params.toString()}`);
    },
    [router]
  );

  const handleMonthChange = (val: string) => {
    const m = parseInt(val);
    setMonth(m);
    navigate(m, year, branchId, classId);
  };

  const handleYearChange = (val: string) => {
    const y = parseInt(val);
    setYear(y);
    navigate(month, y, branchId, classId);
  };

  const handleBranchChange = (val: string) => {
    setBranchId(val);
    setClassId("all");
    navigate(month, year, val, "all");
  };

  const handleClassChange = (val: string) => {
    setClassId(val);
    navigate(month, year, branchId, val);
  };

  const handleCellClick = (childId: string, day: number, status: CellStatus) => {
    if (status !== "NO_REPORT") return;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedChildId(childId);
    setSelectedDate(dateStr);
    setSheetOpen(true);
  };

  // Build year options (current year +/- 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Filter classes by selected branch
  const filteredClasses =
    branchId !== "all"
      ? classes.filter((c) => {
          // classes might not have branchId in this simplified list
          // so we rely on the server filtering; show all when filtering client-side
          return true;
        })
      : classes;

  // Stats
  const totalPresent = grid.rows.reduce((acc, row) => {
    return acc + Object.values(row.days).filter((s) => s === "PRESENT").length;
  }, 0);
  const totalAbsent = grid.rows.reduce((acc, row) => {
    return acc + Object.values(row.days).filter((s) => s === "ABSENT").length;
  }, 0);
  const totalNoReport = grid.rows.reduce((acc, row) => {
    return acc + Object.values(row.days).filter((s) => s === "NO_REPORT").length;
  }, 0);

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Print-only title */}
      <div className="hidden print:block print:text-center print:mb-2">
        <h1 className="text-xl font-bold text-black">
          Attendance Heatmap &mdash; {MONTHS[month - 1]} {year}
        </h1>
        <p className="text-sm text-gray-500">
          Present: {totalPresent} &bull; Absent: {totalAbsent} &bull; No Report: {totalNoReport}
        </p>
      </div>

      {/* ── Filters (hidden in print) ── */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Select value={String(month)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {branches.length > 0 && (
          <Select value={branchId} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filteredClasses.length > 0 && (
          <Select value={classId} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {filteredClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Legend + Stats ── */}
      <div className="flex flex-wrap items-center gap-6 text-sm print:gap-4 print:text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-emerald-500 print:size-2.5" />
          <span className="text-muted-foreground print:text-black">Present ({totalPresent})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-rose-500 print:size-2.5" />
          <span className="text-muted-foreground print:text-black">Absent ({totalAbsent})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-violet-500 print:size-2.5" />
          <span className="text-muted-foreground print:text-black">No Report ({totalNoReport})</span>
        </div>
        {totalNoReport > 0 && (
          <span className="text-xs text-violet-600 font-medium print:hidden">
            Click purple dots to fill missing reports
          </span>
        )}
      </div>

      {/* ── Heatmap Grid ── */}
      {grid.rows.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border bg-card p-12">
          <p className="text-muted-foreground">
            No active children found for the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card print:overflow-visible print:rounded-none print:border-gray-300">
          <table className="w-full border-collapse print:text-[9px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[180px] border-b border-r bg-secondary/60 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground print:static print:min-w-[120px] print:bg-gray-100 print:text-black print:text-[9px] print:px-2 print:py-1 print:border-gray-300">
                  Child
                </th>
                {Array.from({ length: grid.daysInMonth }, (_, i) => i + 1).map(
                  (day) => (
                    <th
                      key={day}
                      className="border-b bg-secondary/40 px-1 py-2 text-center text-xs font-medium text-muted-foreground print:bg-gray-100 print:text-black print:text-[9px] print:px-0.5 print:py-1 print:border-gray-300"
                      style={{ minWidth: 28 }}
                    >
                      {day}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row) => (
                <tr
                  key={row.child.id}
                  className="transition-colors hover:bg-accent/30 print:hover:bg-transparent"
                >
                  <td className="sticky left-0 z-10 border-r bg-card px-3 py-2 print:static print:bg-white print:px-2 print:py-1 print:border-gray-300">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[170px] print:text-[9px] print:text-black">
                        {row.child.firstName} {row.child.lastName}
                      </span>
                      {row.child.className && (
                        <span className="text-xs text-muted-foreground truncate max-w-[170px] print:text-[8px] print:text-gray-600">
                          {row.child.className}
                        </span>
                      )}
                    </div>
                  </td>
                  {Array.from(
                    { length: grid.daysInMonth },
                    (_, i) => i + 1
                  ).map((day) => {
                    const status = row.days[day] ?? "NO_REPORT";
                    const isClickable = status === "NO_REPORT";
                    return (
                      <td
                        key={day}
                        className="px-1 py-2 text-center print:px-0.5 print:py-1"
                      >
                        <button
                          type="button"
                          disabled={!isClickable}
                          onClick={() =>
                            handleCellClick(row.child.id, day, status)
                          }
                          className={`inline-block size-3.5 rounded-full transition-all print:size-2.5 print:transition-none ${STATUS_COLORS[status]} ${STATUS_HOVER[status]} ${
                            isClickable
                              ? "ring-offset-2 hover:ring-2 hover:ring-violet-300"
                              : ""
                          }`}
                          title={
                            isClickable
                              ? `Fill report: ${row.child.firstName} ${row.child.lastName} — ${MONTHS[month - 1]} ${day}`
                              : `${status === "PRESENT" ? "Present" : "Absent"}: ${row.child.firstName} ${row.child.lastName} — ${MONTHS[month - 1]} ${day}`
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-out Sheet for Daily Report ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Fill Daily Report</SheetTitle>
            <SheetDescription>
              {selectedChildId && selectedDate && (
                <>
                  Report for{" "}
                  <strong>
                    {childrenList.find((c) => c.id === selectedChildId)?.name ??
                      "child"}
                  </strong>{" "}
                  on <strong>{selectedDate}</strong>
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedChildId && selectedDate && (
            <DailyReportForm
              childrenList={childrenList}
              foods={foods}
              defaultValues={{
                childId: selectedChildId,
                reportDate: selectedDate,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
