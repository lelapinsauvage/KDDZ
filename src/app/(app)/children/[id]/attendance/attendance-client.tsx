"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Circle,
  Clock,
  Printer,
  Search,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
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
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import type {
  ChildAttendanceCellCode,
  ChildAttendanceMatrix,
  ChildAttendanceMatrixCell,
  ChildAttendanceMatrixMonth,
} from "@/lib/actions/attendance";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

interface Props {
  child: ChildData;
  matrix: ChildAttendanceMatrix;
}

const dayColumns = Array.from({ length: 31 }, (_, idx) => idx + 1);

const codeStyles: Record<ChildAttendanceCellCode, string> = {
  P: "bg-[#008200] text-white hover:bg-[#006d00]",
  A: "bg-[#f2a0b8] text-[#5a1026] hover:bg-[#ef8daa]",
  N: "bg-[#8e44ad] text-white hover:bg-[#783a93]",
  W: "bg-[#d64635] text-white",
  H: "bg-[#f4d03f] text-[#3a2c00]",
  "": "bg-transparent text-transparent",
  "-": "bg-muted text-muted-foreground",
};

const statusOptions = [
  { value: "ALL", label: "All" },
  { value: "P", label: "Present" },
  { value: "A", label: "Absent" },
  { value: "N", label: "No Report" },
  { value: "W", label: "Weekend" },
  { value: "H", label: "Holiday" },
] as const;

const exportColumns: ExportColumn[] = [
  { header: "Month", key: "month" },
  ...dayColumns.map((day) => ({ header: String(day), key: `day${day}` })),
  { header: "P/A", key: "presentAbsent" },
  { header: "No Report", key: "noReport" },
];

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "";
  return `${startDate} to ${endDate}`;
}

function filenameFor(child: ChildData) {
  return `${child.firstName}_${child.lastName}_attendance`
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_");
}

function exportRows(months: ChildAttendanceMatrixMonth[]) {
  return months.map((month) => {
    const row: Record<string, unknown> = {
      month: month.monthLabel,
      presentAbsent: `${month.presentCount} / ${month.absentCount}`,
      noReport: month.noReportCount,
    };
    for (const cell of month.cells) {
      row[`day${cell.day}`] = cell.code;
    }
    return row;
  });
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  icon: typeof CheckCircle;
  className: string;
}) {
  return (
    <div className="rounded border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded ${className}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function AttendanceCode({ cell }: { cell: ChildAttendanceMatrixCell }) {
  const content = (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-bold ${codeStyles[cell.code]}`}
      title={cell.date ? `${cell.date}: ${cell.label}` : cell.label}
      aria-label={cell.date ? `${cell.date}: ${cell.label}` : cell.label}
    >
      {cell.code}
    </span>
  );

  if (cell.href) {
    return (
      <Link href={cell.href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}

function LegendItem({
  code,
  label,
}: {
  code: ChildAttendanceCellCode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold ${codeStyles[code]}`}>
        {code}
      </span>
      {label}
    </div>
  );
}

export function AttendanceClient({ child, matrix }: Props) {
  const id = child.id;
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<ChildAttendanceCellCode | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const filteredMonths = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return matrix.months.filter((month) => {
      if (monthFilter !== "ALL" && month.monthKey !== monthFilter) {
        return false;
      }
      if (
        statusFilter !== "ALL" &&
        !month.cells.some((cell) => cell.code === statusFilter)
      ) {
        return false;
      }
      if (
        normalizedQuery &&
        !month.monthLabel.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [matrix.months, monthFilter, query, statusFilter]);

  const totalTracked = matrix.totals.present + matrix.totals.absent + matrix.totals.noReport;
  const attendanceRate = totalTracked
    ? Math.round((matrix.totals.present / totalTracked) * 100)
    : 0;
  const exportData = exportRows(filteredMonths);

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} Attendance Report`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}` },
          { label: "Attendance" },
        ]}
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatDateRange(matrix.startDate, matrix.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {filteredMonths.length} month{filteredMonths.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton
              filename={filenameFor(child)}
              sheetName="Attendance"
              columns={exportColumns}
              data={exportData}
            />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryTile
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={CalendarDays}
            className="bg-primary/10 text-primary"
          />
          <SummaryTile
            label="Present"
            value={matrix.totals.present}
            icon={CheckCircle}
            className="bg-[#008200]/10 text-[#008200]"
          />
          <SummaryTile
            label="Absent"
            value={matrix.totals.absent}
            icon={XCircle}
            className="bg-[#f2a0b8]/40 text-[#9b2147]"
          />
          <SummaryTile
            label="No Reports"
            value={matrix.totals.noReport}
            icon={AlertTriangle}
            className="bg-[#8e44ad]/10 text-[#8e44ad]"
          />
          <SummaryTile
            label="Closed Days"
            value={matrix.totals.weekends + matrix.totals.holidays}
            icon={Clock}
            className="bg-[#f4d03f]/30 text-[#7a5f00]"
          />
        </div>

        <div className="flex flex-col gap-3 rounded border border-border/60 bg-card p-3 print:hidden lg:flex-row lg:items-center">
          <div role="search" className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search month..."
            />
          </div>

          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            aria-label="Filter by month"
          >
            <option value="ALL">All months</option>
            {matrix.months.map((month) => (
              <option key={month.monthKey} value={month.monthKey}>
                {month.monthLabel}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ChildAttendanceCellCode | "ALL")
            }
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            aria-label="Filter by status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded border border-border/60 bg-card px-3 py-2 print:hidden">
          <LegendItem code="P" label="Present" />
          <LegendItem code="A" label="Absent" />
          <LegendItem code="N" label="No report" />
          <LegendItem code="W" label="Weekend" />
          <LegendItem code="H" label="Holiday" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="size-3" />
            Blank cells are outside the child attendance range.
          </div>
        </div>

        <div className="hidden print:block print:mb-3 print:text-center">
          <h2 className="text-lg font-bold">
            {child.firstName} {child.lastName} Attendance Report
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatDateRange(matrix.startDate, matrix.endDate)}
          </p>
        </div>

        <div className="overflow-hidden rounded border border-border/60 bg-card print:rounded-none print:border-gray-300">
          <div className="overflow-x-auto">
            <Table className="min-w-[1320px] print:min-w-0 print:text-[8px]">
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="sticky left-0 z-20 min-w-32 bg-muted/95 text-xs font-semibold uppercase text-muted-foreground print:static print:min-w-0">
                    Month
                  </TableHead>
                  {dayColumns.map((day) => (
                    <TableHead
                      key={day}
                      className="w-8 px-1 text-center text-xs font-semibold uppercase text-muted-foreground print:px-0"
                    >
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="w-16 text-center text-xs font-semibold uppercase text-muted-foreground">
                    P/A
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMonths.length ? (
                  filteredMonths.map((month) => (
                    <TableRow key={month.monthKey} className="border-border/50">
                      <TableCell className="sticky left-0 z-10 bg-card font-semibold print:static">
                        {month.monthLabel}
                      </TableCell>
                      {month.cells.map((cell) => (
                        <TableCell key={`${month.monthKey}-${cell.day}`} className="px-1 text-center print:px-0">
                          <AttendanceCode cell={cell} />
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-sm font-semibold">
                        {month.presentCount} / {month.absentCount}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={33} className="py-10 text-center text-sm text-muted-foreground">
                      No attendance rows match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Badge variant="secondary">P/A = present / absent</Badge>
          <Badge variant="secondary">Newest dates are available through each day badge.</Badge>
        </div>
      </div>
    </>
  );
}
