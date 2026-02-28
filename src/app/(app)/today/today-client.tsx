"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  UtensilsCrossed,
  Plus,
  Cake,
  Inbox,
  Users,
  UserX,
  CircleDot,
  Coffee,
  Salad,
  IceCreamCone,
  Cookie,
  Sparkles,
  ClipboardList,
  Heart,
  Send,
} from "lucide-react";
import { AttendanceMarker } from "@/components/today/attendance-marker";
import type { TodayData, TodayChild } from "@/lib/actions/today";

interface TodayClientProps {
  data: TodayData;
}

// Deterministic avatar color based on child name
const avatarColors = [
  { bg: "bg-[#0B9178]/10", text: "text-[#0B9178]" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-[#059669]/15", text: "text-[#059669]" },
  { bg: "bg-pink-100", text: "text-pink-700" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function TodayClient({ data }: TodayClientProps) {
  const [classFilter, setClassFilter] = useState("all");
  const todayISO = new Date().toISOString().split("T")[0];

  // Attendance step: show by default, hidden once marked (localStorage)
  const [showAttendance, setShowAttendance] = useState(false);
  useEffect(() => {
    const marked = localStorage.getItem(`attendance-marked-${todayISO}`);
    if (!marked) {
      setShowAttendance(true);
    }
  }, [todayISO]);

  const filteredChildren = useMemo(() => {
    if (classFilter === "all") return data.children;
    return data.children.filter((c) => c.classId === classFilter);
  }, [data.children, classFilter]);

  const filteredStats = useMemo(() => {
    const total = filteredChildren.length;
    const absences = filteredChildren.filter((c) => c.isAbsent).length;
    const completed = filteredChildren.filter((c) => c.reportStatus === "SUBMITTED").length;
    const drafts = filteredChildren.filter((c) => c.reportStatus === "DRAFT").length;
    const missing = Math.max(0, total - completed - drafts - absences);
    return { totalChildren: total, reportsCompleted: completed, reportsDraft: drafts, reportsMissing: missing, absences };
  }, [filteredChildren]);

  const progressDenom = filteredStats.totalChildren - filteredStats.absences;
  const progressPct = progressDenom > 0
    ? Math.round((filteredStats.reportsCompleted / progressDenom) * 100)
    : 0;

  // Count alerts by type for badges
  const alertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const alert of data.alerts) {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
    }
    return counts;
  }, [data.alerts]);

  return (
    <>
      <PageHeader
        title="Today"
        breadcrumbs={[{ label: "Today" }]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-[#0B9178] hover:bg-[#0B7464] text-white shadow-sm">
            <Link href="/daily-reports/batch">
              <ClipboardList className="mr-1.5 size-3.5" />
              Start Daily Reports
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
            <Link href="/daily-reports/new">
              <Plus className="mr-1.5 size-3.5" />
              Single Report
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
            <Link href="/absent-reports/new">
              <UserX className="mr-1.5 size-3.5" />
              Report Absence
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm">
            <Link href="/messages/compose">
              <Send className="mr-1.5 size-3.5" />
              Send Message
            </Link>
          </Button>
        </div>

        {/* Attendance Marker */}
        {showAttendance && (
          <AttendanceMarker
            children={data.children.map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              classId: c.classId,
              className: c.className,
            }))}
            classes={data.classes}
            date={todayISO}
            onComplete={() => setShowAttendance(false)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="py-3 border-l-4 border-l-[#0B9178]">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#0B9178]/5">
                <Users className="size-5 text-[#0B9178]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#0B9178]">{filteredStats.totalChildren}</p>
                <p className="text-xs font-medium text-muted-foreground">Children</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 border-l-4 border-l-purple-500">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50">
                <CheckCircle2 className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-700">{filteredStats.reportsCompleted}</p>
                <p className="text-xs font-medium text-muted-foreground">Reports Done</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 border-l-4 border-l-amber-500">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700">{filteredStats.reportsMissing + filteredStats.reportsDraft}</p>
                <p className="text-xs font-medium text-muted-foreground">Remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 border-l-4 border-l-rose-500">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50">
                <UserX className="size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-rose-700">{filteredStats.absences}</p>
                <p className="text-xs font-medium text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: children roster + reports */}
          <div className="lg:col-span-2 space-y-4">
            {/* Report Progress */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Daily Report Progress</CardTitle>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {data.classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {filteredStats.reportsCompleted} of {progressDenom} reports completed
                    </span>
                    <span className="text-lg font-bold" style={{
                      color: progressPct === 100 ? '#059669' : progressPct >= 50 ? '#d97706' : '#78716C'
                    }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        background: progressPct === 100
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, #f59e0b, #10b981)',
                      }}
                    />
                  </div>
                  {progressPct === 100 && (
                    <p className="mt-1.5 text-xs font-medium text-[#059669] flex items-center gap-1">
                      <Sparkles className="size-3" />
                      All reports done — great work!
                    </p>
                  )}
                  {progressPct > 0 && progressPct < 100 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {progressDenom - filteredStats.reportsCompleted} more to go — you&apos;re making progress!
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {filteredChildren.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                        <Users className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No children in this class
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Try selecting a different class or check enrollment.
                      </p>
                    </div>
                  ) : (
                    filteredChildren.map((child) => (
                      <ChildRow key={child.id} child={child} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: menu + alerts */}
          <div className="space-y-4">
            {/* Today's Menu */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="size-4 text-primary" />
                  Today&apos;s Menu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {!data.menu.breakfast && !data.menu.lunch && !data.menu.dessert && !data.menu.snack ? (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-50">
                      <UtensilsCrossed className="size-4 text-amber-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No menu set for today.
                    </p>
                    <Link href="/food/calendar" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                      Set today&apos;s menu
                    </Link>
                  </div>
                ) : (
                  <>
                    <MenuRow icon={<Coffee className="size-3.5 text-amber-500" />} label="Breakfast" value={data.menu.breakfast} />
                    <MenuRow icon={<Salad className="size-3.5 text-[#059669]" />} label="Lunch" value={data.menu.lunch} />
                    <MenuRow icon={<IceCreamCone className="size-3.5 text-pink-500" />} label="Dessert" value={data.menu.dessert} />
                    {data.menu.snack && (
                      <MenuRow icon={<Cookie className="size-3.5 text-orange-500" />} label="Snack" value={data.menu.snack} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="size-4 text-amber-500" />
                  Alerts
                  {data.alerts.length > 0 && (
                    <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
                      {data.alerts.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-[#059669]/10">
                      <Heart className="size-4 text-[#059669]" />
                    </div>
                    <p className="text-sm text-muted-foreground">All clear today!</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">No alerts to worry about.</p>
                  </div>
                ) : (
                  data.alerts.map((alert) => {
                    const alertConfig = {
                      message: { icon: <Inbox className="size-4" />, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100" },
                      birthday: { icon: <Cake className="size-4" />, bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100" },
                      medical: { icon: <AlertCircle className="size-4" />, bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
                      absence: { icon: <UserX className="size-4" />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
                    }[alert.type];

                    return (
                      <Link
                        key={alert.id}
                        href={alert.href}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm hover:-translate-y-0.5 ${alertConfig.border}`}
                      >
                        <div className={`mt-0.5 flex size-8 items-center justify-center rounded-lg ${alertConfig.bg} ${alertConfig.text}`}>
                          {alertConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                        {alertCounts[alert.type] && alertCounts[alert.type] > 1 && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${alertConfig.text} border-current`}>
                            {alertCounts[alert.type]}
                          </Badge>
                        )}
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function ChildRow({ child }: { child: TodayChild }) {
  const color = getAvatarColor(child.firstName + child.lastName);

  const statusBadge = child.isAbsent ? (
    <Badge className="bg-rose-100 text-rose-700 border-rose-200 font-medium">
      <UserX className="mr-1 size-3" />
      Absent
    </Badge>
  ) : child.reportStatus === "SUBMITTED" ? (
    <Badge className="bg-[#059669]/15 text-[#059669] border-[#059669]/20 font-medium">
      <CheckCircle2 className="mr-1 size-3" />
      Done
    </Badge>
  ) : child.reportStatus === "DRAFT" ? (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-medium">
      <Clock className="mr-1 size-3" />
      Draft
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground font-medium">
      <CircleDot className="mr-1 size-3" />
      No Report
    </Badge>
  );

  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${color.bg} ${color.text}`}>
        {child.firstName.charAt(0)}
        {child.lastName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/children/${child.id}/dashboard`}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {child.firstName} {child.lastName}
        </Link>
        {child.className && (
          <p className="text-xs text-muted-foreground">{child.className}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {statusBadge}
        {!child.isAbsent && !child.reportId && (
          <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity border-[#0B9178]/20 text-[#0B9178] hover:bg-[#0B9178]/5">
            <Link href={`/daily-reports/new?childId=${child.id}`}>
              <FileText className="mr-1 size-3" />
              Write
            </Link>
          </Button>
        )}
        {child.reportId && child.reportStatus === "DRAFT" && (
          <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity border-amber-200 text-amber-700 hover:bg-amber-50">
            <Link href={`/daily-reports/${child.reportId}/edit`}>
              <FileText className="mr-1 size-3" />
              Edit
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function MenuRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40">
      <div className="flex size-7 items-center justify-center rounded-md bg-muted/60">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">
          {value ?? <span className="text-muted-foreground/50 italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}
