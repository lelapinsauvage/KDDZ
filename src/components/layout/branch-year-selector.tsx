"use client";

import { useAppContext } from "@/hooks/use-app-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, CalendarDays } from "lucide-react";

export function BranchYearSelector() {
  const { currentBranch, setBranch, currentYear, setYear, branches, years } =
    useAppContext();

  return (
    <div className="space-y-3 border-b border-border/50 px-4 pb-4">
      {/* Branch selector */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/70">
          <Building2 className="size-3" />
          Branch
        </label>
        <Select
          value={currentBranch?.id ?? "all"}
          onValueChange={(val) => {
            if (val === "all") {
              setBranch(null);
            } else {
              const branch = branches.find((b) => b.id === val);
              if (branch) setBranch(branch);
            }
          }}
        >
          <SelectTrigger className="h-8 rounded-lg border-border/50 bg-muted/30 text-xs">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* School year selector */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          <CalendarDays className="size-3" />
          School Year
        </label>
        <Select
          value={currentYear?.id ?? ""}
          onValueChange={(val) => {
            const year = years.find((y) => y.id === val);
            if (year) setYear(year);
          }}
        >
          <SelectTrigger className="h-8 rounded-lg border-border/50 bg-muted/30 text-xs">
            <SelectValue placeholder="Select Year" />
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
    </div>
  );
}
