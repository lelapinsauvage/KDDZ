"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

// Design-system palette for chart segments
const CLASS_COLORS = [
  "#C35A2C",
  "#6B8F71",
  "#B08968",
  "#8B7355",
  "#B07070",
  "#5B7B5E",
  "#B87333",
  "#9B7653",
];

const GENDER_COLORS = ["#6B8F71", "#B07070"];

interface DemographicsSectionProps {
  childrenPerClass: Array<{ name: string; value: number }>;
  genderStats: Array<{ name: string; value: number }>;
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E7E5E4",
  borderRadius: 12,
  fontSize: 13,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
};

export function DemographicsSection({
  childrenPerClass,
  genderStats,
}: DemographicsSectionProps) {
  const hasClassData = childrenPerClass.length > 0;
  const hasGenderData = genderStats.length > 0;

  if (!hasClassData && !hasGenderData) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Children Per Class donut */}
      <Card className="rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Children Per Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasClassData ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={childrenPerClass}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {childrenPerClass.map((_, i) => (
                      <Cell
                        key={`class-${i}`}
                        fill={CLASS_COLORS[i % CLASS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="size-8 opacity-40" />
              <p className="text-sm">No class data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gender Stats donut */}
      <Card className="rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Gender Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasGenderData ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderStats.map((_, i) => (
                      <Cell
                        key={`gender-${i}`}
                        fill={GENDER_COLORS[i % GENDER_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="size-8 opacity-40" />
              <p className="text-sm">No gender data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
