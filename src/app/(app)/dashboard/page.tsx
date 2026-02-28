import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getMorningBriefing,
  getDashboardDemographics,
  getDailyComplianceStats,
  getActionCenterMetrics,
} from "@/lib/actions/dashboard";
import type {
  DailyComplianceStats,
  ActionCenterMetrics as ActionCenterMetricsType,
} from "@/lib/actions/dashboard";
import { StatusBoard } from "@/components/dashboard/status-board";
import { ActionCenter } from "@/components/dashboard/action-center";
import { TodayMenuWidget } from "@/components/dashboard/today-menu-widget";
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemographicsSection } from "@/components/dashboard/demographics-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/ui/skeleton";
import { Sun, Moon, Sunrise, Building2, BookOpen, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  const branchId = session?.user?.branchId ?? null;
  const isBranchLevel = branchId != null;

  let briefing: Awaited<ReturnType<typeof getMorningBriefing>>;
  let demographics: Awaited<ReturnType<typeof getDashboardDemographics>>;
  let compliance: DailyComplianceStats;
  let actionMetrics: ActionCenterMetricsType;
  try {
    [briefing, demographics, compliance, actionMetrics] = await Promise.all([
      getMorningBriefing(),
      getDashboardDemographics(),
      getDailyComplianceStats(branchId),
      getActionCenterMetrics(branchId),
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
    compliance = {
      totalAttendance: 0,
      totalAbsence: 0,
      missingDailyReports: 0,
      missingAbsentReports: 0,
    };
    actionMetrics = {
      totalPayments: 0,
      accidentReports: 0,
      loggedCalls: 0,
      completedMedicalVisits: 0,
      missingMedicalVisits: 0,
      missingAssessments: 0,
      pendingDailyReports: 0,
      pendingMedicalReports: 0,
      pendingAssessments: 0,
    };
  }

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const GreetingIcon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const attentionSummary =
    briefing.totalAttentionItems === 0
      ? "Everything looks good today — no items need your attention."
      : briefing.totalAttentionItems === 1
        ? "Just 1 thing needs a quick look."
        : `${briefing.totalAttentionItems} things could use your attention today.`;

  return (
    <FadeIn className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* ── Morning greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-[1.875rem] font-extrabold tracking-[-0.01em] text-foreground font-heading leading-[2.375rem]">
            <GreetingIcon className="size-7 text-[#D97706]" />
            {greeting}, {userName}
          </h1>
          <p className="text-[13px] text-muted-foreground leading-5">
            {attentionSummary}
          </p>
          <p className="text-xs text-muted-foreground/70">{todayFormatted}</p>
        </div>
        <DashboardHeader />
      </div>

      {/* ── KPI stat cards ── */}
      <div
        className={`grid gap-4 ${isBranchLevel ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}
      >
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

      {/* ── Compliance row ── */}
      <StatusBoard compliance={compliance} />

      {/* ── Demographics charts ── */}
      <DemographicsSection
        childrenPerClass={demographics.childrenPerClass}
        genderStats={demographics.genderStats}
      />

      {/* ── Action Center 3×3 grid ── */}
      <ActionCenter metrics={actionMetrics} />

      {/* ── Menu + Weekly chart ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayMenuWidget {...briefing.todayMenu} />
        <WeeklyAttendanceChart data={briefing.weeklyAttendance} />
      </div>

      {/* ── Insights ── */}
      <InsightsPanel insights={briefing.insights} />
    </FadeIn>
  );
}
