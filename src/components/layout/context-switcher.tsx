"use client"

import { Building2, CalendarDays, ChevronDown } from "lucide-react"
import { useAppContext } from "@/hooks/use-app-context"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ContextSwitcher() {
  const { currentBranch, setBranch, currentYear, setYear, branches, years } =
    useAppContext()

  const branchLabel = currentBranch?.name ?? "All Branches"
  const yearLabel = currentYear?.label ?? "No Year"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hidden items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted md:flex">
          <span className="max-w-[120px] truncate">{branchLabel}</span>
          <span className="text-muted-foreground">&middot;</span>
          <span className="text-muted-foreground">{yearLabel}</span>
          <ChevronDown className="ml-0.5 size-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-4 p-4">
        {/* Branch selector */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            <Building2 className="size-3" />
            Branch
          </label>
          <Select
            value={currentBranch?.id ?? "all"}
            onValueChange={(val) => {
              if (val === "all") {
                setBranch(null)
              } else {
                const branch = branches.find((b) => b.id === val)
                if (branch) setBranch(branch)
              }
            }}
          >
            <SelectTrigger className="h-8 rounded-lg border-border bg-muted/50 text-xs">
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
          <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            <CalendarDays className="size-3" />
            School Year
          </label>
          <Select
            value={currentYear?.id ?? ""}
            onValueChange={(val) => {
              const year = years.find((y) => y.id === val)
              if (year) setYear(year)
            }}
          >
            <SelectTrigger className="h-8 rounded-lg border-border bg-muted/50 text-xs">
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
      </PopoverContent>
    </Popover>
  )
}
