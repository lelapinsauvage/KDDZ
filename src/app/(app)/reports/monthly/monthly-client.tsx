"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Users, CalendarCheck, ClipboardList, TrendingUp } from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SummaryStat {
  label: string;
  value: string;
  icon: typeof Users;
  color: string;
}

interface MonthlyClientProps {
  totalChildren: number;
  totalReportsSubmitted: number;
  totalReportsDraft: number;
  totalPayments: number;
  totalMedicalForms: number;
  branches: BranchOption[];
  classes: ClassOption[];
}

export default function MonthlyClient({
  totalChildren,
  totalReportsSubmitted,
  totalReportsDraft,
  totalPayments,
  branches,
  classes,
}: MonthlyClientProps) {
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");

  // Build summary stats from real data
  const summaryStats: SummaryStat[] = [
    { label: "Total Children", value: String(totalChildren), icon: Users, color: "var(--primary)" },
    { label: "Total Payments", value: String(totalPayments), icon: CalendarCheck, color: "#3b82f6" },
    { label: "Reports Submitted", value: String(totalReportsSubmitted), icon: ClipboardList, color: "#22c55e" },
    { label: "Reports Pending", value: String(totalReportsDraft), icon: FileText, color: "#f97316" },
  ];

  // Placeholder chart data -- these could be wired later with date-range filtered queries
  const mealsData = [
    { label: "Breakfast", value: 95 },
    { label: "Snack AM", value: 88 },
    { label: "Lunch", value: 100 },
    { label: "Snack PM", value: 82 },
  ];

  const attendanceTrend = [
    { week: "Week 1", pct: 90 },
    { week: "Week 2", pct: 94 },
    { week: "Week 3", pct: 88 },
    { week: "Week 4", pct: 92 },
  ];

  const maxMeal = Math.max(...mealsData.map((m) => m.value));
  const maxAtt = Math.max(...attendanceTrend.map((a) => a.pct));

  return (
    <>
      <PageHeader
        title="Monthly Report"
        breadcrumbs={[
          { label: "Reports", href: "/reports/monthly" },
          { label: "Monthly Report" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Month</label>
            <input
              type="month"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Branch</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          <div className="flex items-end gap-2">
            <Button className="text-white">
              <TrendingUp className="mr-1 size-4" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Download className="mr-1 size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className="flex size-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <stat.icon className="size-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-[200px]">
                {attendanceTrend.map((w) => (
                  <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium">{w.pct}%</span>
                    <div className="w-full relative" style={{ height: "160px" }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-md"
                        style={{
                          height: `${(w.pct / maxAtt) * 100}%`,
                          background: "linear-gradient(to top, #0B9178, #0B917890)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{w.week}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meals Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meals Distribution (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mealsData.map((meal) => (
                  <div key={meal.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{meal.label}</span>
                      <span className="font-medium">{meal.value}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${(meal.value / maxMeal) * 100}%`,
                          background: "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
