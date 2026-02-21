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

interface CalendarClientProps {
  employees: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Role-based color assignment
const roleColorMap: Record<string, string> = {
  Teacher: "#3b82f6",
  Nurse: "#ec4899",
  Doctor: "#a855f7",
  Manager: "#f97316",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Generate default weekday shifts (Mon-Fri) for each employee
function generateDefaultShifts(
  employees: CalendarClientProps["employees"],
  year: number,
  month: number
): EmployeeShift[] {
  const daysInMonth = getDaysInMonth(year, month);
  return employees.map((emp, idx) => {
    const weekdays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdays.push(d);
      }
    }
    const colors = Object.values(roleColorMap);
    const color = roleColorMap[emp.role] ?? colors[idx % colors.length];
    return {
      employeeName: emp.name,
      color,
      days: weekdays,
    };
  });
}

export function CalendarClient({ employees }: CalendarClientProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // No shift model in DB; generate default weekday schedules from real employees
  const shifts = useMemo(
    () => generateDefaultShifts(employees, year, month),
    [employees, year, month]
  );

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let currentRow: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) currentRow.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentRow.push(d);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
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

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

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
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">{monthName}</h2>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {shifts.map((emp) => (
              <div key={emp.employeeName} className="flex items-center gap-1.5 text-sm">
                <div className="size-3 rounded-full" style={{ backgroundColor: emp.color }} />
                <span>{emp.employeeName}</span>
              </div>
            ))}
          </div>
        </div>

        {employees.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No employees found. Add employees to see their calendar schedules.
          </div>
        )}

        {employees.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-[#f1f3f6]">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r last:border-r-0 px-2 py-2 text-center text-xs font-semibold uppercase text-[#6f7b8a]"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t">
                {week.map((day, di) => {
                  const shiftsForDay = day
                    ? shifts.filter((s) => s.days.includes(day))
                    : [];
                  const isTodayCell = isCurrentMonth && day === today;
                  return (
                    <div
                      key={di}
                      className={`min-h-[80px] border-r last:border-r-0 p-1.5 ${
                        day === null ? "bg-muted/30" : ""
                      } ${isTodayCell ? "bg-[#1caf9a]/5" : ""}`}
                    >
                      {day !== null && (
                        <>
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isTodayCell ? "text-[#1caf9a]" : "text-[#333]"
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
        )}

        {employees.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Note: No shift/schedule model exists in the database yet. Showing default weekday schedules for all employees.
          </p>
        )}
      </div>
    </>
  );
}
