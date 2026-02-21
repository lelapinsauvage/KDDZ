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

// Demo data — will be replaced with real data from API
const data = [
  { name: "Nursery A", children: 12 },
  { name: "Nursery B", children: 18 },
  { name: "Toddler A", children: 15 },
  { name: "Toddler B", children: 10 },
  { name: "Pre-K A", children: 20 },
  { name: "Pre-K B", children: 16 },
];

export function ChildrenPerClassChart() {
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
