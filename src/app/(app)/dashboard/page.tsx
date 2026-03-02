import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDashboardDemographics,
  getDailyComplianceStats,
  getActionCenterMetrics,
} from "@/lib/actions/dashboard";
import type {
  DailyComplianceStats,
  ActionCenterMetrics as ActionCenterMetricsType,
} from "@/lib/actions/dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemographicsSection } from "@/components/dashboard/demographics-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/ui/skeleton";
import {
  Sun,
  Moon,
  Sunrise,
  Building2,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  FileWarning,
  AlertTriangle,
  Phone,
  Ambulance,
  DollarSign,
  Stethoscope,
  HeartPulse,
  FileEdit,
  ClipboardCheck,
  ClipboardList,
  FileText,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  const branchId = session?.user?.branchId ?? null;
  const isBranchLevel = branchId != null;

  let demographics: Awaited<ReturnType<typeof getDashboardDemographics>>;
  let compliance: DailyComplianceStats;
  let metrics: ActionCenterMetricsType;
  try {
    [demographics, compliance, metrics] = await Promise.all([
      getDashboardDemographics(),
      getDailyComplianceStats(branchId),
      getActionCenterMetrics(branchId),
    ]);
  } catch {
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
    metrics = {
      totalPayments: 0,
      accidentReports: 0,
      loggedCalls: 0,
      completedMedicalVisits: 0,
      missingMedicalVisits: 0,
      completedAssessments: 0,
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

  // Attendance breakdown for pie chart
  const attendanceBreakdown = [
    { name: "Present", value: compliance.totalAttendance },
    { name: "Absent", value: compliance.totalAbsence },
    { name: "Missing Report", value: compliance.missingDailyReports },
  ];

  return (
    <FadeIn className="space-y-6 sm:space-y-8 p-4 md:p-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-[1.875rem] font-extrabold tracking-[-0.01em] text-foreground font-heading leading-[2.375rem]">
            <GreetingIcon className="size-7 text-[#D97706]" />
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-muted-foreground/70">{todayFormatted}</p>
        </div>
        <DashboardHeader />
      </div>

      {/* ── Row 1: Overview (Branches, Classes, Children) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Overview
        </h3>
        <div
          className={`grid gap-3 sm:gap-4 ${isBranchLevel ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
        >
          {!isBranchLevel && (
            <StatCard
              title="Total Branches"
              value={demographics.totalBranches}
              icon={Building2}
              color="blue"
              href="/branches"
            />
          )}
          <StatCard
            title="Total Classes"
            value={demographics.totalClasses}
            icon={BookOpen}
            color="sky"
            href="/classes"
          />
          <StatCard
            title="Total Children"
            value={demographics.totalActiveChildren}
            icon={Users}
            color="emerald"
            href="/children"
          />
        </div>
      </div>

      {/* ── Row 2: Charts (Attendance, Children per Class, Gender) ── */}
      <DemographicsSection
        attendanceBreakdown={attendanceBreakdown}
        childrenPerClass={demographics.childrenPerClass}
        genderStats={demographics.genderStats}
      />

      {/* ── Row 3: Daily Compliance (Attendance, Absence, Missing Reports) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Daily Compliance
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Attendance"
            value={compliance.totalAttendance}
            icon={UserCheck}
            color="emerald"
            href="/daily-reports?status=submitted"
          />
          <StatCard
            title="Total Absences"
            value={compliance.totalAbsence}
            icon={UserX}
            color="rose"
            href="/absent-reports"
          />
          <StatCard
            title="Missing Reports"
            value={compliance.missingDailyReports}
            icon={FileWarning}
            color="amber"
            href="/daily-reports?status=missing"
          />
          <StatCard
            title="Missing Absence Reports"
            value={compliance.missingAbsentReports}
            icon={AlertTriangle}
            color="amber"
            href="/absent-reports?status=missing"
          />
        </div>
      </div>

      {/* ── Row 4: Operations (Accounting, Accidents, Calls) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Operations
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Accounting"
            value={`$${metrics.totalPayments.toLocaleString()}`}
            icon={DollarSign}
            color="emerald"
            href="/accounting"
          />
          <StatCard
            title="Accidents"
            value={metrics.accidentReports}
            icon={Ambulance}
            color="rose"
            href="/medical/accidents"
          />
          <StatCard
            title="Phone Calls"
            value={metrics.loggedCalls}
            icon={Phone}
            color="sky"
            href="/children?tab=calls"
          />
        </div>
      </div>

      {/* ── Row 5: Medical Reports (Published, Missing, Drafts) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Medical Reports
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Medical Published"
            value={metrics.completedMedicalVisits}
            icon={Stethoscope}
            color="emerald"
            href="/medical/general"
          />
          <StatCard
            title="Medical Missing"
            value={metrics.missingMedicalVisits}
            icon={HeartPulse}
            color="rose"
            href="/medical/general?status=missing"
          />
          <StatCard
            title="Medical Drafts"
            value={metrics.pendingMedicalReports}
            icon={FileEdit}
            color="sky"
            href="/medical/general?status=draft"
          />
        </div>
      </div>

      {/* ── Row 6: Assessments (Published, Missing, Drafts) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Assessments
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Assessments Published"
            value={metrics.completedAssessments}
            icon={ClipboardCheck}
            color="emerald"
            href="/assessments"
          />
          <StatCard
            title="Assessments Missing"
            value={metrics.missingAssessments}
            icon={ClipboardList}
            color="rose"
            href="/assessments?status=missing"
          />
          <StatCard
            title="Assessments Drafts"
            value={metrics.pendingAssessments}
            icon={FileText}
            color="sky"
            href="/assessments?status=draft"
          />
        </div>
      </div>
    </FadeIn>
  );
}
