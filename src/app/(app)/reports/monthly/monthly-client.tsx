"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle,
  Printer,
  Search,
  TableIcon,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";

export type MonthlyAttendanceCellCode = "P" | "A" | "N" | "W" | "H" | "" | "-";

export interface MonthlyAttendanceCell {
  day: number;
  date: string | null;
  code: MonthlyAttendanceCellCode;
  label: string;
  href: string | null;
}

export interface MonthlyAttendanceRow {
  childId: string;
  legacyChildId: number | null;
  childNumber: string;
  firstName: string;
  lastName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  presentCount: number;
  absentCount: number;
  cells: MonthlyAttendanceCell[];
}

export interface MonthlyBranchOption {
  id: string;
  name: string;
}

export interface MonthlyClassOption {
  id: string;
  name: string;
  branchId: string;
}

interface MonthlyClientProps {
  title?: string;
  breadcrumbLabel?: string;
  basePath?: string;
  showBranchColumn?: boolean;
  lockBranch?: boolean;
  rows: MonthlyAttendanceRow[];
  branchOptions: MonthlyBranchOption[];
  classOptions: MonthlyClassOption[];
  totals: {
    present: number;
    absent: number;
    noReport: number;
  };
  daysInMonth: number;
  monthKey: string;
  monthLabel: string;
  initialBranchId: string | null;
  initialClassId: string | null;
  initialQuery: string;
}

interface ColumnFilters {
  childNumber: string;
  firstName: string;
  lastName: string;
  branchName: string;
  className: string;
}

const dayColumns = Array.from({ length: 31 }, (_, index) => index + 1);

const EMPTY_FILTERS: ColumnFilters = {
  childNumber: "",
  firstName: "",
  lastName: "",
  branchName: "",
  className: "",
};

const statusStyles: Record<MonthlyAttendanceCellCode, string> = {
  P: "bg-[#008200] text-white hover:bg-[#006f00]",
  A: "bg-[#f2a0b8] text-[#5a1026] hover:bg-[#ef8daa]",
  N: "bg-[#8e44ad] text-white hover:bg-[#783a93]",
  W: "bg-[#d64635] text-white",
  H: "bg-[#f4d03f] text-[#3a2c00]",
  "": "bg-transparent text-transparent",
  "-": "bg-muted text-muted-foreground",
};

function buildExportColumns(includeBranch: boolean): ExportColumn[] {
  return [
    { header: "Child #", key: "childNumber" },
    { header: "Name", key: "firstName" },
    { header: "L Name", key: "lastName" },
    ...(includeBranch ? [{ header: "Branch", key: "branchName" }] : []),
    { header: "Class", key: "className" },
    ...dayColumns.map((day) => ({ header: String(day), key: `day${day}` })),
    { header: "P/A", key: "presentAbsent" },
  ];
}

function matches(value: string | number | null | undefined, query: string) {
  if (!query.trim()) return true;
  return String(value ?? "").toLowerCase().includes(query.trim().toLowerCase());
}

function exportRows(rows: MonthlyAttendanceRow[], includeBranch: boolean) {
  return rows.map((row) => {
    const data: Record<string, unknown> = {
      childNumber: row.childNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      className: row.className,
      presentAbsent: `${row.presentCount} / ${row.absentCount}`,
    };
    if (includeBranch) {
      data.branchName = row.branchName;
    }
    for (const cell of row.cells) {
      data[`day${cell.day}`] = cell.code;
    }
    return data;
  });
}

function filename(monthKey: string) {
  return `monthly_attendance_${monthKey}`.replace(/[^a-z0-9_-]+/gi, "_");
}

