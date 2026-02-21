"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

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

      <div className="space-y-6 p-6">
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

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Calendar className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Check In</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Check Out</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Hours</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                )}
                {attendance.map((row) => {
                  const cfg = statusConfig[row.status] ?? statusConfig.DRAFT;
                  let hours = "\u2014";
                  if (row.checkIn && row.checkOut && row.checkIn !== "\u2014" && row.checkOut !== "\u2014") {
                    const [inH, inM] = row.checkIn.split(":").map(Number);
                    const [outH, outM] = row.checkOut.split(":").map(Number);
                    const diff = (outH * 60 + outM - inH * 60 - inM) / 60;
                    hours = `${diff.toFixed(1)} hrs`;
                  }
                  return (
                    <TableRow key={row.date}>
                      <TableCell className="text-sm font-medium">{row.date}</TableCell>
                      <TableCell className="text-sm">{row.checkIn ?? "\u2014"}</TableCell>
                      <TableCell className="text-sm">{row.checkOut ?? "\u2014"}</TableCell>
                      <TableCell className="text-sm">{hours}</TableCell>
                      <TableCell>
                        <Badge className={cfg.className}>
                          <cfg.icon className="mr-1 h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
