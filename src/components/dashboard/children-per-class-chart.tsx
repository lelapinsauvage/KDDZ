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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Children Per Class
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e5ec" />
              <XAxis
                dataKey="name"
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
              <Bar dataKey="children" fill="#4b77be" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
