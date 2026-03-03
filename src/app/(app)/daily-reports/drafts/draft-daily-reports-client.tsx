"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  FileEdit,
  Search,
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
import { deleteDailyReport } from "@/lib/actions/daily-reports";
import { format } from "date-fns";
import { getInitialsFromName, getPastelAvatarColor } from "@/components/children/children-columns";

// -- Types --
interface DraftDailyReport {
  id: string;
  childName: string;
  date: string;
  status: "DRAFT";
  branchId: string;
  branchName: string;
}

// -- Props --
interface DraftDailyReportsClientProps {
  reports: DraftDailyReport[];
  branches: Array<{ id: string; name: string }>;
}

// -- Component --
export function DraftDailyReportsClient({
  reports,
  branches,
}: DraftDailyReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredDrafts = useMemo(() => {
    let data = reports;
    if (branchFilter !== "ALL") data = data.filter((r) => r.branchId === branchFilter);
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((r) => r.childName.toLowerCase().includes(lower));
    }
    return data;
  }, [reports, branchFilter, search]);

  const activeFilterCount = [
    branchFilter !== "ALL" ? branchFilter : "",
  ].filter(Boolean).length;

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteDailyReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  const draftDailyColumns: ColumnDef<DraftDailyReport>[] = [
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
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getPastelAvatarColor(name)}`}>
              {getInitialsFromName(name)}
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
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
          <FileEdit className="size-3" />
          Draft
        </Badge>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
          {row.original.branchName}
        </Badge>
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
                <Link href={`/daily-reports/${report.id}/edit`}>
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
        title="Draft Daily Reports"
        breadcrumbs={[
          { label: "Daily Reports", href: "/daily-reports" },
          { label: "Drafts" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
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
                <SelectTrigger className="w-full sm:w-[170px] h-9">
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
            </div>
          </CardContent>
        </Card>

        {filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 mb-4">
              <FileEdit className="size-7 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">No draft reports found</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              All reports have been submitted or no drafts match your filters.
            </p>
          </div>
        ) : (
          <DataTable
            columns={draftDailyColumns}
            data={filteredDrafts}
          />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
