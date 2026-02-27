"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
  teacher: "bg-[#C35A2C]/10 text-[#C35A2C] border-[#C35A2C]/20",
  nurse: "bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20",
  doctor: "bg-[#8B7355]/10 text-[#8B7355] border-[#8B7355]/20",
  manager: "bg-[#B08968]/10 text-[#B08968] border-[#B08968]/20",
};

export const avatarColors: Record<EmployeeType, string> = {
  teacher: "bg-[#C35A2C]/10 text-[#C35A2C]",
  nurse: "bg-[#6B8F71]/10 text-[#6B8F71]",
  doctor: "bg-[#8B7355]/10 text-[#8B7355]",
  manager: "bg-[#B08968]/10 text-[#B08968]",
};

export function createEmployeeColumns(
  type: EmployeeType
): ColumnDef<Employee>[] {
  const columns: ColumnDef<Employee>[] = [
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        const colorClass = avatarColors[employee.type] || avatarColors.teacher;
        return (
          <div className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}>
            {getInitials(employee.firstName, employee.lastName)}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "fullName",
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
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => {
        const employee = row.original;
        const fullName = `${employee.firstName} ${employee.lastName}`;
        return (
          <Link
            href={getDetailPath(employee.type, employee.id)}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {fullName}
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5 text-muted-foreground/60" />
          {row.original.email}
        </span>
      ),
    },
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
    {
      accessorKey: "hireDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Hire Date
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.hireDate), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2 rounded-full ${
                status === "Active" ? "bg-[#6B8F71]" : "bg-muted-foreground/40"
              }`}
            />
            <Badge
              className={
                status === "Active"
                  ? "bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20"
                  : "bg-muted text-muted-foreground border-muted"
              }
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
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
              <DropdownMenuItem>
                <Pencil className="size-4" />
                Edit
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
