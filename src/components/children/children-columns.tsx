"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Eye, Pencil, Trash2, MoreHorizontal, CircleCheck, CircleDashed, CircleOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableHeader } from "@/components/shared/data-table";

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
export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Deterministic color from a name string — warm, earthy palette */
const AVATAR_COLORS = [
  "bg-[#C35A2C]",
  "bg-[#B08968]",
  "bg-[#8B7355]",
  "bg-[#6B8F71]",
  "bg-[#E8A87C]",
  "bg-[#A0522D]",
  "bg-[#D4956A]",
  "bg-[#7A6B5D]",
  "bg-[#C4A882]",
  "bg-[#9B6B4A]",
] as const;

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

// ── Class pill color palette — warm earthy tones ──
const CLASS_COLORS = [
  "bg-[#C35A2C]/10 text-[#C35A2C] border-[#C35A2C]/20",
  "bg-[#B08968]/10 text-[#B08968] border-[#B08968]/20",
  "bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20",
  "bg-[#8B7355]/10 text-[#8B7355] border-[#8B7355]/20",
  "bg-[#A0522D]/10 text-[#A0522D] border-[#A0522D]/20",
  "bg-[#D4956A]/10 text-[#D4956A] border-[#D4956A]/20",
  "bg-[#7A6B5D]/10 text-[#7A6B5D] border-[#7A6B5D]/20",
  "bg-[#9B6B4A]/10 text-[#9B6B4A] border-[#9B6B4A]/20",
] as const;

function getClassColor(className: string): string {
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLASS_COLORS[Math.abs(hash) % CLASS_COLORS.length];
}

// ── Status badge config (shared) ─────────────

const STATUS_CONFIG: Record<
  string,
  { className: string; icon: typeof CircleCheck; label: string }
> = {
  ACTIVE: {
    className:
      "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20",
    icon: CircleCheck,
    label: "Active",
  },
  INACTIVE: {
    className: "bg-muted text-muted-foreground border-muted",
    icon: CircleOff,
    label: "Inactive",
  },
  DRAFT: {
    className:
      "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
    icon: CircleDashed,
    label: "Draft",
  },
};

// ── Column Definitions ──────────────────────

interface ChildrenColumnsOptions {
  onDelete?: (id: string, name: string) => void;
}

export function getChildrenColumns(
  options: ChildrenColumnsOptions = {}
): ColumnDef<ChildRow>[] {
  return [
    // Avatar — with tooltip showing extra info (hidden in print)
    {
      id: "avatar",
      header: "",
      meta: { className: "print:hidden" },
      cell: ({ row }) => {
        const child = row.original;
        const fullName = `${child.firstName} ${child.lastName}`;
        const initials = getInitials(child.firstName, child.lastName);
        const bg = getAvatarColor(fullName);
        const age = getAge(child.dateOfBirth);
        const status = getStatus(child);

        return (
          <div className="print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex size-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${bg}`}
                  >
                    {initials}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="font-medium">{fullName}</p>
                  {age && <p className="text-muted-foreground">Age: {age}</p>}
                  {child.class?.name && (
                    <p className="text-muted-foreground">Class: {child.class.name}</p>
                  )}
                  {child.branch?.name && (
                    <p className="text-muted-foreground">Branch: {child.branch.name}</p>
                  )}
                  <p className="text-muted-foreground">Status: {status.charAt(0) + status.slice(1).toLowerCase()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      enableSorting: false,
    },

    // Full Name — with sort indicator
    {
      accessorKey: "fullName",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <SortableHeader column={column}>Full Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const child = row.original;
        return (
          <Link
            href={`/children/${child.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
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
        <SortableHeader column={column}>Class</SortableHeader>
      ),
      cell: ({ row }) => {
        const name = row.original.class?.name;
        if (!name) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge className={`font-medium border ${getClassColor(name)}`}>
            {name}
          </Badge>
        );
      },
    },

    // Branch
    {
      accessorKey: "branchName",
      accessorFn: (row) => row.branch?.name ?? "-",
      header: ({ column }) => (
        <SortableHeader column={column}>Branch</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.branch?.name ?? "-"}</span>
      ),
    },

    // Gender
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <SortableHeader column={column}>Gender</SortableHeader>
      ),
      cell: ({ row }) => {
        const gender = row.original.gender;
        if (!gender) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${
                gender === "MALE" ? "bg-[#8B7355]" : "bg-[#D4956A]"
              }`}
            />
            <span className="text-sm">
              {gender === "MALE" ? "Boy" : "Girl"}
            </span>
          </div>
        );
      },
    },

    // Date of Birth
    {
      accessorKey: "dateOfBirth",
      header: ({ column }) => (
        <SortableHeader column={column}>Date of Birth</SortableHeader>
      ),
      cell: ({ row }) => {
        const dob = row.original.dateOfBirth;
        const age = getAge(dob);
        return (
          <div>
            <div className="text-sm">{formatDate(dob)}</div>
            {age && <div className="text-xs text-muted-foreground">{age}</div>}
          </div>
        );
      },
    },

    // Status — colored badge with icon
    {
      accessorKey: "status",
      accessorFn: (row) => getStatus(row),
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = getStatus(row.original);
        const { className, icon: Icon, label } =
          STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
        return (
          <Badge className={`gap-1 border ${className}`}>
            <Icon className="size-3" />
            {label}
          </Badge>
        );
      },
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return getStatus(row.original) === filterValue;
      },
    },

    // Actions (hidden in print)
    {
      id: "actions",
      header: "",
      meta: { className: "print:hidden" },
      cell: ({ row }) => {
        const child = row.original;
        return (
          <div className="print:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4 text-muted-foreground hover:text-primary" />
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
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}
