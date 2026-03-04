"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChildrenPerClassChartProps {
  data: { name: string; children: number }[];
}

export function ChildrenPerClassChart({ data }: ChildrenPerClassChartProps) {
  return (
    <Card className="rounded-sm border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Children Per Class
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis
                dataKey="name"
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
              <Bar dataKey="children" fill="#D97706" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
