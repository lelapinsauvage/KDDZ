"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface Props {
  child: ChildData;
  attendance: AttendanceRecord[];
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  PRESENT: { label: "Present", className: "bg-green-100 text-green-700", icon: CheckCircle },
  ABSENT: { label: "Absent", className: "bg-red-100 text-red-700", icon: XCircle },
  LATE: { label: "Late", className: "bg-amber-100 text-amber-700", icon: Clock },
  HALF_DAY: { label: "Half Day", className: "bg-blue-100 text-blue-700", icon: Clock },
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700", icon: Clock },
};

function getHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut || checkIn === "\u2014" || checkOut === "\u2014") return "\u2014";
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  const diff = (outH * 60 + outM - inH * 60 - inM) / 60;
  return `${diff.toFixed(1)} hrs`;
}

const columns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
  },
  {
    accessorKey: "checkIn",
    header: "Check In",
    cell: ({ row }) => row.original.checkIn ?? "\u2014",
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
    cell: ({ row }) => row.original.checkOut ?? "\u2014",
  },
  {
    id: "hours",
    header: "Hours",
    cell: ({ row }) => getHours(row.original.checkIn, row.original.checkOut),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = statusConfig[row.original.status] ?? statusConfig.DRAFT;
      const Icon = cfg.icon;
      return (
        <Badge className={cfg.className}>
          <Icon className="mr-1 h-3 w-3" />
          {cfg.label}
        </Badge>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.status === filterValue;
    },
  },
];

export function AttendanceClient({ child, attendance }: Props) {
  const id = child.id;

  const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
  const totalDays = attendance.length;
  const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Attendance`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Attendance" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-[#1caf9a]">{rate}%</p>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{presentDays}</p>
              <p className="text-xs text-muted-foreground">Days Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-500">
                {attendance.filter((a) => a.status === "ABSENT").length}
              </p>
              <p className="text-xs text-muted-foreground">Days Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-amber-500">
                {attendance.filter((a) => a.status === "LATE").length}
              </p>
              <p className="text-xs text-muted-foreground">Days Late</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <DataTable
          columns={columns}
          data={attendance}
          searchKey="date"
          searchPlaceholder="Search by date..."
        />
      </div>
    </>
  );
}
