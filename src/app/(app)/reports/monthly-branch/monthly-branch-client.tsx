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

interface BranchStat {
  id: string;
  name: string;
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

interface BranchData {
  stats: BranchStat;
  classes: ClassBreakdown[];
}

interface MonthlyBranchClientProps {
  branchDataMap: Record<string, BranchData>;
  branchOptions: { id: string; name: string }[];
}

const statIcons = [
  { key: "children", label: "Children", icon: Users, color: "#1caf9a" },
  { key: "classes", label: "Classes", icon: BookOpen, color: "#3b82f6" },
  { key: "teachers", label: "Teachers", icon: GraduationCap, color: "#a855f7" },
  { key: "attendanceRate", label: "Attendance Rate", icon: CalendarCheck, color: "#22c55e" },
];

export default function MonthlyBranchClient({
  branchDataMap,
  branchOptions,
}: MonthlyBranchClientProps) {
  const firstBranchId = branchOptions[0]?.id ?? "";
  const [selectedBranchId, setSelectedBranchId] = useState(firstBranchId);

  const branchData = branchDataMap[selectedBranchId];
  const stats = branchData?.stats;
  const classes = branchData?.classes ?? [];

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
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-1 size-4" />
            Export
          </Button>
        </div>

        {/* Per-branch stat cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statIcons.map((s) => {
              const value = stats[s.key as keyof BranchStat];
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
        )}

        {/* Class breakdown table */}
        <div>
          <h3 className="mb-3 text-base font-semibold">Class Breakdown</h3>
          <DataTable columns={columns} data={classes} />
        </div>
      </div>
    </>
  );
}
