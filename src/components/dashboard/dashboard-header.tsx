"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

interface DashboardHeaderProps {
  selectedRange: {
    from: string;
    to: string;
  };
  selectedYearId: string | null;
}

function parseDateKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

function formatDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardHeader({ selectedRange, selectedYearId }: DashboardHeaderProps) {
  const { years, currentYear, setYear } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateRange = React.useMemo<DateRange | undefined>(() => {
    const from = parseDateKey(selectedRange.from);
    const to = parseDateKey(selectedRange.to);
    if (!from) return undefined;
    return { from, to: to ?? from };
  }, [selectedRange.from, selectedRange.to]);

  React.useEffect(() => {
    if (!selectedYearId || currentYear?.id === selectedYearId) return;
    const selectedYear = years.find((year) => year.id === selectedYearId);
    if (selectedYear) setYear(selectedYear);
  }, [currentYear?.id, selectedYearId, setYear, years]);

  function replaceDashboardParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    if (!range?.from) {
      replaceDashboardParams({ from: null, to: null });
      return;
    }

    replaceDashboardParams({
      from: formatDateKey(range.from),
      to: formatDateKey(range.to ?? range.from),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
      {years.length > 0 && (
        <Select
          value={selectedYearId ?? currentYear?.id ?? ""}
          onValueChange={(id) => {
            const year = years.find((y) => y.id === id) ?? null;
            setYear(year);
            replaceDashboardParams({ year: year?.id ?? null });
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
