"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Baby,
  Heart,
  Calendar,
  ClipboardList,
  Stethoscope,
  DollarSign,
  FileText,
  Phone,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
  branchName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  isActive: boolean;
  gender: string | null;
  nationality: string | null;
}

interface RecentReport {
  date: string;
  mood: string | null;
  meals: string;
  sleep: string;
}

interface UpcomingAlarm {
  type: string;
  message: string | null;
  date: string | null;
  color: string;
}

interface Stats {
  attendanceRate: string;
  totalReports: number;
  medicalRecords: number;
  outstandingBalance: string;
}

interface Props {
  child: ChildData;
  stats: Stats;
  recentReports: RecentReport[];
  upcomingAlarms: UpcomingAlarm[];
}

const moodColors: Record<string, string> = {
  HAPPY: "bg-green-100 text-green-700",
  CALM: "bg-blue-100 text-blue-700",
  FUSSY: "bg-orange-100 text-orange-700",
  CRYING: "bg-red-100 text-red-700",
  SLEEPY: "bg-purple-100 text-purple-700",
};

export function DashboardClient({ child, stats, recentReports, upcomingAlarms }: Props) {
  const id = child.id;

  const statCards = [
    { label: "Attendance Rate", value: stats.attendanceRate, icon: Calendar, color: "text-[#1caf9a]" },
    { label: "Daily Reports", value: String(stats.totalReports), icon: ClipboardList, color: "text-blue-500" },
    { label: "Medical Records", value: String(stats.medicalRecords), icon: Stethoscope, color: "text-red-500" },
    { label: "Outstanding Balance", value: stats.outstandingBalance, icon: DollarSign, color: "text-amber-500" },
  ];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Dashboard`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}` },
          { label: "Dashboard" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Child Info Card */}
        <Card>
          <CardContent className="flex items-center gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1caf9a]/10">
              <Baby className="h-10 w-10 text-[#1caf9a]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{child.firstName} {child.lastName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{child.className ?? "No class"}</span>
                <span>•</span>
                <span>{child.branchName ?? "No branch"}</span>
                <span>•</span>
                <span>DOB: {child.dateOfBirth ?? "N/A"}</span>
                <span>•</span>
                <span>Blood: {child.bloodType ?? "N/A"}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge className={child.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {child.isActive ? "Active" : "Inactive"}
                </Badge>
                {child.gender && <Badge variant="outline">{child.gender}</Badge>}
                {child.nationality && <Badge variant="outline">{child.nationality}</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/children/${id}`}>Edit Profile</Link>
              </Button>
              <Button size="sm" style={{ background: "#1caf9a" }} asChild>
                <Link href={`/children/${id}/report`}>View Report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Daily Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Daily Reports</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/daily-reports?child=${id}`}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent reports found.</p>
                )}
                {recentReports.map((r) => (
                  <div key={r.date} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{r.date}</p>
                        <p className="text-xs text-muted-foreground">{r.meals} · Sleep: {r.sleep}</p>
                      </div>
                    </div>
                    {r.mood && <Badge className={moodColors[r.mood] ?? "bg-gray-100 text-gray-700"}>{r.mood}</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links & Alarms */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Attendance", href: `/children/${id}/attendance`, icon: Calendar },
                    { label: "Absence", href: `/children/${id}/absence`, icon: AlertTriangle },
                    { label: "Accidents", href: `/children/${id}/accidents`, icon: Heart },
                    { label: "Accounting", href: `/children/${id}/accounting`, icon: DollarSign },
                    { label: "Call Log", href: `/children/${id}/calls`, icon: Phone },
                    { label: "Health", href: `/medical/general`, icon: Stethoscope },
                  ].map((link) => (
                    <Button key={link.label} variant="outline" className="justify-start" asChild>
                      <Link href={link.href}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Alarms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAlarms.length === 0 && (
                    <p className="text-sm text-muted-foreground">No upcoming alarms.</p>
                  )}
                  {upcomingAlarms.map((alarm, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{alarm.type}</p>
                        <p className="text-xs text-muted-foreground">{alarm.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{alarm.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
