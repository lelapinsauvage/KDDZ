"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck } from "lucide-react";

interface EmployeeAttendance {
  id: string;
  employeeName: string;
  role: string;
  branch: string;
  isActive: boolean;
}

interface BranchOption {
  id: string;
  name: string;
}

interface AttendanceClientProps {
  employees: EmployeeAttendance[];
  branches: BranchOption[];
}

const roleColors: Record<string, string> = {
  Teacher: "bg-blue-100 text-blue-700",
  Nurse: "bg-pink-100 text-pink-700",
  Doctor: "bg-purple-100 text-purple-700",
  Manager: "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
};

export function AttendanceClient({ employees, branches }: AttendanceClientProps) {
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return employees.filter((a) => {
      if (branchFilter !== "ALL" && a.branch !== branchFilter) return false;
      return true;
    });
  }, [branchFilter, employees]);

  const columns: ColumnDef<EmployeeAttendance>[] = useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-[#1caf9a]" />
            <span className="font-medium">{row.original.employeeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge className={roleColors[row.original.role] ?? "bg-gray-100 text-gray-700"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "branch",
        header: "Branch",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.isActive ? "Active" : "Inactive";
          return (
            <Badge className={statusColors[status]}>{status}</Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Employee Attendance"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Attendance" },
        ]}
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Input
            type="date"
            className="w-[180px]"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="employeeName"
          searchPlaceholder="Search employees..."
        />
      </div>
    </>
  );
}
