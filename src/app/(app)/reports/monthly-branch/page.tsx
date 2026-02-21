"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Users, BookOpen, GraduationCap, CalendarCheck } from "lucide-react";

interface BranchStats {
  branch: string;
  children: number;
  classes: number;
  teachers: number;
  attendanceRate: string;
}

interface ClassBreakdown {
  id: string;
  className: string;
  ageGroup: string;
  children: number;
  avgAttendance: string;
  reportsSubmitted: number;
  reportsPending: number;
}

const branchStatsMap: Record<string, BranchStats> = {
  "Main Branch": { branch: "Main Branch", children: 5, classes: 2, teachers: 3, attendanceRate: "94%" },
  "Downtown Branch": { branch: "Downtown Branch", children: 4, classes: 2, teachers: 2, attendanceRate: "91%" },
  "Suburb Branch": { branch: "Suburb Branch", children: 3, classes: 2, teachers: 2, attendanceRate: "89%" },
};

const classBreakdownMap: Record<string, ClassBreakdown[]> = {
  "Main Branch": [
    { id: "cb-1", className: "Nursery A", ageGroup: "0-1", children: 3, avgAttendance: "95%", reportsSubmitted: 62, reportsPending: 2 },
    { id: "cb-2", className: "Toddler A", ageGroup: "1-2", children: 2, avgAttendance: "93%", reportsSubmitted: 41, reportsPending: 1 },
  ],
  "Downtown Branch": [
    { id: "cb-3", className: "Nursery B", ageGroup: "0-1", children: 2, avgAttendance: "90%", reportsSubmitted: 40, reportsPending: 3 },
    { id: "cb-4", className: "Pre-K A", ageGroup: "3-4", children: 2, avgAttendance: "92%", reportsSubmitted: 42, reportsPending: 0 },
  ],
  "Suburb Branch": [
    { id: "cb-5", className: "Toddler B", ageGroup: "1-2", children: 2, avgAttendance: "88%", reportsSubmitted: 38, reportsPending: 2 },
    { id: "cb-6", className: "Pre-K B", ageGroup: "3-4", children: 1, avgAttendance: "91%", reportsSubmitted: 20, reportsPending: 0 },
  ],
};

const statIcons = [
  { key: "children", label: "Children", icon: Users, color: "#1caf9a" },
  { key: "classes", label: "Classes", icon: BookOpen, color: "#3b82f6" },
  { key: "teachers", label: "Teachers", icon: GraduationCap, color: "#a855f7" },
  { key: "attendanceRate", label: "Attendance Rate", icon: CalendarCheck, color: "#22c55e" },
];

export default function MonthlyBranchReportPage() {
  const [selectedBranch, setSelectedBranch] = useState("Main Branch");

  const stats = branchStatsMap[selectedBranch] ?? branchStatsMap["Main Branch"];
  const classes = classBreakdownMap[selectedBranch] ?? [];

  const columns: ColumnDef<ClassBreakdown>[] = useMemo(
    () => [
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => <span className="font-medium">{row.original.className}</span>,
      },
      { accessorKey: "ageGroup", header: "Age Group" },
      { accessorKey: "children", header: "Children" },
      { accessorKey: "avgAttendance", header: "Avg Attendance" },
      { accessorKey: "reportsSubmitted", header: "Reports Submitted" },
      { accessorKey: "reportsPending", header: "Reports Pending" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Monthly Report by Branch"
        breadcrumbs={[
          { label: "Reports", href: "/reports/monthly-branch" },
          { label: "Monthly Branch Report" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Main Branch">Main Branch</SelectItem>
              <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
              <SelectItem value="Suburb Branch">Suburb Branch</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-1 size-4" />
            Export
          </Button>
        </div>

        {/* Per-branch stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statIcons.map((s) => {
            const value = stats[s.key as keyof BranchStats];
            return (
              <Card key={s.key}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div
                    className="flex size-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: s.color + "15" }}
                  >
                    <s.icon className="size-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Class breakdown table */}
        <div>
          <h3 className="mb-3 text-base font-semibold">Class Breakdown</h3>
          <DataTable columns={columns} data={classes} />
        </div>
      </div>
    </>
  );
}
