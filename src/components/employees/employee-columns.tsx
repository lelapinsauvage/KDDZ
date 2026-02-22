"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
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

export function createEmployeeColumns(
  type: EmployeeType
): ColumnDef<Employee>[] {
  const _typePlural =
    type === "nurse"
      ? "Nurses"
      : type === "teacher"
        ? "Teachers"
        : type === "doctor"
          ? "Doctors"
          : "Managers";

  const columns: ColumnDef<Employee>[] = [
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex size-9 items-center justify-center rounded-full bg-[#1caf9a]/10 text-xs font-semibold text-[#1caf9a]">
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
            className="font-medium text-[#333] hover:text-[#1caf9a] transition-colors"
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
        <span className="text-[#6f7b8a]">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-[#6f7b8a]">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-[#eef0f3] text-[#6f7b8a] font-normal">
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
        <span className="text-[#6f7b8a]">
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
        <span className="text-[#6f7b8a]">
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
          <Badge
            className={
              status === "Active"
                ? "bg-[#1caf9a]/10 text-[#1caf9a] border-[#1caf9a]/20"
                : "bg-red-50 text-red-600 border-red-200"
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
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
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
