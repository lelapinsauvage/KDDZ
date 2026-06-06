"use client";

import { CalendarDays } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassDashboardYearSelectorProps {
  years: Array<{ id: string; label: string }>;
  selectedYearId: string | null;
}

export function ClassDashboardYearSelector({
  years,
  selectedYearId,
}: ClassDashboardYearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (years.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="size-4 text-muted-foreground" />
      <Select
        value={selectedYearId ?? years[0]?.id ?? ""}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("year", value);
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }}
      >
        <SelectTrigger className="h-9 w-[160px] rounded-sm">
          <SelectValue placeholder="School Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year.id} value={year.id}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
