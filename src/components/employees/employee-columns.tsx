"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, CircleCheck, CircleOff } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { SortableHeader } from "@/components/shared/data-table";

export type EmployeeType = "teacher" | "nurse" | "doctor" | "manager";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: string;
  specialization?: string;
  hireDate: string;
  status: "Active" | "Inactive";
  type: EmployeeType;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

export function createEmployeeColumns(
  type: EmployeeType
): ColumnDef<Employee>[] {
  const columns: ColumnDef<Employee>[] = [
    // Avatar — with tooltip showing extra info
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        const colorClass = avatarColors[employee.type] || avatarColors.teacher;
        const fullName = `${employee.firstName} ${employee.lastName}`;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
                >
                  {getInitials(employee.firstName, employee.lastName)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="font-medium">{fullName}</p>
                <p className="text-muted-foreground">Role: {ROLE_LABELS[employee.type]}</p>
                <p className="text-muted-foreground">{employee.email}</p>
                <p className="text-muted-foreground">{employee.phone}</p>
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
    // Full Name — with sort indicator
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <SortableHeader column={column}>Full Name</SortableHeader>
      ),
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => {
        const employee = row.original;
        const fullName = `${employee.firstName} ${employee.lastName}`;
        return (
          <Link
            href={getDetailPath(employee.type, employee.id)}
            className="font-medium text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {fullName}
          </Link>
        );
      },
    },
    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>Email</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5 text-muted-foreground/60" />
          {row.original.email}
        </span>
      ),
    },
    // Phone
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Phone className="size-3.5 text-muted-foreground/60" />
          {row.original.phone}
        </span>
      ),
    },
    // Branch
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal">
          {row.original.branch}
        </Badge>
      ),
    },
  ];

  // Add specialization column for doctors and teachers
  if (type === "doctor" || type === "teacher") {
    columns.push({
      accessorKey: "specialization",
      header: "Specialization",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.specialization || "---"}
        </span>
      ),
    });
  }

  columns.push(
    // Hire Date — with sort indicator
    {
      accessorKey: "hireDate",
      header: ({ column }) => (
        <SortableHeader column={column}>Hire Date</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.hireDate), "MMM d, yyyy")}
        </span>
      ),
    },
    // Status — colored badge with icon (consistent with children)
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === "Active";
        return (
          <Badge
            className={`gap-1 border ${
              isActive
                ? "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20"
                : "bg-muted text-muted-foreground border-muted"
            }`}
          >
            {isActive ? (
              <CircleCheck className="size-3" />
            ) : (
              <CircleOff className="size-3" />
            )}
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4 text-muted-foreground hover:text-primary" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={getDetailPath(employee.type, employee.id)}>
                  <Eye className="size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${getDetailPath(employee.type, employee.id)}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    }
  );

  return columns;
}
