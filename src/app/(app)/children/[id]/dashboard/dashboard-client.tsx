"use client";

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
import { ChildTimeline } from "@/components/children/child-timeline";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";
import type { TimelineEvent } from "@/lib/actions/timeline";

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
  timeline: TimelineEvent[];
}

export function DashboardClient({ child, stats, upcomingAlarms, upcomingVaccinations, timeline }: Props) {
  const id = child.id;
  const initials = getInitials(child.firstName, child.lastName);
  const avatarBg = getAvatarColor(`${child.firstName} ${child.lastName}`);

  const statCards = [
    {
      label: "Attendance Rate",
      value: stats.attendanceRate,
      icon: Calendar,
      bg: "bg-teal-50",
      iconColor: "text-teal-600",
      valueColor: "text-teal-700",
    },
    {
      label: "Daily Reports",
      value: String(stats.totalReports),
      icon: ClipboardList,
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
      valueColor: "text-sky-700",
    },
    {
      label: "Absences",
      value: String(stats.totalAbsences),
      icon: AlertTriangle,
      bg: "bg-rose-50",
      iconColor: "text-rose-500",
      valueColor: "text-rose-600",
    },
    {
      label: "Medical Records",
      value: String(stats.medicalRecords),
      icon: Stethoscope,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      valueColor: "text-violet-700",
    },
    {
      label: "Outstanding",
      value: stats.outstandingBalance,
      icon: DollarSign,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Child Info Card */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal-400 via-sky-400 to-violet-400" />
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-start">
          {/* Large avatar */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ring-4 ring-white ${avatarBg}`}
            >
              {child.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <Badge className={child.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
              {child.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">{child.firstName} {child.lastName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {child.className && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                  {child.className}
                </Badge>
              )}
              {child.branchName && (
                <span>{child.branchName}</span>
              )}
              {child.dateOfBirth && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span>DOB: {child.dateOfBirth}</span>
                </>
              )}
              {child.bloodType && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                    {child.bloodType}
                  </Badge>
                </>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {child.gender && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <span className={`inline-block size-2 rounded-full ${child.gender === "MALE" ? "bg-sky-400" : "bg-pink-400"}`} />
                  {child.gender === "MALE" ? "Boy" : "Girl"}
                </Badge>
              )}
              {child.nationality && <Badge variant="outline" className="text-xs">{child.nationality}</Badge>}
              {child.busAttendance && (
                <Badge variant="outline" className="gap-1 text-xs bg-orange-50 text-orange-600 border-orange-200">
                  <Bus className="h-3 w-3" /> Bus
                </Badge>
              )}
              {child.lunchIncluded && (
                <Badge variant="outline" className="gap-1 text-xs bg-lime-50 text-lime-600 border-lime-200">
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
                    {p.phone && <span className="text-primary">({p.phone})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={`/daily-reports/new?childId=${id}`}>
                <FileText className="mr-1 h-3.5 w-3.5" />
                + Report
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/absent-reports/new?childId=${id}`}>
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                + Absence
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/children/${id}/edit`}>Edit Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-bold leading-none ${stat.valueColor}`}>{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Child Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildTimeline events={timeline} />
          </CardContent>
        </Card>

        {/* Quick Links & Vaccinations */}
        <div className="space-y-6">
          {/* Quick Actions & Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "+ Daily Report", href: `/daily-reports/new?childId=${id}`, icon: FileText },
                  { label: "+ Absence", href: `/absent-reports/new?childId=${id}`, icon: AlertTriangle },
                  { label: "+ Medical Record", href: `/medical/general`, icon: Stethoscope },
                  { label: "+ Payment", href: `/children/${id}/accounting`, icon: DollarSign },
                  { label: "Attendance", href: `/children/${id}/attendance`, icon: Calendar },
                  { label: "Accidents", href: `/children/${id}/accidents`, icon: Heart },
                  { label: "Call Log", href: `/children/${id}/calls`, icon: Phone },
                  { label: "Reports", href: `/children/${id}/report`, icon: ClipboardList },
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
  );
}
