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
  Syringe,
  Bus,
  Utensils,
  User,
} from "lucide-react";

interface ParentInfo {
  type: string;
  name: string | null;
  phone: string | null;
}

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  className: string | null;
  branchName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  isActive: boolean;
  gender: string | null;
  nationality: string | null;
  allergies: string | null;
  busAttendance: boolean;
  lunchIncluded: boolean;
  parents: ParentInfo[];
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

interface UpcomingVaccination {
  name: string;
  dueDate: string;
}

interface Stats {
  attendanceRate: string;
  totalReports: number;
  totalAbsences: number;
  medicalRecords: number;
  outstandingBalance: string;
}

interface Props {
  child: ChildData;
  stats: Stats;
  recentReports: RecentReport[];
  upcomingAlarms: UpcomingAlarm[];
  upcomingVaccinations: UpcomingVaccination[];
}

const moodColors: Record<string, string> = {
  HAPPY: "bg-green-100 text-green-700",
  CALM: "bg-blue-100 text-blue-700",
  FUSSY: "bg-orange-100 text-orange-700",
  CRYING: "bg-red-100 text-red-700",
  SLEEPY: "bg-purple-100 text-purple-700",
};

export function DashboardClient({ child, stats, recentReports, upcomingAlarms, upcomingVaccinations }: Props) {
  const id = child.id;

  const statCards = [
    { label: "Attendance Rate", value: stats.attendanceRate, icon: Calendar, color: "text-[#1caf9a]" },
    { label: "Daily Reports", value: String(stats.totalReports), icon: ClipboardList, color: "text-blue-500" },
    { label: "Absences", value: String(stats.totalAbsences), icon: AlertTriangle, color: "text-red-500" },
    { label: "Medical Records", value: String(stats.medicalRecords), icon: Stethoscope, color: "text-purple-500" },
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
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1caf9a]/10">
              {child.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <Baby className="h-10 w-10 text-[#1caf9a]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{child.firstName} {child.lastName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{child.className ?? "No class"}</span>
                <span>·</span>
                <span>{child.branchName ?? "No branch"}</span>
                <span>·</span>
                <span>DOB: {child.dateOfBirth ?? "N/A"}</span>
                {child.bloodType && (
                  <>
                    <span>·</span>
                    <span>Blood: {child.bloodType}</span>
                  </>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={child.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {child.isActive ? "Active" : "Inactive"}
                </Badge>
                {child.gender && <Badge variant="outline">{child.gender}</Badge>}
                {child.nationality && <Badge variant="outline">{child.nationality}</Badge>}
                {child.busAttendance && (
                  <Badge variant="outline" className="gap-1">
                    <Bus className="h-3 w-3" /> Bus
                  </Badge>
                )}
                {child.lunchIncluded && (
                  <Badge variant="outline" className="gap-1">
                    <Utensils className="h-3 w-3" /> Lunch
                  </Badge>
                )}
              </div>
              {child.allergies && (
                <div className="mt-2">
                  <Badge variant="destructive" className="gap-1">
                    <Heart className="h-3 w-3" /> Allergies: {child.allergies}
                  </Badge>
                </div>
              )}
              {/* Parent contacts */}
              {child.parents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {child.parents.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-medium">{p.type}:</span>
                      <span>{p.name ?? "N/A"}</span>
                      {p.phone && <span className="text-[#337ab7]">({p.phone})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/children/${id}`}>Edit Profile</Link>
              </Button>
              <Button size="sm" style={{ background: "#1caf9a" }} asChild>
                <Link href={`/children/${id}/report`}>View Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <Link href={`/children/${id}/report`}>View All</Link>
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

          {/* Quick Links & Vaccinations */}
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

            {/* Upcoming Vaccinations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Syringe className="h-4 w-4" />
                  Upcoming Vaccinations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingVaccinations.length === 0 && (
                    <p className="text-sm text-muted-foreground">No upcoming vaccinations.</p>
                  )}
                  {upcomingVaccinations.map((v, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2">
                        <Syringe className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{v.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{v.dueDate}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Alarms */}
        {upcomingAlarms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingAlarms.map((alarm, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className={`text-sm font-medium ${alarm.color}`}>{alarm.type}</p>
                      <p className="text-xs text-muted-foreground">{alarm.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{alarm.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
