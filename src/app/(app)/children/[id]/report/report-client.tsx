"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Check,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Printer,
  Search,
  Thermometer,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

interface ReportRow {
  id: string;
  date: string;
  status: string;
  breakfastType: string | null;
  breakfastPortion: string | null;
  breakfastTime: string | null;
  lunchType: string | null;
  lunchPortion: string | null;
  lunchTime: string | null;
  dessertType: string | null;
  dessertPortion: string | null;
  dessertTime: string | null;
  milkCc: number;
  sleepFrom: string | null;
  sleepTo: string | null;
  sleepDuration: string;
  mood: string | null;
  cough: boolean;
  runnyNose: boolean;
  vomit: boolean;
  diarrhea: boolean;
  urinePotty: number;
  stoolPotty: number;
  urineDiaper: number;
  stoolDiaper: number;
  fever1Temp: string | null;
  fever1Time: string | null;
  fever2Temp: string | null;
  fever2Time: string | null;
  clothesPants: boolean;
  clothesShirt: boolean;
  clothesTshirt: boolean;
  clothesUnderwear: boolean;
  clothesSocks: boolean;
  remarks: string | null;
  attachmentCount: number;
}

interface Props {
  child: ChildData;
  reports: ReportRow[];
  total: number;
}

const portionColors: Record<string, string> = {
  NONE: "bg-[#d64635]/10 text-[#b73528] border-[#d64635]/30",
  LITTLE: "bg-[#f39c12]/10 text-[#a96b08] border-[#f39c12]/30",
  HALF: "bg-[#c29d0b]/10 text-[#8a7008] border-[#c29d0b]/30",
  MOST: "bg-[#3498db]/10 text-[#1d6fa5] border-[#3498db]/30",
  ALL: "bg-[#008200]/10 text-[#006600] border-[#008200]/30",
};

const exportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Breakfast Type", key: "breakfastType" },
  { header: "Breakfast Portion", key: "breakfastPortion" },
  { header: "Lunch Type", key: "lunchType" },
  { header: "Lunch Portion", key: "lunchPortion" },
  { header: "Dessert Type", key: "dessertType" },
  { header: "Dessert Portion", key: "dessertPortion" },
  { header: "Milk CC", key: "milkCc" },
  { header: "Nap From", key: "sleepFrom" },
  { header: "Nap To", key: "sleepTo" },
  { header: "Pot Urine", key: "urinePotty" },
  { header: "Pot Stool", key: "stoolPotty" },
  { header: "Diaper Urine", key: "urineDiaper" },
  { header: "Diaper Stool", key: "stoolDiaper" },
  { header: "Fever 1 Temp", key: "fever1Temp" },
  { header: "Fever 1 Time", key: "fever1Time" },
  { header: "Fever 2 Temp", key: "fever2Temp" },
  { header: "Fever 2 Time", key: "fever2Time" },
  { header: "Pant", key: "clothesPants" },
  { header: "Shirt", key: "clothesShirt" },
  { header: "T-Shirt", key: "clothesTshirt" },
  { header: "Boxer", key: "clothesUnderwear" },
  { header: "Socks", key: "clothesSocks" },
];

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function portionBadge(value: string | null) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <Badge variant="outline" className={portionColors[value] ?? ""}>
      {value}
    </Badge>
  );
}

