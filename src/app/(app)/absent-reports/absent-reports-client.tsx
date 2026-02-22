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
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteAbsenceReport } from "@/lib/actions/absent-reports";

// ── Types ───────────────────────────────────────
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
}

// ── Helpers ─────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const statusColors: Record<AbsenceStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<AbsenceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ── Component ──────────────────────────────
export function AbsentReportsClient({ reports, branches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (branchFilter !== "ALL" && r.branchId !== branchFilter) return false;
      return true;
    });
  }, [reports, statusFilter, branchFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteAbsenceReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  // ── Column definitions ──────────────────────────
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
          Child Name
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.childName}</span>
      ),
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
        <span className="text-[#555]">{formatDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-[#555] max-w-[200px] truncate block">{row.original.reason || "—"}</span>
      ),
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
        return (
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.createdBy}</span>
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
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/absent-reports/new">
              <Plus className="mr-1 size-4" />
              Create Absence Report
            </Link>
          </Button>
        </div>

        <DataTable
          columns={absenceColumns}
          data={filteredReports}
          searchKey="childName"
          searchPlaceholder="Search by child name..."
        />
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
