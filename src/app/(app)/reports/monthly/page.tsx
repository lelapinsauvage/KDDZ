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

// Summary stats
const summaryStats = [
  { label: "Total Children", value: "12", icon: Users, color: "#1caf9a" },
  { label: "Avg Attendance", value: "92%", icon: CalendarCheck, color: "#3b82f6" },
  { label: "Reports Submitted", value: "248", icon: ClipboardList, color: "#22c55e" },
  { label: "Reports Pending", value: "8", icon: FileText, color: "#f97316" },
];

// Simple bar chart data for meals
const mealsData = [
  { label: "Breakfast", value: 95 },
  { label: "Snack AM", value: 88 },
  { label: "Lunch", value: 100 },
  { label: "Snack PM", value: 82 },
];

// Simple line chart data for attendance trend
const attendanceTrend = [
  { week: "Week 1", pct: 90 },
  { week: "Week 2", pct: 94 },
  { week: "Week 3", pct: 88 },
  { week: "Week 4", pct: 92 },
];

export default function MonthlyReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");

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

      <div className="space-y-6 p-6">
        {/* ── Filters ────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
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
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                <SelectItem value="Main Branch">Main Branch</SelectItem>
                <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
                <SelectItem value="Suburb Branch">Suburb Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                <SelectItem value="Nursery A">Nursery A</SelectItem>
                <SelectItem value="Toddler A">Toddler A</SelectItem>
                <SelectItem value="Pre-K A">Pre-K A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          <div className="flex items-end gap-2">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <TrendingUp className="mr-1 size-4" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Download className="mr-1 size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* ── Summary Cards ──────────────────── */}
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

        {/* ── Charts ─────────────────────────── */}
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
                          background: "linear-gradient(to top, #1caf9a, #1caf9a90)",
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
