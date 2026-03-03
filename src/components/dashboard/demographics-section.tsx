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

/* Design-system chart + module accent palette */
const CLASS_COLORS = [
  "#0B9178", // Meadow (chart-1)
  "#2563EB", // Blue (chart-2)
  "#7C3AED", // Violet (chart-3)
  "#EA580C", // Orange (chart-4)
  "#4F46E5", // Indigo (chart-5)
  "#D97706", // Alerts amber
  "#E11D48", // Comms rose
  "#0284C7", // Sleep sky
];

const GENDER_COLORS = ["#2563EB", "#E11D48"];
export const ATTENDANCE_COLORS = ["#16A34A", "#DC2626", "#D97706"];

interface DemographicsSectionProps {
  childrenPerClass: Array<{ name: string; value: number }>;
  genderStats: Array<{ name: string; value: number }>;
  attendanceBreakdown?: Array<{ name: string; value: number }>;
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E2E5E9",
  borderRadius: 10,
  fontSize: 13,
  boxShadow: "0 4px 6px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)",
};

export function DemographicsSection({
  childrenPerClass,
  genderStats,
  attendanceBreakdown,
}: DemographicsSectionProps) {
  const hasClassData = childrenPerClass.length > 0;
  const hasGenderData = genderStats.length > 0;
  const hasAttendance = attendanceBreakdown && attendanceBreakdown.some((d) => d.value > 0);

  if (!hasClassData && !hasGenderData && !hasAttendance) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Attendance Breakdown donut */}
      <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading">
            Attendance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAttendance ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {attendanceBreakdown!.map((_, i) => (
                      <Cell
                        key={`att-${i}`}
                        fill={ATTENDANCE_COLORS[i % ATTENDANCE_COLORS.length]}
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
              <p className="text-sm">No attendance data yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children Per Class donut */}
      <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading">
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
      <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading">
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
