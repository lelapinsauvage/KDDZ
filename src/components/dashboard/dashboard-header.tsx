"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useAppContext } from "@/hooks/use-app-context";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardHeader() {
  const { years, currentYear, setYear } = useAppContext();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      {years.length > 0 && (
        <Select
          value={currentYear?.id ?? ""}
          onValueChange={(id) => {
            const year = years.find((y) => y.id === id) ?? null;
            setYear(year);
          }}
        >
          <SelectTrigger size="sm" className="h-9 min-w-[160px]">
            <SelectValue placeholder="School Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
