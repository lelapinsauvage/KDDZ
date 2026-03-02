"use client";

import Link from "next/link";
import {
  Users,
  GraduationCap,
  Stethoscope,
  UserCog,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BranchStats {
  childrenCount: number;
  classCount: number;
  teacherCount: number;
  nurseCount: number;
  doctorCount: number;
  managerCount: number;
  documentCount: number;
  compliancePercentage: number;
  themeColor: string;
}

export function BranchDashboardClient({
  branchId,
  stats,
}: {
  branchId: string;
  stats: BranchStats;
}) {
  const color = stats.themeColor || "#1caf9a";

  const cards = [
    {
      label: "Children",
      value: stats.childrenCount,
      icon: Users,
      bg: "bg-sky-100",
      fg: "text-sky-600",
      href: `/children?branch=${branchId}`,
    },
    {
      label: "Classes",
      value: stats.classCount,
      icon: GraduationCap,
      bg: "bg-amber-100",
      fg: "text-amber-600",
      href: `/branches/${branchId}/classes`,
    },
    {
      label: "Teachers",
      value: stats.teacherCount,
      icon: Users,
      bg: "bg-[#4F46E5]/15",
      fg: "text-[#4F46E5]",
      href: `/employees/teachers?branch=${branchId}`,
    },
    {
      label: "Nurses",
      value: stats.nurseCount,
      icon: Stethoscope,
      bg: "bg-rose-100",
      fg: "text-rose-600",
    },
    {
      label: "Doctors",
      value: stats.doctorCount,
      icon: Stethoscope,
      bg: "bg-red-100",
      fg: "text-red-600",
    },
    {
      label: "Managers",
      value: stats.managerCount,
      icon: UserCog,
      bg: "bg-indigo-100",
      fg: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const card = (
            <Card key={c.label} className="rounded-2xl py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${c.bg}`}
                >
                  <c.icon className={`size-5 ${c.fg}`} />
                </div>
                <p className="text-2xl font-semibold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="no-underline">
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>

      {/* Compliance + Documents summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="relative flex size-20 items-center justify-center">
              <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/50"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={`${stats.compliancePercentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-bold text-foreground">
                {stats.compliancePercentage}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5" style={{ color }} />
                <h3 className="text-base font-semibold text-foreground">
                  Compliance
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.compliancePercentage === 100
                  ? "All compliance fields are filled."
                  : `${100 - stats.compliancePercentage}% remaining to complete government registration.`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex size-20 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <FileText className="size-10" style={{ color }} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Documents</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {stats.documentCount}
              </p>
              <p className="text-sm text-muted-foreground">
                uploaded out of 12 required
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
