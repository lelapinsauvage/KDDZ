"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { deleteDailyReport } from "@/lib/actions/daily-reports";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

const dailyReportsExportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Child Name", key: "childName" },
  { header: "Class", key: "className" },
  { header: "Branch", key: "branchName" },
  { header: "Breakfast", key: "breakfast", transform: (v) => v ? String(v) : "N/A" },
  { header: "Lunch", key: "lunch", transform: (v) => v ? String(v) : "N/A" },
  { header: "Sleep", key: "sleep", transform: (v) => v ? "Yes" : "No" },
  { header: "Mood", key: "mood", transform: (v) => v ? String(v) : "" },
  { header: "Status", key: "status" },
  { header: "Created By", key: "createdBy" },
];

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
  createdBy: string;
}

// --- Helpers ---

function getMoodColor(mood: string): string {
  switch (mood) {
    case "HAPPY":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CALM":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "FUSSY":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "SLEEPY":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "CRYING":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getMoodLabel(mood: string): string {
  const map: Record<string, string> = {
    HAPPY: "Happy",
    CALM: "Calm",
    FUSSY: "Fussy",
    CRYING: "Crying",
    SLEEPY: "Sleepy",
  };
  return map[mood] ?? mood;
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

// --- Props ---

interface DailyReportsClientProps {
  reports: DailyReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}

// --- Page Component ---

export function DailyReportsClient({
  reports,
  branches,
}: DailyReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    return data;
  }, [reports, search, dateFrom, dateTo, branchFilter, classFilter, statusFilter]);

  const uniqueClasses = useMemo(
    () => [...new Set(reports.map((r) => r.className))].filter((c) => c !== "—"),
    [reports]
  );

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteDailyReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

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
        <Badge variant="secondary" className="bg-[#eef0f3] text-[#6f7b8a] font-normal">
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
            {getMoodLabel(mood)}
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
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-sm text-[#555]">{row.original.createdBy}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/daily-reports/${report.id}`}>
                  <Eye className="size-4" />
                  View Report
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/daily-reports/${report.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(report.id)}
              >
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

  return (
    <>
      <PageHeader
        title="Daily Reports"
        breadcrumbs={[{ label: "Daily Reports" }]}
      />
      <div className="p-4 space-y-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative w-full sm:max-w-sm sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-[#6f7b8a] whitespace-nowrap">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[130px] sm:w-[150px]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-[#6f7b8a] whitespace-nowrap">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[130px] sm:w-[150px]"
            />
          </div>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <ExportButton
              filename="daily-reports"
              sheetName="Daily Reports"
              columns={dailyReportsExportColumns}
              data={filteredData as unknown as Record<string, unknown>[]}
            />
            <Button asChild className="bg-[#1caf9a] hover:bg-[#18a08d] text-white">
              <Link href="/daily-reports/new">
                <Plus className="size-4" />
                New Report
              </Link>
            </Button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No daily reports found.</p>
          </div>
        ) : (
          <DataTable columns={dailyReportColumns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this daily report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
