import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMorningBriefing, getDashboardDemographics } from "@/lib/actions/dashboard";
import { StatusBoard } from "@/components/dashboard/status-board";
import { ActionCenter } from "@/components/dashboard/action-center";
import { TodayMenuWidget } from "@/components/dashboard/today-menu-widget";
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemographicsSection } from "@/components/dashboard/demographics-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { Sun, Moon, Sunrise, Building2, BookOpen, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  let briefing: Awaited<ReturnType<typeof getMorningBriefing>>;
  let demographics: Awaited<ReturnType<typeof getDashboardDemographics>>;
  try {
    [briefing, demographics] = await Promise.all([
      getMorningBriefing(),
      getDashboardDemographics(),
    ]);
  } catch {
    // Missing org context — show empty state
    briefing = {
      attendance: { present: 0, total: 0, status: "green" },
      reports: { submitted: 0, total: 0, status: "green" },
      staff: { present: 0, total: 0, status: "green" },
      finance: { overdueCount: 0, overdueAmount: 0, status: "green" },
      health: { issues: 0, status: "green" },
      actionItems: {
        pendingAbsences: [],
        overduePayments: [],
        missingReportsByClass: [],
        draftChildren: [],
      },
      totalAttentionItems: 0,
      insights: [],
      todayMenu: { breakfast: null, lunch: null, dessert: null, snack: null },
      weeklyAttendance: [],
    };
    demographics = {
      totalBranches: 0,
      totalClasses: 0,
      totalActiveChildren: 0,
      childrenPerClass: [],
      genderStats: [],
    };
  }

  const isBranchLevel = session?.user?.branchId != null;
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const GreetingIcon =
    hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pillars = [
    {
      label: "Attendance",
      metric: `${briefing.attendance.present}/${briefing.attendance.total}`,
      status: briefing.attendance.status,
      href: "/daily-reports",
    },
    {
      label: "Reports",
      metric: `${briefing.reports.submitted}/${briefing.reports.total}`,
      status: briefing.reports.status,
      href: "/daily-reports",
    },
    {
      label: "Staff",
      metric: `${briefing.staff.present}/${briefing.staff.total}`,
      status: briefing.staff.status,
      href: "/employees/teachers",
    },
    {
      label: "Finance",
      metric: briefing.finance.overdueCount === 0
        ? "OK"
        : `${briefing.finance.overdueCount} due`,
      status: briefing.finance.status,
      href: "/accounting",
    },
    {
      label: "Health",
      metric: briefing.health.issues === 0 ? "OK" : `${briefing.health.issues} issue${briefing.health.issues > 1 ? "s" : ""}`,
      status: briefing.health.status,
      href: "/medical/general",
    },
  ];

  const attentionSummary =
    briefing.totalAttentionItems === 0
      ? "Everything looks good today — no items need your attention."
      : briefing.totalAttentionItems === 1
        ? "Just 1 thing needs a quick look."
        : `${briefing.totalAttentionItems} things could use your attention today.`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting + Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <GreetingIcon className="size-6 text-amber-500" />
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {attentionSummary}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{todayFormatted}</p>
        </div>
        <DashboardHeader />
      </div>

      {/* KPI stat cards */}
      <div className={`grid gap-4 ${isBranchLevel ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        {!isBranchLevel && (
          <StatCard
            title="Total Branches"
            value={demographics.totalBranches}
            icon={Building2}
            color="teal"
            href="/branches"
          />
        )}
        <StatCard
          title="Total Classes"
          value={demographics.totalClasses}
          icon={BookOpen}
          color="blue"
          href="/classes"
        />
        <StatCard
          title="Active Children"
          value={demographics.totalActiveChildren}
          icon={Users}
          color="emerald"
          href="/children"
        />
      </div>

      {/* Status pillars */}
      <StatusBoard pillars={pillars} />

      {/* Demographics charts */}
      <DemographicsSection
        childrenPerClass={demographics.childrenPerClass}
        genderStats={demographics.genderStats}
      />

      {/* Action items */}
      <ActionCenter items={briefing.actionItems} />

      {/* Menu + Weekly chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayMenuWidget {...briefing.todayMenu} />
        <WeeklyAttendanceChart data={briefing.weeklyAttendance} />
      </div>

      {/* Insights */}
      <InsightsPanel insights={briefing.insights} />
    </div>
  );
}
