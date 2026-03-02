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
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarDays,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { deleteAbsenceReport, updateAbsenceReportStatus } from "@/lib/actions/absent-reports";
import { toast } from "sonner";

// -- Types --
type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AbsenceReportRow {
  id: string;
  photo: string | null;
  firstName: string;
  lastName: string;
  childName: string;
  status: AbsenceStatus;
  branchId: string;
  branchName: string;
  className: string;
  reportDate: string;
  createdAt: string;
  reason: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface Props {
  reports: AbsenceReportRow[];
  branches: BranchOption[];
  initialStatusFilter?: string;
}

// -- Status config --
const statusConfig: Record<AbsenceStatus, { color: string; icon: typeof Clock; label: string }> = {
  PENDING: {
    color: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
    icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    color: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20",
    icon: CheckCircle2,
    label: "Approved",
  },
  REJECTED: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
    label: "Rejected",
  },
};

// -- Component --
export function AbsentReportsClient({ reports, branches, initialStatusFilter = "all" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
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
      await deleteAbsenceReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleStatusUpdate(id: string, status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await updateAbsenceReportStatus(id, status);
      if (result.success) {
        toast.success(`Absence report ${status.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  // Columns match old PHP app order: Image, F Name, L Name, Status, Branch, Class, Report Date, Created Date, Action
  const absenceColumns: ColumnDef<AbsenceReportRow>[] = [
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
      header: "F Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.firstName}</span>
      ),
    },
    {
      accessorKey: "lastName",
      header: "L Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.lastName}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <Badge className={`${config.color} gap-1`}>
            <Icon className="size-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.branchName}</span>
      ),
    },
    {
      accessorKey: "className",
      header: "Class",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.className}</span>
      ),
    },
    {
      accessorKey: "reportDate",
      header: "Report Date",
      cell: ({ row }) => (
        <span className="text-sm text-foreground whitespace-nowrap">
          {format(new Date(row.original.reportDate), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
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
            {report.status === "PENDING" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[var(--color-success-dark)] hover:text-[var(--color-success-dark)] hover:bg-[var(--color-success-light)]"
                  onClick={() => handleStatusUpdate(report.id, "APPROVED")}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  <span className="ml-1 text-xs">Approve</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleStatusUpdate(report.id, "REJECTED")}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
                  <span className="ml-1 text-xs">Reject</span>
                </Button>
              </>
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
                  <Link href={`/absent-reports/${report.id}`}>
                    <Eye className="size-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/absent-reports/${report.id}/edit`}>
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
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Absence Reports"
        breadcrumbs={[{ label: "Absence Reports" }]}
        actions={
          <Button asChild>
            <Link href="/absent-reports/new">
              <Plus className="size-4" />
              Report Absence
            </Link>
          </Button>
        }
      />

      <div className="p-4 space-y-4 md:p-6">
        {/* Toolbar — matches daily reports filter bar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3">
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 h-7">
                  <Filter className="size-3" />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </Badge>
              )}

              <div className="flex-1" />
            </div>
          </CardContent>
        </Card>

        {filteredReports.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No absence reports found"
            description={
              search || dateFrom || dateTo || branchFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No absence reports have been submitted yet."
            }
            action={{ label: "Report Absence", href: "/absent-reports/new", icon: Plus }}
          />
        ) : (
          <DataTable columns={absenceColumns} data={filteredReports} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Absence Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this absence report? This action cannot be undone.
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
