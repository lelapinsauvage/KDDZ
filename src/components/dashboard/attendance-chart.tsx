"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceChartProps {
  data: { month: string; attendance: number; absence: number }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <Card className="rounded-sm border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Attendance & Absence Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAbsence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#78716C" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#78716C" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E7E5E4",
                  borderRadius: 12,
                  fontSize: 13,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#059669"
                fill="url(#gradAttendance)"
                strokeWidth={2.5}
                name="Attendance"
              />
              <Area
                type="monotone"
                dataKey="absence"
                stroke="#EC4899"
                fill="url(#gradAbsence)"
                strokeWidth={2.5}
                name="Absence"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
