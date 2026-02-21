"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmployeeShift {
  employeeName: string;
  color: string;
  days: number[]; // 1-based day-of-month
}

const demoShifts: EmployeeShift[] = [
  {
    employeeName: "Sara Khalil",
    color: "#3b82f6",
    days: [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
  },
  {
    employeeName: "Rima Haddad",
    color: "#ec4899",
    days: [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
  },
  {
    employeeName: "Nadia Karam",
    color: "#22c55e",
    days: [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
  },
  {
    employeeName: "Maya Rizk",
    color: "#a855f7",
    days: [2, 3, 4, 5, 9, 10, 11, 12, 16, 17, 18, 19, 23, 24, 25, 26],
  },
  {
    employeeName: "Georges Azar",
    color: "#f97316",
    days: [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
  },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function EmployeeCalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // February (0-indexed)

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let currentRow: (number | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < firstDay; i++) currentRow.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentRow.push(d);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    // Trailing empty cells
    if (currentRow.length > 0) {
      while (currentRow.length < 7) currentRow.push(null);
      rows.push(currentRow);
    }
    return rows;
  }, [daysInMonth, firstDay]);

  function navigateMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  const monthName = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Employee Calendar"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Calendar" },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">{monthName}</h2>
            <Button variant="outline" size="icon" className="size-8" onClick={() => navigateMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {demoShifts.map((emp) => (
              <div key={emp.employeeName} className="flex items-center gap-1.5 text-sm">
                <div className="size-3 rounded-full" style={{ backgroundColor: emp.color }} />
                <span>{emp.employeeName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-[#f1f3f6]">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="border-r last:border-r-0 px-2 py-2 text-center text-xs font-semibold uppercase text-[#6f7b8a]">
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-t">
              {week.map((day, di) => {
                const shiftsForDay = day ? demoShifts.filter((s) => s.days.includes(day)) : [];
                const isToday = day === 21 && month === 1 && year === 2026;
                return (
                  <div
                    key={di}
                    className={`min-h-[80px] border-r last:border-r-0 p-1.5 ${
                      day === null ? "bg-muted/30" : ""
                    } ${isToday ? "bg-[#1caf9a]/5" : ""}`}
                  >
                    {day !== null && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday ? "text-[#1caf9a]" : "text-[#333]"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="flex flex-wrap gap-0.5">
                          {shiftsForDay.map((emp) => (
                            <div
                              key={emp.employeeName}
                              className="h-1.5 flex-1 min-w-[12px] rounded-full"
                              style={{ backgroundColor: emp.color }}
                              title={emp.employeeName}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
