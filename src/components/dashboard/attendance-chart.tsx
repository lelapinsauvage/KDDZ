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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Attendance &amp; Absence Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e5ec" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6f7b8a" }}
                axisLine={{ stroke: "#e1e5ec" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6f7b8a" }}
                axisLine={{ stroke: "#e1e5ec" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e1e5ec",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#1caf9a"
                fill="#1caf9a"
                fillOpacity={0.15}
                strokeWidth={2}
                name="Attendance"
              />
              <Area
                type="monotone"
                dataKey="absence"
                stroke="#e7505a"
                fill="#e7505a"
                fillOpacity={0.15}
                strokeWidth={2}
                name="Absence"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
