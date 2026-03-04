"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

interface WeeklyAttendanceChartProps {
  data: Array<{ day: string; present: number; total: number }>;
}

export function WeeklyAttendanceChart({ data }: WeeklyAttendanceChartProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.present > 0);

  return (
    <Card className="rounded-sm border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <TrendingUp className="size-4 text-[#0B9178]" />
          Weekly Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data} barCategoryGap="20%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
              />
              <YAxis hide domain={[0, maxTotal]} />
              <Tooltip
                cursor={{ fill: "rgba(11, 145, 120, 0.06)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as {
                    day: string;
                    present: number;
                    total: number;
                  };
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-1.5 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
                      <p className="text-xs font-medium text-foreground">
                        {d.present}/{d.total} present
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="present"
                radius={[4, 4, 0, 0]}
                fill="#0B9178"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <div className="flex size-10 items-center justify-center rounded-sm bg-muted">
              <BarChart3 className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No attendance data this week yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
