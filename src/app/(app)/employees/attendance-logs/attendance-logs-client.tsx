"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface AlarmLog {
  id: string;
  employee: string;
  type: string;
  message: string;
  dueDate: string | null;
  createdAt: string;
}

interface AttendanceLogsClientProps {
  logs: AlarmLog[];
}

const typeColors: Record<string, string> = {
  EVENT: "bg-blue-100 text-blue-700",
  MEDICAL: "bg-red-100 text-red-700",
  BIRTHDAY: "bg-pink-100 text-pink-700",
  ASSESSMENT: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export function AttendanceLogsClient({ logs }: AttendanceLogsClientProps) {
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const columns: ColumnDef<AlarmLog>[] = useMemo(
    () => [
      {
        accessorKey: "employee",
        header: "Related To",
        cell: ({ row }) => <span className="font-medium">{row.original.employee}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge className={typeColors[row.original.type] ?? "bg-gray-100 text-gray-700"}>
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "message",
        header: "Details",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.message || "—"}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="font-mono text-sm text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.dueDate
              ? new Date(row.original.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Attendance Logs"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Attendance Logs" },
        ]}
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">From</Label>
            <Input
              type="date"
              className="w-[160px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">To</Label>
            <Input
              type="date"
              className="w-[160px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        {logs.length > 0 ? (
          <DataTable
            columns={columns}
            data={logs}
            searchKey="employee"
            searchPlaceholder="Search logs..."
          />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No attendance log entries found. The system does not currently have an EmployeeAttendance model. Logs shown here are sourced from the Alarm system.
          </div>
        )}
      </div>
    </>
  );
}