function BooleanMark({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="inline-flex size-6 items-center justify-center rounded bg-[#008200]/10 text-[#008200]">
      <Check className="size-3.5" />
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center rounded bg-[#d64635]/10 text-[#d64635]">
      <X className="size-3.5" />
    </span>
  );
}

function filenameFor(child: ChildData) {
  return `${child.firstName}_${child.lastName}_daily_reports`
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_");
}

function exportRows(rows: ReportRow[]) {
  return rows.map((row) => ({
    ...row,
    clothesPants: row.clothesPants ? "Yes" : "No",
    clothesShirt: row.clothesShirt ? "Yes" : "No",
    clothesTshirt: row.clothesTshirt ? "Yes" : "No",
    clothesUnderwear: row.clothesUnderwear ? "Yes" : "No",
    clothesSocks: row.clothesSocks ? "Yes" : "No",
  }));
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <Card className="rounded-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded ${className}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

const columns: ColumnDef<ReportRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
    cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
  },
  {
    accessorKey: "breakfastType",
    header: ({ column }) => (
      <SortableHeader column={column}>Breakfast Type</SortableHeader>
    ),
    cell: ({ row }) => display(row.original.breakfastType),
  },
  {
    accessorKey: "breakfastPortion",
    header: ({ column }) => (
      <SortableHeader column={column}>Breakfast Portion</SortableHeader>
    ),
    cell: ({ row }) => portionBadge(row.original.breakfastPortion),
  },
  {
    accessorKey: "lunchType",
    header: ({ column }) => <SortableHeader column={column}>Lunch Type</SortableHeader>,
    cell: ({ row }) => display(row.original.lunchType),
  },
  {
    accessorKey: "lunchPortion",
    header: ({ column }) => (
      <SortableHeader column={column}>Lunch Portion</SortableHeader>
    ),
    cell: ({ row }) => portionBadge(row.original.lunchPortion),
  },
  {
    accessorKey: "dessertType",
    header: ({ column }) => (
      <SortableHeader column={column}>Dessert Type</SortableHeader>
    ),
    cell: ({ row }) => display(row.original.dessertType),
  },
  {
    accessorKey: "dessertPortion",
    header: ({ column }) => (
      <SortableHeader column={column}>Dessert Portion</SortableHeader>
    ),
    cell: ({ row }) => portionBadge(row.original.dessertPortion),
  },
  {
    accessorKey: "milkCc",
    header: ({ column }) => <SortableHeader column={column}>Milk CC</SortableHeader>,
    cell: ({ row }) => display(row.original.milkCc),
  },
  {
    accessorKey: "sleepFrom",
    header: ({ column }) => <SortableHeader column={column}>Nap From</SortableHeader>,
    cell: ({ row }) => display(row.original.sleepFrom),
  },
  {
    accessorKey: "sleepTo",
    header: ({ column }) => <SortableHeader column={column}>Nap To</SortableHeader>,
    cell: ({ row }) => display(row.original.sleepTo),
  },
  {
    accessorKey: "urinePotty",
    header: ({ column }) => <SortableHeader column={column}>Pot Urine</SortableHeader>,
    cell: ({ row }) => display(row.original.urinePotty),
  },
  {
    accessorKey: "stoolPotty",
    header: ({ column }) => <SortableHeader column={column}>Pot Stool</SortableHeader>,
    cell: ({ row }) => display(row.original.stoolPotty),
  },
  {
    accessorKey: "urineDiaper",
    header: ({ column }) => <SortableHeader column={column}>Diaper Urine</SortableHeader>,
    cell: ({ row }) => display(row.original.urineDiaper),
  },
  {
    accessorKey: "stoolDiaper",
    header: ({ column }) => <SortableHeader column={column}>Diaper Stool</SortableHeader>,
    cell: ({ row }) => display(row.original.stoolDiaper),
  },
  {
    accessorKey: "fever1Temp",
    header: ({ column }) => <SortableHeader column={column}>Fever 1</SortableHeader>,
    cell: ({ row }) => display(row.original.fever1Temp),
  },
  {
    accessorKey: "fever1Time",
    header: ({ column }) => <SortableHeader column={column}>Fever 1 Time</SortableHeader>,
    cell: ({ row }) => display(row.original.fever1Time),
  },
  {
    accessorKey: "fever2Temp",
    header: ({ column }) => <SortableHeader column={column}>Fever 2</SortableHeader>,
    cell: ({ row }) => display(row.original.fever2Temp),
  },
  {
    accessorKey: "fever2Time",
    header: ({ column }) => <SortableHeader column={column}>Fever 2 Time</SortableHeader>,
    cell: ({ row }) => display(row.original.fever2Time),
  },
  {
    accessorKey: "clothesPants",
    header: "Pant",
    cell: ({ row }) => <BooleanMark checked={row.original.clothesPants} />,
  },
  {
    accessorKey: "clothesShirt",
    header: "Shirt",
    cell: ({ row }) => <BooleanMark checked={row.original.clothesShirt} />,
  },
  {
    accessorKey: "clothesTshirt",
    header: "T-Shirt",
    cell: ({ row }) => <BooleanMark checked={row.original.clothesTshirt} />,
  },
  {
    accessorKey: "clothesUnderwear",
    header: "Boxer",
    cell: ({ row }) => <BooleanMark checked={row.original.clothesUnderwear} />,
  },
  {
    accessorKey: "clothesSocks",
    header: "Socks",
    cell: ({ row }) => <BooleanMark checked={row.original.clothesSocks} />,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Open actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/daily-reports/${row.original.id}`}>
              <Eye className="mr-2 size-4" />
              View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/daily-reports/${row.original.id}/edit`}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/daily-reports/${row.original.id}/print`}>
              <Printer className="mr-2 size-4" />
              Print
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function ReportClient({ child, reports, total }: Props) {
  const id = child.id;
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (dateFrom && report.date < dateFrom) return false;
      if (dateTo && report.date > dateTo) return false;
      if (normalizedSearch) {
        const haystack = [
          report.date,
          report.breakfastType,
          report.breakfastPortion,
          report.lunchType,
          report.lunchPortion,
          report.dessertType,
          report.dessertPortion,
          report.mood,
          report.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [dateFrom, dateTo, reports, search]);

  const feverCount = reports.reduce(
    (sum, report) => sum + (report.fever1Temp ? 1 : 0) + (report.fever2Temp ? 1 : 0),
    0,
  );

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} Daily Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}` },
          { label: "Reports" },
        ]}
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded border border-border/60 bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {child.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photo} alt="" className="size-full object-cover" />
              ) : (
                <UserX className="size-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {child.firstName} {child.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">Daily Reports</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton
              filename={filenameFor(child)}
              sheetName="Daily Reports"
              columns={exportColumns}
              data={exportRows(filteredReports)}
            />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Submitted Reports"
            value={total}
            icon={FileText}
            className="bg-primary/10 text-primary"
          />
          <SummaryCard
            label="Nap Logged"
            value={reports.filter((report) => report.sleepFrom || report.sleepTo).length}
            icon={Printer}
            className="bg-[#3498db]/10 text-[#1d6fa5]"
          />
          <SummaryCard
            label="Fever Readings"
            value={feverCount}
            icon={Thermometer}
            className="bg-[#d64635]/10 text-[#b73528]"
          />
          <SummaryCard
            label="Attachments"
            value={reports.reduce((sum, report) => sum + report.attachmentCount, 0)}
            icon={Download}
            className="bg-[#008200]/10 text-[#008200]"
          />
        </div>

        <Card className="rounded-sm">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <div role="search" className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search date, food, portion, remarks..."
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                aria-label="Date from"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                aria-label="Date to"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{filteredReports.length} visible</Badge>
              <Badge variant="outline">Submitted only</Badge>
            </div>

            <DataTable
              columns={columns}
              data={filteredReports}
              emptyState={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No daily reports match the current filters.
                </p>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