function StatusBadge({ cell }: { cell: MonthlyAttendanceCell }) {
  const badge = (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-bold ${statusStyles[cell.code]}`}
      title={cell.date ? `${cell.date}: ${cell.label}` : cell.label}
      aria-label={cell.date ? `${cell.date}: ${cell.label}` : cell.label}
    >
      {cell.code}
    </span>
  );

  if (!cell.href || cell.code === "" || cell.code === "-") {
    return badge;
  }

  return (
    <Link href={cell.href} className="inline-flex">
      {badge}
    </Link>
  );
}

function LegendItem({
  code,
  label,
}: {
  code: Exclude<MonthlyAttendanceCellCode, "" | "-">;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold ${statusStyles[code]}`}>
        {code}
      </span>
      {label}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-border/60 bg-card px-3 py-2">
      <span className={`inline-flex size-2 rounded-full ${tone}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function MonthlyClient({
  title = "Monthly Attendance Report",
  breadcrumbLabel,
  basePath = "/reports/monthly",
  showBranchColumn = false,
  lockBranch = false,
  rows,
  branchOptions,
  classOptions,
  totals,
  daysInMonth,
  monthKey,
  monthLabel,
  initialBranchId,
  initialClassId,
  initialQuery,
}: MonthlyClientProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [selectedBranch, setSelectedBranch] = useState(initialBranchId ?? "ALL");
  const [selectedClass, setSelectedClass] = useState(initialClassId ?? "ALL");
  const [query, setQuery] = useState(initialQuery);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const exportColumns = useMemo(
    () => buildExportColumns(showBranchColumn),
    [showBranchColumn],
  );
  const emptyColSpan = showBranchColumn ? 37 : 36;
  const filterGridClass = lockBranch
    ? "grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[160px_190px_1fr]"
    : "grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[160px_190px_190px_1fr]";
  const branchLabel =
    branchOptions.find((branch) => branch.id === selectedBranch)?.name ?? "Selected branch";

  const availableClasses = useMemo(() => {
    if (selectedBranch === "ALL") return classOptions;
    return classOptions.filter((option) => option.branchId === selectedBranch);
  }, [classOptions, selectedBranch]);

  const filteredRows = useMemo(() => {
    const globalQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matches(row.childNumber, columnFilters.childNumber)) return false;
      if (!matches(row.firstName, columnFilters.firstName)) return false;
      if (!matches(row.lastName, columnFilters.lastName)) return false;
      if (!matches(row.branchName, columnFilters.branchName)) return false;
      if (!matches(row.className, columnFilters.className)) return false;
      if (!globalQuery) return true;

      return [
        row.childNumber,
        row.firstName,
        row.lastName,
        row.className,
        row.branchName,
        `${row.presentCount} / ${row.absentCount}`,
        ...row.cells.map((cell) => cell.code),
      ]
        .join(" ")
        .toLowerCase()
        .includes(globalQuery);
    });
  }, [columnFilters, query, rows]);

  const filteredExportRows = useMemo(
    () => exportRows(filteredRows, showBranchColumn),
    [filteredRows, showBranchColumn],
  );
  const filteredPresent = filteredRows.reduce((sum, row) => sum + row.presentCount, 0);
  const filteredAbsent = filteredRows.reduce((sum, row) => sum + row.absentCount, 0);

  function updateFilter(key: keyof ColumnFilters, value: string) {
    setColumnFilters((current) => ({ ...current, [key]: value }));
  }

  function applyServerFilters() {
    const params = new URLSearchParams();
    params.set("month", selectedMonth);
    const nextBranch = lockBranch ? initialBranchId ?? selectedBranch : selectedBranch;
    if (nextBranch && nextBranch !== "ALL") params.set("branch", nextBranch);
    if (selectedClass !== "ALL") params.set("classId", selectedClass);
    if (query.trim()) params.set("q", query.trim());
    router.push(`${basePath}?${params.toString()}`);
  }

  function resetFilters() {
    setSelectedMonth(monthKey);
    setSelectedBranch(lockBranch ? initialBranchId ?? "ALL" : "ALL");
    setSelectedClass("ALL");
    setQuery("");
    setColumnFilters(EMPTY_FILTERS);
    const params = new URLSearchParams();
    if (lockBranch && initialBranchId) params.set("branch", initialBranchId);
    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  }

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "Reports", href: "/reports/monthly" },
          { label: breadcrumbLabel ?? title },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 rounded border border-border/60 bg-card px-3 py-3 print:hidden lg:flex-row lg:items-end">
          <div className={filterGridClass}>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Month</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>

            {lockBranch ? (
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Branch</span>
                <Input value={branchLabel} readOnly className="bg-muted/50" />
              </label>
            ) : (
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Branch</span>
                <select
                  value={selectedBranch}
                  onChange={(event) => {
                    setSelectedBranch(event.target.value);
                    setSelectedClass("ALL");
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="ALL">All Branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Class</span>
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All Classes</option>
                {availableClasses.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Search</span>
              <span className="relative block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Search table..."
                />
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyServerFilters}>
              <CalendarDays className="size-4" />
              Show
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <X className="size-4" />
              Reset
            </Button>
            <ExportButton
              filename={filename(monthKey)}
              sheetName="Attendance"
              columns={exportColumns}
              data={filteredExportRows}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Showing Data For {monthKey}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {monthLabel} has {daysInMonth} day{daysInMonth === 1 ? "" : "s"}; day columns beyond the month are marked with a dash.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryPill label="Rows" value={filteredRows.length} tone="bg-slate-500" />
            <SummaryPill label="Present" value={filteredPresent} tone="bg-[#008200]" />
            <SummaryPill label="Absent" value={filteredAbsent} tone="bg-[#f2a0b8]" />
            <SummaryPill label="No Report" value={totals.noReport} tone="bg-[#8e44ad]" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded border border-border/60 bg-card px-3 py-2">
          <LegendItem code="N" label="No Report" />
          <LegendItem code="P" label="Present" />
          <LegendItem code="A" label="Abscent" />
          <LegendItem code="W" label="Weekends" />
          <LegendItem code="H" label="Holidays" />
          <Badge variant="secondary" className="text-xs">
            P/A = present / absent
          </Badge>
        </div>

        <div className="overflow-hidden rounded border border-border/60 bg-card print:rounded-none print:border-gray-300">
          <div className="overflow-x-auto">
            <Table
              className={
                showBranchColumn
                  ? "min-w-[1580px] print:min-w-0 print:text-[7px]"
                  : "min-w-[1480px] print:min-w-0 print:text-[7px]"
              }
            >
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="sticky left-0 z-30 min-w-24 bg-muted/95 px-2 text-xs font-semibold uppercase text-muted-foreground print:static print:min-w-0">
                    Child #
                  </TableHead>
                  <TableHead className="min-w-28 bg-muted/80 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="min-w-28 bg-muted/80 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    L Name
                  </TableHead>
                  {showBranchColumn ? (
                    <TableHead className="min-w-28 bg-muted/80 px-2 text-xs font-semibold uppercase text-muted-foreground">
                      Branch
                    </TableHead>
                  ) : null}
                  <TableHead className="min-w-28 bg-muted/80 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    Class
                  </TableHead>
                  {dayColumns.map((day) => (
                    <TableHead
                      key={day}
                      className="w-8 px-1 text-center text-xs font-semibold uppercase text-muted-foreground print:px-0"
                    >
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="w-16 px-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                    P/A
                  </TableHead>
                </TableRow>
                <TableRow className="border-border/60 hover:bg-transparent print:hidden">
                  <TableHead className="sticky left-0 z-30 bg-card p-1 print:static">
                    <Input
                      value={columnFilters.childNumber}
                      onChange={(event) => updateFilter("childNumber", event.target.value)}
                      className="h-8 px-2 text-xs"
                      placeholder="Child #"
                    />
                  </TableHead>
                  <TableHead className="bg-card p-1">
                    <Input
                      value={columnFilters.firstName}
                      onChange={(event) => updateFilter("firstName", event.target.value)}
                      className="h-8 px-2 text-xs"
                      placeholder="Name"
                    />
                  </TableHead>
                  <TableHead className="bg-card p-1">
                    <Input
                      value={columnFilters.lastName}
                      onChange={(event) => updateFilter("lastName", event.target.value)}
                      className="h-8 px-2 text-xs"
                      placeholder="L Name"
                    />
                  </TableHead>
                  {showBranchColumn ? (
                    <TableHead className="bg-card p-1">
                      <Input
                        value={columnFilters.branchName}
                        onChange={(event) => updateFilter("branchName", event.target.value)}
                        className="h-8 px-2 text-xs"
                        placeholder="Branch"
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="bg-card p-1">
                    <Input
                      value={columnFilters.className}
                      onChange={(event) => updateFilter("className", event.target.value)}
                      className="h-8 px-2 text-xs"
                      placeholder="Class"
                    />
                  </TableHead>
                  {dayColumns.map((day) => (
                    <TableHead key={`filter-${day}`} className="bg-card p-1" />
                  ))}
                  <TableHead className="bg-card p-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <TableRow key={row.childId} className="border-border/50">
                      <TableCell className="sticky left-0 z-20 bg-card px-2 text-sm font-semibold print:static print:px-1 print:text-[7px]">
                        {row.childNumber}
                      </TableCell>
                      <TableCell className="px-2 text-sm print:px-1 print:text-[7px]">
                        {row.firstName}
                      </TableCell>
                      <TableCell className="px-2 text-sm print:px-1 print:text-[7px]">
                        {row.lastName}
                      </TableCell>
                      {showBranchColumn ? (
                        <TableCell className="px-2 text-sm print:px-1 print:text-[7px]">
                          {row.branchName}
                        </TableCell>
                      ) : null}
                      <TableCell className="px-2 text-sm print:px-1 print:text-[7px]">
                        {row.className}
                      </TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={`${row.childId}-${cell.day}`} className="px-1 text-center print:px-0">
                          <StatusBadge cell={cell} />
                        </TableCell>
                      ))}
                      <TableCell className="px-2 text-center text-sm font-semibold print:px-1 print:text-[7px]">
                        {row.presentCount} / {row.absentCount}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={emptyColSpan} className="h-24 text-center text-sm text-muted-foreground">
                      No attendance rows match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground print:hidden">
          <CheckCircle className="size-3.5" />
          Links on N/P/A cells open the matching daily or absence workflow.
        </div>
      </div>
    </>
  );
}
