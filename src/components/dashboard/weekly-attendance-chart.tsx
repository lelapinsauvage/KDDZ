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
    <Card className="rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" />
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
                tick={{ fontSize: 11, fill: "#78716c" }}
              />
              <YAxis hide domain={[0, maxTotal]} />
              <Tooltip
                cursor={{ fill: "rgba(107, 143, 113, 0.08)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as { day: string; present: number; total: number };
                  return (
                    <div className="rounded-lg border bg-card px-3 py-1.5 shadow-sm">
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
                fill="#6B8F71"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
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
