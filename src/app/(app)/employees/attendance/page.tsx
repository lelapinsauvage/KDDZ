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
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: "Present" | "Absent" | "Late";
  branch: string;
}

const demoAttendance: EmployeeAttendance[] = [
  { id: "att-1", employeeName: "Sara Khalil", role: "Teacher", date: "2026-02-21", checkIn: "07:45", checkOut: "16:00", hours: "8.25", status: "Present", branch: "Main Branch" },
  { id: "att-2", employeeName: "Rima Haddad", role: "Teacher", date: "2026-02-21", checkIn: "08:15", checkOut: "16:30", hours: "8.25", status: "Late", branch: "Main Branch" },
  { id: "att-3", employeeName: "Nadia Karam", role: "Teacher", date: "2026-02-21", checkIn: "07:50", checkOut: "16:00", hours: "8.17", status: "Present", branch: "Main Branch" },
  { id: "att-4", employeeName: "Fadi Mansour", role: "Teacher", date: "2026-02-21", checkIn: "-", checkOut: "-", hours: "-", status: "Absent", branch: "Downtown Branch" },
  { id: "att-5", employeeName: "Maya Rizk", role: "Nurse", date: "2026-02-21", checkIn: "07:55", checkOut: "16:00", hours: "8.08", status: "Present", branch: "Main Branch" },
  { id: "att-6", employeeName: "Dr. Hana Sfeir", role: "Doctor", date: "2026-02-21", checkIn: "09:00", checkOut: "13:00", hours: "4.00", status: "Present", branch: "Downtown Branch" },
  { id: "att-7", employeeName: "Rania Jabbour", role: "Manager", date: "2026-02-21", checkIn: "07:30", checkOut: "17:00", hours: "9.50", status: "Present", branch: "Main Branch" },
  { id: "att-8", employeeName: "Georges Azar", role: "Teacher", date: "2026-02-21", checkIn: "08:20", checkOut: "16:00", hours: "7.67", status: "Late", branch: "Suburb Branch" },
  { id: "att-9", employeeName: "Layla Tabbara", role: "Teacher", date: "2026-02-21", checkIn: "07:40", checkOut: "16:00", hours: "8.33", status: "Present", branch: "Suburb Branch" },
  { id: "att-10", employeeName: "Hiba Mouawad", role: "Nurse", date: "2026-02-21", checkIn: "07:50", checkOut: "15:30", hours: "7.67", status: "Present", branch: "Downtown Branch" },
];

const roleColors: Record<string, string> = {
  Teacher: "bg-blue-100 text-blue-700",
  Nurse: "bg-pink-100 text-pink-700",
  Doctor: "bg-purple-100 text-purple-700",
  Manager: "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  Present: "bg-emerald-100 text-emerald-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-amber-100 text-amber-700",
};

export default function EmployeeAttendancePage() {
  const [dateFilter, setDateFilter] = useState("2026-02-21");
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return demoAttendance.filter((a) => {
      if (branchFilter !== "ALL" && a.branch !== branchFilter) return false;
      return true;
    });
  }, [branchFilter]);

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
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.date + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      { accessorKey: "checkIn", header: "Check In" },
      { accessorKey: "checkOut", header: "Check Out" },
      {
        accessorKey: "hours",
        header: "Hours",
        cell: ({ row }) => (
          <span>{row.original.hours === "-" ? "-" : `${row.original.hours}h`}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
        ),
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
              <SelectItem value="Main Branch">Main Branch</SelectItem>
              <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
              <SelectItem value="Suburb Branch">Suburb Branch</SelectItem>
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
