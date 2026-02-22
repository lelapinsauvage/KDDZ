"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  CalendarDays,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MessageSquareText,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { deleteAbsenceReport, updateAbsenceReportStatus } from "@/lib/actions/absent-reports";
import { toast } from "sonner";
import { format } from "date-fns";

// -- Types --
type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AbsenceReport {
  id: string;
  childName: string;
  date: string;
  reason: string;
  status: AbsenceStatus;
  createdBy: string;
  branchId: string;
  branchName: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface Props {
  reports: AbsenceReport[];
  branches: BranchOption[];
  initialStatusFilter?: string;
}

// -- Avatar helpers --
const avatarColors = [
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return (parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "");
}

// -- Status config --
const statusConfig: Record<AbsenceStatus, { color: string; icon: typeof Clock; label: string }> = {
  PENDING: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
export function AbsentReportsClient({ reports, branches, initialStatusFilter = "ALL" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (branchFilter !== "ALL" && r.branchId !== branchFilter) return false;
      if (search) {
        const lower = search.toLowerCase();
        if (!r.childName.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [reports, statusFilter, branchFilter, search]);

  const activeFilterCount = [
    statusFilter !== "ALL" ? statusFilter : "",
    branchFilter !== "ALL" ? branchFilter : "",
  ].filter(Boolean).length;

  // Status summary counts
  const counts = useMemo(() => {
    const c = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of reports) c[r.status]++;
    return c;
  }, [reports]);

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

  // -- Column definitions --
  const absenceColumns: ColumnDef<AbsenceReport>[] = [
    {
      accessorKey: "childName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Child
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.original.childName;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(name)}`}>
              {getInitials(name)}
            </div>
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground whitespace-nowrap">
          {format(new Date(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.reason;
        if (!reason) return <span className="text-xs text-muted-foreground">--</span>;
        return (
          <div className="flex items-start gap-1.5 max-w-[250px]">
            <MessageSquareText className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-sm text-foreground line-clamp-2">{reason}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
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
      accessorKey: "createdBy",
      header: "Reported By",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.createdBy}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {report.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => handleStatusUpdate(report.id, "APPROVED")}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                  <span className="text-xs">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleStatusUpdate(report.id, "REJECTED")}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
                  <span className="text-xs">Reject</span>
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/absent-reports/${report.id}`}>
                    <Eye className="mr-2 size-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/absent-reports/${report.id}/edit`}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteId(report.id)}
                >
                  <Trash2 className="mr-2 size-4" />
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
        breadcrumbs={[
          { label: "Absence Reports", href: "/absent-reports" },
          { label: "All Reports" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Status summary pills */}
        <div className="flex flex-wrap gap-2">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
            const config = statusConfig[s];
            const Icon = config.icon;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(isActive ? "ALL" : s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? config.color + " ring-2 ring-offset-1 ring-current/20"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-3.5" />
                {config.label}
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/60" : "bg-muted"
                }`}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
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

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px] h-9">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 h-7">
                  <Filter className="size-3" />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </Badge>
              )}

              <div className="flex-1" />

              <Button asChild className="bg-primary text-white hover:bg-primary/90">
                <Link href="/absent-reports/new">
                  <Plus className="mr-1 size-4" />
                  Report Absence
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 mb-4">
              <CalendarDays className="size-7 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">No absence reports found</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
              No absence reports match your current filters.
            </p>
            <Button asChild size="sm" className="mt-5">
              <Link href="/absent-reports/new">
                <Plus className="mr-1 size-3.5" />
                Report Absence
              </Link>
            </Button>
          </div>
        ) : (
          <DataTable
            columns={absenceColumns}
            data={filteredReports}
          />
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
