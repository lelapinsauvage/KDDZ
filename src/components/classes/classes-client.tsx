"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──

export interface ClassRow {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  ageGroup: string;
  capacity: number;
  studentCount: number;
  status: "Active" | "Inactive";
}

export interface BranchOption {
  id: string;
  name: string;
}

interface ClassesClientProps {
  classes: ClassRow[];
  branches: BranchOption[];
}

// ── Column definitions ──

const classColumns: ColumnDef<ClassRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Class Name
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "branchName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Branch
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-[#555]">{row.original.branchName}</span>
    ),
  },
  {
    accessorKey: "ageGroup",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Age Group
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="bg-[#e8ecf1] text-[#555] font-normal"
      >
        {row.original.ageGroup
          ? `${row.original.ageGroup} yrs`
          : "---"}
      </Badge>
    ),
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Capacity
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-[#555]">{row.original.capacity}</span>
    ),
  },
  {
    accessorKey: "studentCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Students
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const { studentCount, capacity } = row.original;
      const ratio = capacity > 0 ? studentCount / capacity : 0;
      const color =
        ratio >= 0.9
          ? "text-red-600"
          : ratio >= 0.7
            ? "text-amber-600"
            : "text-[#555]";
      return (
        <span className={color}>
          {studentCount}/{capacity}
        </span>
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
      return (
        <Badge
          className={
            status === "Active"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const cls = row.original;
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
              onClick={() => console.log("View class:", cls.id)}
            >
              <Eye className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Edit class:", cls.id)}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => console.log("Delete class:", cls.id)}
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

// ── Component ──

export function ClassesClient({ classes, branches }: ClassesClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filteredRows = useMemo(() => {
    if (branchFilter === "ALL") return classes;
    return classes.filter((r) => r.branchId === branchFilter);
  }, [branchFilter, classes]);

  return (
    <>
      <PageHeader
        title="Classes Management"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Classes Management" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
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

          <Button style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 size-4" />
            Add Class
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={classColumns}
          data={filteredRows}
          searchKey="name"
          searchPlaceholder="Search classes..."
        />
      </div>
    </>
  );
}
