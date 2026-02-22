"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
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
interface DraftAbsenceReport {
  id: string;
  childName: string;
  date: string;
  reason: string;
  status: "DRAFT";
  createdBy: string;
  branchId: string;
  branchName: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface Props {
  drafts: DraftAbsenceReport[];
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

// ── Component ──────────────────────────────
export function DraftsClient({ drafts, branches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredDrafts = useMemo(() => {
    if (branchFilter === "ALL") return drafts;
    return drafts.filter((r) => r.branchId === branchFilter);
  }, [drafts, branchFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteAbsenceReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  // ── Column definitions ──────────────────────────
  const draftColumns: ColumnDef<DraftAbsenceReport>[] = [
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
      header: "Status",
      cell: () => (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Draft
        </Badge>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.createdBy}</span>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <span className="text-[#555]">{row.original.branchName}</span>
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
                <Link href={`/absent-reports/${report.id}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  Continue Editing
                </Link>
              </DropdownMenuItem>
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
        title="Draft Absence Reports"
        breadcrumbs={[
          { label: "Absence Reports", href: "/absent-reports" },
          { label: "Drafts" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
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
          columns={draftColumns}
          data={filteredDrafts}
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
