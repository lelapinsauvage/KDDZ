"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

// --- Types ---

interface DailyReportRow {
  id: string;
  date: string;
  childName: string;
  className: string;
  branchId: string;
  branchName: string;
  breakfast: string | null;
  lunch: string | null;
  sleep: boolean;
  sleepFrom: string | null;
  sleepTo: string | null;
  mood: string | null;
  status: "DRAFT" | "SUBMITTED";
}

// --- Mood badge color map ---

function getMoodColor(mood: string): string {
  switch (mood) {
    case "Happy":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Calm":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Fussy":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Tired":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Energetic":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getPortionLabel(portion: string | null): string {
  if (!portion) return "N/A";
  switch (portion) {
    case "ALL":
      return "Ate Well";
    case "MOST":
      return "Ate Most";
    case "HALF":
      return "Ate Some";
    case "LITTLE":
      return "Ate Little";
    case "NONE":
      return "Refused";
    default:
      return portion;
  }
}

function getMealColor(portion: string | null): string {
  if (!portion) return "text-[#a0a8b4]";
  switch (portion) {
    case "ALL":
    case "MOST":
      return "text-emerald-700";
    case "HALF":
      return "text-amber-600";
    case "LITTLE":
    case "NONE":
      return "text-red-600";
    default:
      return "text-[#6f7b8a]";
  }
}

function getSleepLabel(sleep: boolean): string {
  return sleep ? "Slept" : "No Nap";
}

function getSleepColor(sleep: boolean): string {
  return sleep ? "text-emerald-700" : "text-red-600";
}

// --- Column Definitions ---

const dailyReportColumns: ColumnDef<DailyReportRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-[#333]">
        {format(new Date(row.original.date), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "childName",
    header: "Child Name",
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "className",
    header: "Class",
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="bg-[#eef0f3] text-[#6f7b8a] font-normal"
      >
        {row.original.className}
      </Badge>
    ),
  },
  {
    accessorKey: "breakfast",
    header: "Breakfast",
    cell: ({ row }) => (
      <span className={`text-sm font-medium ${getMealColor(row.original.breakfast)}`}>
        {getPortionLabel(row.original.breakfast)}
      </span>
    ),
  },
  {
    accessorKey: "lunch",
    header: "Lunch",
    cell: ({ row }) => (
      <span className={`text-sm font-medium ${getMealColor(row.original.lunch)}`}>
        {getPortionLabel(row.original.lunch)}
      </span>
    ),
  },
  {
    accessorKey: "sleep",
    header: "Sleep",
    cell: ({ row }) => (
      <span className={`text-sm font-medium ${getSleepColor(row.original.sleep)}`}>
        {getSleepLabel(row.original.sleep)}
      </span>
    ),
  },
  {
    accessorKey: "mood",
    header: "Mood",
    cell: ({ row }) => {
      const mood = row.original.mood;
      if (!mood) return <span className="text-sm text-[#a0a8b4]">—</span>;
      return (
        <Badge className={getMoodColor(mood)}>
          {mood}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={
            status === "SUBMITTED"
              ? "bg-[#1caf9a]/10 text-[#1caf9a] border-[#1caf9a]/20"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }
        >
          {status === "SUBMITTED" ? "Submitted" : "Draft"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="size-4" />
              View Report
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];

// --- Props ---

interface DailyReportsClientProps {
  reports: DailyReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function DailyReportsClient({
  reports,
  total,
  branches,
}: DailyReportsClientProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = reports;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((r) => r.childName.toLowerCase().includes(lower));
    }

    if (dateFrom) {
      data = data.filter((r) => r.date >= dateFrom);
    }

    if (dateTo) {
      data = data.filter((r) => r.date <= dateTo);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((r) => r.branchId === branchFilter);
    }

    if (classFilter && classFilter !== "all") {
      data = data.filter((r) => r.className === classFilter);
    }

    return data;
  }, [reports, search, dateFrom, dateTo, branchFilter, classFilter]);

  // Extract unique classes for the filter
  const uniqueClasses = useMemo(
    () => [...new Set(reports.map((r) => r.className))].filter((c) => c !== "—"),
    [reports]
  );

  return (
    <>
      <PageHeader
        title="Daily Reports"
        breadcrumbs={[{ label: "Daily Reports" }]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-[#6f7b8a] whitespace-nowrap">
              From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-[#6f7b8a] whitespace-nowrap">
              To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {/* Branch Filter */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class Filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Button */}
          <Button className="bg-[#1caf9a] hover:bg-[#18a08d] text-white ml-auto">
            <Plus className="size-4" />
            New Report
          </Button>
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No daily reports found.</p>
          </div>
        ) : (
          <DataTable columns={dailyReportColumns} data={filteredData} />
        )}
      </div>
    </>
  );
}
