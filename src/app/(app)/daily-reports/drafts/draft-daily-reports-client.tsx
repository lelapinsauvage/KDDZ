"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
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

// ── Types ───────────────────────────────────────
interface DraftDailyReport {
  id: string;
  childName: string;
  date: string;
  status: "DRAFT";
  branchId: string;
  branchName: string;
}

// ── Helpers ─────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ── Column definitions ──────────────────────────
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
        Child Name
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
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
    accessorKey: "status",
    header: "Status",
    cell: () => (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        Draft
      </Badge>
    ),
  },
  {
    accessorKey: "branchName",
    header: "Branch",
    cell: ({ row }) => (
      <Badge variant="secondary" className="bg-[#e8ecf1] text-[#555] font-normal">
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
            <DropdownMenuItem
              onClick={() => console.log("Continue editing:", report.id)}
            >
              <Pencil className="mr-2 size-4" />
              Continue Editing
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => console.log("Delete draft:", report.id)}
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

// ── Props ────────────────────────────────────────
interface DraftDailyReportsClientProps {
  reports: DraftDailyReport[];
  branches: Array<{ id: string; name: string }>;
}

// ── Page Component ──────────────────────────────
export function DraftDailyReportsClient({
  reports,
  branches,
}: DraftDailyReportsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filteredDrafts = useMemo(() => {
    if (branchFilter === "ALL") return reports;
    return reports.filter((r) => r.branchId === branchFilter);
  }, [reports, branchFilter]);

  return (
    <>
      <PageHeader
        title="Draft Daily Reports"
        breadcrumbs={[
          { label: "Daily Reports", href: "/daily-reports" },
          { label: "Drafts" },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch filter */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />
        </div>

        {/* Data Table */}
        {filteredDrafts.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No draft reports found.</p>
          </div>
        ) : (
          <DataTable
            columns={draftDailyColumns}
            data={filteredDrafts}
            searchKey="childName"
            searchPlaceholder="Search by child name..."
          />
        )}
      </div>
    </>
  );
}
