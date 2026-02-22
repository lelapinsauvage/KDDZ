"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import type { TodayData, TodayChild } from "@/lib/actions/today";

interface TodayClientProps {
  data: TodayData;
}

export function TodayClient({ data }: TodayClientProps) {
  const [classFilter, setClassFilter] = useState("all");

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

  return (
    <>
      <PageHeader
        title="Today"
        breadcrumbs={[{ label: "Today" }]}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/daily-reports/batch">
              <FileText className="mr-1 size-3.5" />
              Start Daily Reports
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/daily-reports/new">
              <Plus className="mr-1 size-3.5" />
              Single Report
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/absent-reports/new">
              <UserX className="mr-1 size-3.5" />
              Report Absence
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/messages/compose">
              <Inbox className="mr-1 size-3.5" />
              Send Message
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="py-3">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{filteredStats.totalChildren}</p>
                <p className="text-xs text-muted-foreground">Children</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{filteredStats.reportsCompleted}</p>
                <p className="text-xs text-muted-foreground">Reports Done</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{filteredStats.reportsMissing + filteredStats.reportsDraft}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-100">
                <UserX className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{filteredStats.absences}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
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
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {filteredStats.reportsCompleted} of {filteredStats.totalChildren - filteredStats.absences} reports completed
                    </span>
                    <span className="font-medium text-primary">
                      {filteredStats.totalChildren - filteredStats.absences > 0
                        ? Math.round(
                            (filteredStats.reportsCompleted /
                              (filteredStats.totalChildren - filteredStats.absences)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${
                          filteredStats.totalChildren - filteredStats.absences > 0
                            ? (filteredStats.reportsCompleted /
                                (filteredStats.totalChildren - filteredStats.absences)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {filteredChildren.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No children found for the selected class.
                    </p>
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
              <CardContent className="space-y-2">
                <MenuRow label="Breakfast" value={data.menu.breakfast} />
                <MenuRow label="Lunch" value={data.menu.lunch} />
                <MenuRow label="Dessert" value={data.menu.dessert} />
                {data.menu.snack && <MenuRow label="Snack" value={data.menu.snack} />}
                {!data.menu.breakfast && !data.menu.lunch && !data.menu.dessert && (
                  <p className="text-sm text-muted-foreground">
                    No menu set for today.{" "}
                    <Link href="/food/calendar" className="text-primary hover:underline">
                      Set menu
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            {data.alerts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="size-4 text-amber-500" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={alert.href}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5">
                        {alert.type === "message" && <Inbox className="size-4 text-blue-500" />}
                        {alert.type === "birthday" && <Cake className="size-4 text-pink-500" />}
                        {alert.type === "medical" && <AlertCircle className="size-4 text-red-500" />}
                        {alert.type === "absence" && <UserX className="size-4 text-amber-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ChildRow({ child }: { child: TodayChild }) {
  const statusIcon = child.isAbsent ? (
    <Badge className="bg-red-100 text-red-700 border-red-200">Absent</Badge>
  ) : child.reportStatus === "SUBMITTED" ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="mr-1 size-3" />
      Done
    </Badge>
  ) : child.reportStatus === "DRAFT" ? (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
      <Clock className="mr-1 size-3" />
      Draft
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <CircleDot className="mr-1 size-3" />
      No Report
    </Badge>
  );

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {child.firstName.charAt(0)}
        {child.lastName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/children/${child.id}/dashboard`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {child.firstName} {child.lastName}
        </Link>
        {child.className && (
          <p className="text-xs text-muted-foreground">{child.className}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {statusIcon}
        {!child.isAbsent && !child.reportId && (
          <Button asChild size="sm" variant="ghost" className="h-7 px-2">
            <Link href={`/daily-reports/new?childId=${child.id}`}>
              <FileText className="size-3.5" />
            </Link>
          </Button>
        )}
        {child.reportId && child.reportStatus === "DRAFT" && (
          <Button asChild size="sm" variant="ghost" className="h-7 px-2">
            <Link href={`/daily-reports/${child.reportId}/edit`}>
              <FileText className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function MenuRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value ?? <span className="text-muted-foreground/50">Not set</span>}
      </span>
    </div>
  );
}
