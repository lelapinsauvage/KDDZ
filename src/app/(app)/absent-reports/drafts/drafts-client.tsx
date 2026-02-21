"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
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
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-[#555]">{row.original.reason}</span>
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
            <DropdownMenuItem
              onClick={() => console.log("View draft:", report.id)}
            >
              <Eye className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Edit draft:", report.id)}
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

// ── Component ──────────────────────────────
export function DraftsClient({ drafts, branches }: Props) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filteredDrafts = useMemo(() => {
    if (branchFilter === "ALL") return drafts;
    return drafts.filter((r) => r.branchId === branchFilter);
  }, [drafts, branchFilter]);

  return (
    <>
      <PageHeader
        title="Draft Absence Reports"
        breadcrumbs={[
          { label: "Absence Reports", href: "/absent-reports" },
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

          {/* Create Report button */}
          <Button
            className="bg-[#1caf9a] text-white hover:bg-[#18a08d]"
            onClick={() => console.log("Create new absence report")}
          >
            <Plus className="mr-1 size-4" />
            Create Absence Report
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={draftColumns}
          data={filteredDrafts}
          searchKey="childName"
          searchPlaceholder="Search by child name..."
        />
      </div>
    </>
  );
}
