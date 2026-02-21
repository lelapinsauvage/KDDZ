"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Row type that matches what getChildren() returns ──

export interface ChildRow {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string | null;
  gender: "MALE" | "FEMALE" | null;
  nationality: string | null;
  bloodType: string | null;
  branchId: string;
  classId: string | null;
  isActive: boolean;
  isDraft: boolean;
  branch: { id: string; name: string } | null;
  class: { id: string; name: string; branchId: string; ageGroup?: string | null } | null;
}

// ── Helpers ──────────────────────────────────

/** Derive display status from isActive / isDraft flags */
function getStatus(row: ChildRow): "ACTIVE" | "DRAFT" | "INACTIVE" {
  if (row.isDraft) return "DRAFT";
  if (row.isActive) return "ACTIVE";
  return "INACTIVE";
}

/** Get initials from first + last name */
function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Format date to dd/MM/yyyy */
function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Calculate age in years and months from date of birth */
function getAge(date: Date | string | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < d.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < d.getDate()) {
    months--;
    if (months < 0) months += 12;
  }
  if (years > 0) return `${years}y ${months}m`;
  return `${months}m`;
}

// ── Column Definitions ──────────────────────

interface ChildrenColumnsOptions {
  onDelete?: (id: string, name: string) => void;
}

export function getChildrenColumns(
  options: ChildrenColumnsOptions = {}
): ColumnDef<ChildRow>[] {
  return [
    // Avatar
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => {
        const child = row.original;
        const initials = getInitials(child.firstName, child.lastName);
        const bg = child.gender === "MALE" ? "bg-blue-500" : "bg-pink-500";
        return (
          <div
            className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white ${bg}`}
          >
            {initials}
          </div>
        );
      },
      enableSorting: false,
    },

    // Full Name
    {
      accessorKey: "fullName",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const child = row.original;
        return (
          <Link
            href={`/children/${child.id}`}
            className="font-medium text-[#337ab7] hover:text-[#23527c] hover:underline"
          >
            {child.firstName} {child.lastName}
          </Link>
        );
      },
    },

    // Class
    {
      accessorKey: "className",
      accessorFn: (row) => row.class?.name ?? "-",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Class
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-[#e8ecf1] text-[#555] font-normal">
          {row.original.class?.name ?? "-"}
        </Badge>
      ),
    },

    // Branch
    {
      accessorKey: "branchName",
      accessorFn: (row) => row.branch?.name ?? "-",
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
        <span className="text-[#555]">{row.original.branch?.name ?? "-"}</span>
      ),
    },

    // Gender
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Gender
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const gender = row.original.gender;
        if (!gender) return <span className="text-[#555]">-</span>;
        return (
          <Badge
            className={
              gender === "MALE"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-pink-100 text-pink-700 border-pink-200"
            }
          >
            {gender === "MALE" ? "Male" : "Female"}
          </Badge>
        );
      },
    },

    // Date of Birth
    {
      accessorKey: "dateOfBirth",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date of Birth
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const dob = row.original.dateOfBirth;
        const age = getAge(dob);
        return (
          <div className="text-[#555]">
            <div>{formatDate(dob)}</div>
            {age && <div className="text-xs text-muted-foreground">{age}</div>}
          </div>
        );
      },
    },

    // Status
    {
      accessorKey: "status",
      accessorFn: (row) => getStatus(row),
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
        const status = getStatus(row.original);
        const variants: Record<string, string> = {
          ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
          INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
          DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
        };
        const labels: Record<string, string> = {
          ACTIVE: "Active",
          INACTIVE: "Inactive",
          DRAFT: "Draft",
        };
        return (
          <Badge className={variants[status] ?? variants.INACTIVE}>
            {labels[status] ?? status}
          </Badge>
        );
      },
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return getStatus(row.original) === filterValue;
      },
    },

    // Actions
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const child = row.original;
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
                <Link href={`/children/${child.id}`}>
                  <Eye className="mr-2 size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/children/${child.id}?edit=true`}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  options.onDelete?.(
                    child.id,
                    `${child.firstName} ${child.lastName}`
                  );
                }}
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
}
