"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut } from "lucide-react";

interface AttendanceLog {
  id: string;
  employee: string;
  action: "Check In" | "Check Out";
  timestamp: string;
  method: "Manual" | "Biometric" | "Card";
  notes: string;
}

const demoLogs: AttendanceLog[] = [
  { id: "log-1", employee: "Sara Khalil", action: "Check In", timestamp: "2026-02-21 07:45:12", method: "Biometric", notes: "" },
  { id: "log-2", employee: "Nadia Karam", action: "Check In", timestamp: "2026-02-21 07:50:33", method: "Card", notes: "" },
  { id: "log-3", employee: "Maya Rizk", action: "Check In", timestamp: "2026-02-21 07:55:01", method: "Biometric", notes: "" },
  { id: "log-4", employee: "Rania Jabbour", action: "Check In", timestamp: "2026-02-21 07:30:45", method: "Card", notes: "Early arrival" },
  { id: "log-5", employee: "Rima Haddad", action: "Check In", timestamp: "2026-02-21 08:15:22", method: "Manual", notes: "Card malfunction" },
  { id: "log-6", employee: "Layla Tabbara", action: "Check In", timestamp: "2026-02-21 07:40:18", method: "Biometric", notes: "" },
  { id: "log-7", employee: "Hiba Mouawad", action: "Check In", timestamp: "2026-02-21 07:50:55", method: "Card", notes: "" },
  { id: "log-8", employee: "Dr. Hana Sfeir", action: "Check In", timestamp: "2026-02-21 09:00:10", method: "Manual", notes: "Part-time schedule" },
  { id: "log-9", employee: "Georges Azar", action: "Check In", timestamp: "2026-02-21 08:20:44", method: "Biometric", notes: "Traffic delay" },
  { id: "log-10", employee: "Dr. Hana Sfeir", action: "Check Out", timestamp: "2026-02-21 13:00:05", method: "Manual", notes: "" },
  { id: "log-11", employee: "Hiba Mouawad", action: "Check Out", timestamp: "2026-02-21 15:30:20", method: "Card", notes: "" },
  { id: "log-12", employee: "Sara Khalil", action: "Check Out", timestamp: "2026-02-21 16:00:08", method: "Biometric", notes: "" },
  { id: "log-13", employee: "Nadia Karam", action: "Check Out", timestamp: "2026-02-21 16:00:15", method: "Card", notes: "" },
  { id: "log-14", employee: "Maya Rizk", action: "Check Out", timestamp: "2026-02-21 16:00:30", method: "Biometric", notes: "" },
  { id: "log-15", employee: "Rima Haddad", action: "Check Out", timestamp: "2026-02-21 16:30:12", method: "Biometric", notes: "" },
];

const methodColors: Record<string, string> = {
  Manual: "bg-gray-100 text-gray-700",
  Biometric: "bg-blue-100 text-blue-700",
  Card: "bg-purple-100 text-purple-700",
};

export default function AttendanceLogsPage() {
  const [dateFrom, setDateFrom] = useState("2026-02-21");
  const [dateTo, setDateTo] = useState("2026-02-21");

  const columns: ColumnDef<AttendanceLog>[] = useMemo(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => <span className="font-medium">{row.original.employee}</span>,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.action === "Check In" ? (
              <LogIn className="size-4 text-emerald-500" />
            ) : (
              <LogOut className="size-4 text-orange-500" />
            )}
            <span>{row.original.action}</span>
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">{row.original.timestamp}</span>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
          <Badge className={methodColors[row.original.method]}>{row.original.method}</Badge>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.notes || "-"}</span>
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
        <DataTable
          columns={columns}
          data={demoLogs}
          searchKey="employee"
          searchPlaceholder="Search employees..."
        />
      </div>
    </>
  );
}
