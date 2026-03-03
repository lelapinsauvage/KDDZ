"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
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
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  FileEdit,
  Filter,
  Printer,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { deleteDailyReport, submitDailyReport } from "@/lib/actions/daily-reports";
import { toast } from "sonner";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

const dailyReportsExportColumns: ExportColumn[] = [
  { header: "First Name", key: "firstName" },
  { header: "Last Name", key: "lastName" },
  { header: "Status", key: "status" },
  { header: "Branch", key: "branchName" },
  { header: "Class", key: "className" },
  { header: "Report Date", key: "reportDate" },
  { header: "Created Date", key: "createdAt" },
];

// --- Types ---

interface DailyReportRow {
  id: string;
  photo: string | null;
  firstName: string;
  lastName: string;
  childName: string;
  className: string;
  branchId: string;
  branchName: string;
  reportDate: string;
  createdAt: string;
  status: "DRAFT" | "SUBMITTED";
  createdBy: string;
}

// --- Helpers ---

// --- Props ---

interface DailyReportsClientProps {
  reports: DailyReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  initialStatusFilter?: string;
}

// --- Page Component ---

export function DailyReportsClient({
  reports,
  branches,
  initialStatusFilter = "all",
}: DailyReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = reports;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((r) => r.childName.toLowerCase().includes(lower));
    }

    if (dateFrom) {
      data = data.filter((r) => r.reportDate >= dateFrom);
    }

    if (dateTo) {
      data = data.filter((r) => r.reportDate <= dateTo);
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

  const activeFilterCount = [
    dateFrom,
    dateTo,
    branchFilter !== "all" ? branchFilter : "",
    classFilter !== "all" ? classFilter : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteDailyReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleSubmit(id: string) {
    startTransition(async () => {
      const result = await submitDailyReport(id);
      if (result.success) {
        toast.success("Report submitted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit report");
      }
    });
  }

  // Columns match old PHP app order: Image, F Name, L Name, Status, Branch, Class, Report Date, Created Date, Action
  const dailyReportColumns: ColumnDef<DailyReportRow>[] = [
    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => {
        const photo = row.original.photo;
        return photo ? (
          <img
            src={photo}
            alt={row.original.childName}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column}>First Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.firstName}</span>
      ),
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column}>Last Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.lastName}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return status === "SUBMITTED" ? (
          <Badge className="bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20 gap-1">
            <CheckCircle2 className="size-3" />
            Submitted
          </Badge>
        ) : (
          <Badge className="bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20 gap-1">
            <FileEdit className="size-3" />
            Draft
          </Badge>
        );
      },
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => (
        <SortableHeader column={column}>Branch</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.branchName}</span>
      ),
    },
    {
      accessorKey: "className",
      header: ({ column }) => (
        <SortableHeader column={column}>Class</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.className}</span>
      ),
    },
    {
      accessorKey: "reportDate",
      header: ({ column }) => (
        <SortableHeader column={column}>Report Date</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground whitespace-nowrap">
          {format(new Date(row.original.reportDate), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created Date</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center gap-1">
            {report.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => handleSubmit(report.id)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3.5" />}
                <span className="ml-1 text-xs">Submit</span>
              </Button>
            )}
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
                <DropdownMenuItem asChild>
                  <Link href={`/daily-reports/${report.id}/print`}>
                    <Printer className="size-4" />
                    Print
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
          </div>
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
        actions={
          <Button asChild>
            <Link href="/daily-reports/new">
              <Plus className="size-4" />
              New Report
            </Link>
          </Button>
        }
      />
      <div className="p-4 space-y-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative w-full sm:max-w-xs sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by child name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex w-full items-center gap-1.5 sm:w-auto">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 sm:w-[150px] sm:flex-initial h-9"
                />
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-1">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 sm:w-[150px] sm:flex-initial h-9"
                />
              </div>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px] h-9">
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
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px] h-9">
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
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[140px] h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 h-7">
                  <Filter className="size-3" />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </Badge>
              )}

              <div className="ml-auto flex items-center gap-2">
                <ExportButton
                  filename="daily-reports"
                  sheetName="Daily Reports"
                  columns={dailyReportsExportColumns}
                  data={filteredData as unknown as Record<string, unknown>[]}
                />
              </div>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No daily reports found"
            description={
              search || dateFrom || dateTo || branchFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No reports have been submitted yet. Start filling out daily reports for your class."
            }
            action={{ label: "New Report", href: "/daily-reports/new", icon: Plus }}
            secondaryAction={{ label: "Start Batch Reports", href: "/daily-reports/batch" }}
          />
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
