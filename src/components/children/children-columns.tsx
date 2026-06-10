"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, Pencil, Printer, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  childNumber: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string | null;
  gender: "MALE" | "FEMALE" | null;
  nationality: string | null;
  bloodType: string | null;
  photo: string | null;
  branchId: string;
  classId: string | null;
  isActive: boolean;
  isDraft: boolean;
  createdAt: Date | string;
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

/** Get initials from a full name string */
export function getInitialsFromName(name: string) {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/** Deterministic color from a name string — design-system accent palette */
const AVATAR_COLORS = [
  "bg-primary",
  "bg-[#D97706]",
  "bg-[#4F46E5]",
  "bg-[#059669]",
  "bg-[#EA580C]",
  "bg-[#0284C7]",
  "bg-[#E11D48]",
  "bg-[#7C3AED]",
  "bg-[#2563EB]",
  "bg-[#9333EA]",
] as const;

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Deterministic pastel color from a name string — for light-bg avatars */
const PASTEL_AVATAR_COLORS = [
  "bg-[#4F46E5]/15 text-[#4F46E5]",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-[#059669]/15 text-[#059669]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-primary/10 text-[#0B9178]",
  "bg-orange-100 text-orange-700",
] as const;

export function getPastelAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_AVATAR_COLORS[Math.abs(hash) % PASTEL_AVATAR_COLORS.length];
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

function childPhotoSrc(photo: string | null) {
  if (!photo) return null;
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
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

// ── Class pill color palette — design-system accents ──
const CLASS_COLORS = [
  "bg-primary/10 text-[#0B9178] border-[#0B9178]/20",
  "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20",
  "bg-[#059669]/10 text-[#059669] border-[#059669]/20",
  "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20",
  "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/20",
  "bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/20",
  "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20",
  "bg-[#9333EA]/10 text-[#9333EA] border-[#9333EA]/20",
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
  { className: string; label: string }
> = {
  ACTIVE: {
    className: "bg-[#008200] text-white border-transparent",
    label: "Active",
  },
  INACTIVE: {
    className: "bg-[#d64635] text-white border-transparent",
    label: "Inactive",
  },
  DRAFT: {
    className: "bg-[#c29d0b] text-white border-transparent",
    label: "Draft",
  },
};

// ── Column Definitions ──────────────────────

interface ChildrenColumnsOptions {
  onDelete?: (id: string, name: string) => void;
  onToggleActive?: (child: ChildRow) => void;
  onChangeClass?: (child: ChildRow, classId: string) => Promise<boolean>;
  classOptions?: Array<{ id: string; name: string; branchId: string }>;
  enableClassReassignment?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  variant?: "children" | "drafts";
}

function ChildClassSelect({
  child,
  classOptions,
  onChangeClass,
}: {
  child: ChildRow;
  classOptions: Array<{ id: string; name: string; branchId: string }>;
  onChangeClass: (child: ChildRow, classId: string) => Promise<boolean>;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const branchClassOptions = classOptions.filter(
    (item) => item.branchId === child.branchId
  );
  const hasCurrentClass =
    !child.classId || branchClassOptions.some((item) => item.id === child.classId);
  const options =
    hasCurrentClass || !child.class
      ? branchClassOptions
      : [
          ...branchClassOptions,
          { id: child.class.id, name: child.class.name, branchId: child.branchId },
        ];

  if (!options.length) {
    const name = child.class?.name;
    if (!name) return <span className="text-muted-foreground">-</span>;
    return (
      <Badge className={`font-medium border ${getClassColor(name)}`}>
        {name}
      </Badge>
    );
  }

  return (
    <Select
      value={child.classId ?? undefined}
      onValueChange={async (nextClassId) => {
        if (!nextClassId || nextClassId === child.classId) return;
        setIsSaving(true);
        await onChangeClass(child, nextClassId);
        setIsSaving(false);
      }}
      disabled={isSaving}
    >
      <SelectTrigger
        className="h-8 w-[150px] bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <SelectValue placeholder="No class" />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getChildrenColumns(
  options: ChildrenColumnsOptions = {}
): ColumnDef<ChildRow>[] {
  const variant = options.variant ?? "children";
  const columns: ColumnDef<ChildRow>[] = [
    // Child number
    {
      accessorKey: "childNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>S.N.</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.childNumber || "-"}
        </span>
      ),
    },

    // Image
    {
      id: "image",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) => {
        const child = row.original;
        const fullName = `${child.firstName} ${child.lastName}`;
        const initials = getInitials(child.firstName, child.lastName);
        const bg = getAvatarColor(fullName);
        const age = getAge(child.dateOfBirth);
        const status = getStatus(child);
        const photoSrc = childPhotoSrc(child.photo);

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/children/${child.id}`}
                  className={`flex size-12 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ${photoSrc ? "bg-muted" : bg}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {photoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoSrc} alt="" className="size-full object-cover" />
                  ) : (
                    initials
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="font-medium">{fullName}</p>
                {child.childNumber && (
                  <p className="text-muted-foreground">S.N.: {child.childNumber}</p>
                )}
                {age && <p className="text-muted-foreground">Age: {age}</p>}
                {child.class?.name && (
                  <p className="text-muted-foreground">Class: {child.class.name}</p>
                )}
                {child.branch?.name && (
                  <p className="text-muted-foreground">Branch: {child.branch.name}</p>
                )}
                <p className="text-muted-foreground">
                  Status: {status.charAt(0) + status.slice(1).toLowerCase()}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },

    // First Name
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column}>F Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const child = row.original;
        return (
          <Link
            href={`/children/${child.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {child.firstName}
          </Link>
        );
      },
    },

    // Last Name
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column}>L Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const child = row.original;
        return (
          <Link
            href={`/children/${child.id}`}
            className="text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {child.lastName}
          </Link>
        );
      },
    },

    // Date of Birth
    {
      accessorKey: "dateOfBirth",
      header: ({ column }) => (
        <SortableHeader column={column}>DOB</SortableHeader>
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

    // Class
    {
      accessorKey: "className",
      accessorFn: (row) => row.class?.name ?? "-",
      header: ({ column }) => (
        <SortableHeader column={column}>Class</SortableHeader>
      ),
      cell: ({ row }) => {
        if (
          variant === "children" &&
          options.canUpdate !== false &&
          options.enableClassReassignment &&
          options.classOptions &&
          options.onChangeClass
        ) {
          return (
            <ChildClassSelect
              child={row.original}
              classOptions={options.classOptions}
              onChangeClass={options.onChangeClass}
            />
          );
        }

        const name = row.original.class?.name;
        if (!name) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge className={`font-medium border ${getClassColor(name)}`}>
            {name}
          </Badge>
        );
      },
    },
  ];

  if (variant === "drafts") {
    columns.push({
      accessorKey: "nationality",
      header: ({ column }) => (
        <SortableHeader column={column}>Nationality</SortableHeader>
      ),
      cell: ({ row }) => {
        const nationality = row.original.nationality;
        if (!nationality) return <span className="text-muted-foreground">-</span>;
        return <span className="text-sm">{nationality}</span>;
      },
    });
  }

  if (variant === "children") {
    columns.push({
      accessorKey: "status",
      accessorFn: (row) => getStatus(row),
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = getStatus(row.original);
        const { className, label } =
          STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
        const canUpdate = options.canUpdate !== false;
        return (
          <Badge
            role={canUpdate ? "button" : undefined}
            tabIndex={canUpdate ? 0 : undefined}
            className={`${canUpdate ? "cursor-pointer" : "cursor-default"} border ${className}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!canUpdate) return;
              options.onToggleActive?.(row.original);
            }}
            onKeyDown={(event) => {
              if (!canUpdate) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                options.onToggleActive?.(row.original);
              }
            }}
          >
            {label}
          </Badge>
        );
      },
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return getStatus(row.original) === filterValue;
      },
    });
  }

  columns.push(
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
                gender === "MALE" ? "bg-[#4F46E5]" : "bg-[#E11D48]"
              }`}
            />
            <span className="text-sm">
              {gender === "MALE" ? "Boy" : "Girl"}
            </span>
          </div>
        );
      },
    },

    // Created Date
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Date</SortableHeader>
      ),
      cell: ({ row }) => {
        return <span className="text-sm">{formatDate(row.original.createdAt)}</span>;
      },
    },
  );

  columns.push(
    // Actions
    {
      id: "actions",
      header: "Action",
      meta: { className: "print:hidden" },
      cell: ({ row }) => {
        const child = row.original;
        const canUpdate = options.canUpdate !== false;
        const canDelete = options.canDelete !== false;
        return (
          <div className="flex items-center gap-0.5 print:hidden">
            {variant === "children" ? (
              <>
                <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                  <Link
                    href={`/children/${child.id}/dashboard`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LayoutDashboard className="size-4 text-muted-foreground" />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                  <Link
                    href={`/children/${child.id}/print`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Printer className="size-4 text-muted-foreground" />
                    <span className="sr-only">Print</span>
                  </Link>
                </Button>
              </>
            ) : null}
            {canUpdate ? (
              <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                <Link
                  href={`/children/${child.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="size-4 text-muted-foreground" />
                  <span className="sr-only">Edit</span>
                </Link>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  options.onDelete?.(child.id, `${child.firstName} ${child.lastName}`);
                }}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete</span>
              </Button>
            ) : null}
          </div>
        );
      },
      enableSorting: false,
    },
  );

  return columns;
}
