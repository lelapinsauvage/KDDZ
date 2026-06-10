"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { CalendarDays, Download, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { SortableHeader } from "@/components/shared/data-table";
import { getInitials, getAvatarColor } from "@/components/children/children-columns";

export type EmployeeType = "teacher" | "nurse" | "doctor" | "manager";

export interface Employee {
  id: string;
  legacyId?: number | null;
  branchId?: string | null;
  classId?: string | null;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  email: string;
  phone: string;
  mobile: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  branch: string;
  className?: string;
  specialization?: string;
  hireDate: string;
  createdAt: string;
  status: "Active" | "Inactive";
  type: EmployeeType;
}

function getDetailPath(type: EmployeeType, id: string): string {
  const typeMap: Record<EmployeeType, string> = {
    teacher: "teachers",
    nurse: "nurses",
    doctor: "doctors",
    manager: "managers",
  };
  return `/employees/${typeMap[type]}/${id}`;
}

function getLegacyIdOrModernId(employee: Employee): string {
  return String(employee.legacyId ?? employee.id);
}

export const roleColors: Record<EmployeeType, string> = {
  teacher: "bg-amber-50 text-amber-700 border-amber-200",
  nurse: "bg-emerald-50 text-emerald-700 border-emerald-200",
  doctor: "bg-blue-50 text-blue-700 border-blue-200",
  manager: "bg-violet-50 text-violet-700 border-violet-200",
};

export const avatarColors: Record<EmployeeType, string> = {
  teacher: "bg-amber-100 text-amber-700",
  nurse: "bg-emerald-100 text-emerald-700",
  doctor: "bg-blue-100 text-blue-700",
  manager: "bg-violet-100 text-violet-700",
};

const ROLE_LABELS: Record<EmployeeType, string> = {
  teacher: "Teacher",
  nurse: "Nurse",
  doctor: "Doctor",
  manager: "Manager",
};

interface EmployeeColumnsOptions {
  onDelete?: (id: string, name: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function createEmployeeColumns(
  type: EmployeeType,
  options: EmployeeColumnsOptions = {}
): ColumnDef<Employee>[] {
  return [
    // Avatar
    {
      id: "serial",
      header: ({ column }) => (
        <SortableHeader column={column}>#</SortableHeader>
      ),
      accessorFn: (employee) => employee.legacyId ?? 0,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.legacyId ?? row.index + 1}
        </span>
      ),
    },
    {
      id: "avatar",
      header: "Image",
      cell: ({ row }) => {
        const employee = row.original;
        const fullName = `${employee.firstName} ${employee.lastName}`;
        const bg = getAvatarColor(fullName);
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex size-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ${employee.imageUrl ? "bg-muted" : bg}`}
                >
                  {employee.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employee.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    getInitials(employee.firstName, employee.lastName)
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                <p className="text-muted-foreground">Role: {ROLE_LABELS[employee.type]}</p>
                {employee.email && (
                  <p className="text-muted-foreground">{employee.email}</p>
                )}
                {employee.branch && (
                  <p className="text-muted-foreground">Branch: {employee.branch}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    // First Name
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column}>First Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <Link
            href={getDetailPath(employee.type, employee.id)}
            className="font-medium text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {employee.firstName}
          </Link>
        );
      },
    },
    // Last Name
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column}>Last Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <Link
            href={getDetailPath(employee.type, employee.id)}
            className="font-medium text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {employee.lastName}
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
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.dateOfBirth
            ? format(new Date(row.original.dateOfBirth), "dd/MM/yyyy")
            : "—"}
        </span>
      ),
    },
    // Branch
    {
      accessorKey: "branch",
      header: ({ column }) => (
        <SortableHeader column={column}>Branch</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.branch || "—"}</span>
      ),
    },
    // Mobile
    ...(type === "teacher"
      ? [
          {
            accessorKey: "className",
            header: "Class",
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.className || "—"}
              </span>
            ),
          } satisfies ColumnDef<Employee>,
        ]
      : [
          {
            accessorKey: "mobile",
            header: "Mobile",
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.mobile || "—"}
              </span>
            ),
          } satisfies ColumnDef<Employee>,
        ]),
    // Nationality
    {
      accessorKey: "nationality",
      header: "Nationality",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.nationality || "—"}
        </span>
      ),
    },
    // Gender
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.gender || "—"}
        </span>
      ),
    },
    // Created Date
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created Date</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.createdAt
            ? format(new Date(row.original.createdAt), "dd/MM/yyyy")
            : "—"}
        </span>
      ),
    },
    // Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === "Active";
        return (
          <Badge
            className={`border ${
              isActive
                ? "bg-[#008200] text-white border-transparent"
                : "bg-[#d64635] text-white border-transparent"
            }`}
          >
            {status}
          </Badge>
        );
      },
    },
    // Actions
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        const canUpdate = options.canUpdate !== false;
        const canDelete = options.canDelete !== false;
        return (
          <div className="flex items-center gap-0.5">
            {employee.type === "teacher" ? (
              <>
                <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                  <Link
                    href={`/calendar.php?id=${encodeURIComponent(getLegacyIdOrModernId(employee))}`}
                    onClick={(e) => e.stopPropagation()}
                    title="Calendar"
                  >
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span className="sr-only">Calendar</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                  <Link
                    href={`/view.php?p=teacher&id=${encodeURIComponent(getLegacyIdOrModernId(employee))}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Download profile"
                  >
                    <Download className="size-4 text-muted-foreground" />
                    <span className="sr-only">Download profile</span>
                  </Link>
                </Button>
              </>
            ) : null}
            <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
              <Link href={getDetailPath(employee.type, employee.id)} onClick={(e) => e.stopPropagation()}>
                <Eye className="size-4 text-muted-foreground" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            {canUpdate ? (
              <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                <Link href={`${getDetailPath(employee.type, employee.id)}/edit`} onClick={(e) => e.stopPropagation()}>
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
                  options.onDelete?.(employee.id, `${employee.firstName} ${employee.lastName}`);
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
  ];
}
