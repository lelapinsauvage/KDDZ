"use client";

import { use } from "react";
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
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoAttendance = [
  { date: "2025-02-21", checkIn: "07:45", checkOut: "16:30", status: "PRESENT" },
  { date: "2025-02-20", checkIn: "08:00", checkOut: "16:15", status: "PRESENT" },
  { date: "2025-02-19", checkIn: "—", checkOut: "—", status: "ABSENT" },
  { date: "2025-02-18", checkIn: "08:30", checkOut: "16:00", status: "LATE" },
  { date: "2025-02-17", checkIn: "07:50", checkOut: "16:45", status: "PRESENT" },
  { date: "2025-02-14", checkIn: "07:40", checkOut: "16:30", status: "PRESENT" },
  { date: "2025-02-13", checkIn: "08:15", checkOut: "12:00", status: "HALF_DAY" },
  { date: "2025-02-12", checkIn: "07:55", checkOut: "16:20", status: "PRESENT" },
  { date: "2025-02-11", checkIn: "—", checkOut: "—", status: "ABSENT" },
  { date: "2025-02-10", checkIn: "07:45", checkOut: "16:30", status: "PRESENT" },
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  PRESENT: { label: "Present", className: "bg-green-100 text-green-700", icon: CheckCircle },
  ABSENT: { label: "Absent", className: "bg-red-100 text-red-700", icon: XCircle },
  LATE: { label: "Late", className: "bg-amber-100 text-amber-700", icon: Clock },
  HALF_DAY: { label: "Half Day", className: "bg-blue-100 text-blue-700", icon: Clock },
};

export default function ChildAttendancePage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

  const presentDays = demoAttendance.filter((a) => a.status === "PRESENT").length;
  const totalDays = demoAttendance.length;
  const rate = Math.round((presentDays / totalDays) * 100);

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
                {demoAttendance.filter((a) => a.status === "ABSENT").length}
              </p>
              <p className="text-xs text-muted-foreground">Days Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-amber-500">
                {demoAttendance.filter((a) => a.status === "LATE").length}
              </p>
              <p className="text-xs text-muted-foreground">Days Late</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select defaultValue="february">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="january">January 2025</SelectItem>
              <SelectItem value="february">February 2025</SelectItem>
              <SelectItem value="march">March 2025</SelectItem>
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
                {demoAttendance.map((row) => {
                  const cfg = statusConfig[row.status];
                  let hours = "—";
                  if (row.checkIn !== "—" && row.checkOut !== "—") {
                    const [inH, inM] = row.checkIn.split(":").map(Number);
                    const [outH, outM] = row.checkOut.split(":").map(Number);
                    const diff = (outH * 60 + outM - inH * 60 - inM) / 60;
                    hours = `${diff.toFixed(1)} hrs`;
                  }
                  return (
                    <TableRow key={row.date}>
                      <TableCell className="text-sm font-medium">{row.date}</TableCell>
                      <TableCell className="text-sm">{row.checkIn}</TableCell>
                      <TableCell className="text-sm">{row.checkOut}</TableCell>
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
