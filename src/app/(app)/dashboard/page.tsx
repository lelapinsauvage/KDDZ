import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDashboardDemographics,
  getDailyComplianceStats,
  getActionCenterMetrics,
} from "@/lib/actions/dashboard";
import { getSchoolYears } from "@/lib/actions/school-years";
import type {
  DashboardMetricFilters,
  DailyComplianceStats,
  ActionCenterMetrics as ActionCenterMetricsType,
  DashboardDrilldowns,
  DashboardDrilldownRequestFilters,
} from "@/lib/actions/dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemographicsSection } from "@/components/dashboard/demographics-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardDrilldownCard } from "@/components/dashboard/dashboard-drilldown-card";
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
  Phone,
  Ambulance,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    year?: string | string[];
  }>;
}

type DashboardSchoolYear = {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateParam(value: string | string[] | undefined): Date | null {
  const text = firstParam(value);
  const match = text?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(date);
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  );
}

function resolveDashboardSelection(
  params: Awaited<PageProps["searchParams"]>,
  schoolYears: DashboardSchoolYear[]
) {
  const today = startOfDay(new Date());
  const rawFrom = parseDateParam(params.from) ?? today;
  const rawTo = parseDateParam(params.to) ?? rawFrom;
  const startDate = rawFrom <= rawTo ? rawFrom : rawTo;
  const endDate = rawFrom <= rawTo ? rawTo : rawFrom;
  const yearParam = firstParam(params.year);
  const queryYearId = isUuid(yearParam) ? yearParam : null;
  const fallbackYear = schoolYears.find((year) => year.isActive) ?? schoolYears[0] ?? null;
  const selectedYear =
    (queryYearId ? schoolYears.find((year) => year.id === queryYearId) : null) ??
    fallbackYear;

  return {
    startDate,
    endDate,
    fromKey: formatDateKey(startDate),
    toKey: formatDateKey(endDate),
    schoolYearId: selectedYear?.id ?? null,
  };
}

function emptyDashboardDrilldowns(): DashboardDrilldowns {
  return {
    payments: {
      title: "Payments Details",
      columns: [
        "date",
        "number",
        "name",
        "lastName",
        "amount",
        "for",
        "type",
        "from",
        "to",
        "remarks",
        "action",
        "attachment",
      ],
      rows: [],
    },
    missingDailyReports: {
      title: "Missing Daily Reports",
      columns: ["number", "name", "date", "action"],
      rows: [],
    },
    missingAbsentReports: {
      title: "Missing Absent Reports",
      columns: ["number", "name", "date", "action"],
      rows: [],
    },
    medicalReports: {
      title: "Medical Reports",
      columns: ["number", "name", "type", "date", "action"],
      rows: [],
    },
    missingMedicalReports: {
      title: "Missing Medical Reports",
      columns: ["number", "name", "type", "action"],
      rows: [],
    },
    medicalDrafts: {
      title: "Medical Reports - Drafts",
      columns: ["number", "name", "type", "date", "action"],
      rows: [],
    },
    assessmentReports: {
      title: "Assessment Reports",
      columns: ["number", "name", "type", "date", "action"],
      rows: [],
    },
    missingAssessments: {
      title: "Missing Assessment Reports",
      columns: ["number", "name", "type", "action"],
      rows: [],
    },
    assessmentDrafts: {
      title: "Assessment Reports - Drafts",
      columns: ["number", "name", "type", "date", "action"],
      rows: [],
    },
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  const branchId = session?.user?.branchId ?? null;
  const isBranchLevel = branchId != null;
  const yearsResult = await getSchoolYears();
  const schoolYears = (yearsResult.data ?? []) as DashboardSchoolYear[];
  const selection = resolveDashboardSelection(params, schoolYears);
  const dashboardFilters: DashboardMetricFilters = {
    startDate: selection.startDate,
    endDate: selection.endDate,
    schoolYearId: selection.schoolYearId,
  };
  const drilldownFilters: DashboardDrilldownRequestFilters = {
    from: selection.fromKey,
    to: selection.toKey,
    schoolYearId: selection.schoolYearId,
  };
  const drilldowns = emptyDashboardDrilldowns();

  const filterQuery = new URLSearchParams({
    from: selection.fromKey,
    to: selection.toKey,
  });
  if (selection.schoolYearId) filterQuery.set("year", selection.schoolYearId);
  const filterSuffix = filterQuery.toString();
  const withDashboardFilters = (href: string) =>
    `${href}${href.includes("?") ? "&" : "?"}${filterSuffix}`;

  let demographics: Awaited<ReturnType<typeof getDashboardDemographics>>;
  let compliance: DailyComplianceStats;
  let metrics: ActionCenterMetricsType;
  try {
    [demographics, compliance, metrics] = await Promise.all([
      getDashboardDemographics(branchId, { schoolYearId: selection.schoolYearId }),
      getDailyComplianceStats(branchId, dashboardFilters),
      getActionCenterMetrics(branchId, dashboardFilters),
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
        <DashboardHeader
          selectedRange={{ from: selection.fromKey, to: selection.toKey }}
          selectedYearId={selection.schoolYearId}
        />
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
              href={withDashboardFilters("/branches")}
            />
          )}
          <StatCard
            title="Total Classes"
            value={demographics.totalClasses}
            icon={BookOpen}
            color="sky"
            href={withDashboardFilters("/classes")}
          />
          <StatCard
            title="Total Children"
            value={demographics.totalActiveChildren}
            icon={Users}
            color="emerald"
            href={withDashboardFilters("/children")}
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
            href={withDashboardFilters("/daily-reports?status=submitted")}
          />
          <StatCard
            title="Total Absences"
            value={compliance.totalAbsence}
            icon={UserX}
            color="rose"
            href={withDashboardFilters("/absent-reports")}
          />
          <DashboardDrilldownCard
            title="Missing Reports"
            value={compliance.missingDailyReports}
            iconName="fileWarning"
            color="amber"
            drilldownKind="missingDailyReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingDailyReports}
          />
          <DashboardDrilldownCard
            title="Missing Absence Reports"
            value={compliance.missingAbsentReports}
            iconName="alertTriangle"
            color="amber"
            drilldownKind="missingAbsentReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingAbsentReports}
          />
        </div>
      </div>

      {/* ── Row 4: Operations (Accounting, Accidents, Calls) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Operations
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Accounting"
            value={`$${metrics.totalPayments.toLocaleString()}`}
            iconName="dollarSign"
            color="emerald"
            drilldownKind="payments"
            filters={drilldownFilters}
            drilldown={drilldowns.payments}
          />
          <StatCard
            title="Accidents"
            value={metrics.accidentReports}
            icon={Ambulance}
            color="rose"
            href={withDashboardFilters("/medical/accidents")}
          />
          <StatCard
            title="Phone Calls"
            value={metrics.loggedCalls}
            icon={Phone}
            color="sky"
            href={withDashboardFilters("/children?tab=calls")}
          />
        </div>
      </div>

      {/* ── Row 5: Medical Reports (Published, Missing, Drafts) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Medical Reports
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Medical Published"
            value={metrics.completedMedicalVisits}
            iconName="stethoscope"
            color="emerald"
            drilldownKind="medicalReports"
            filters={drilldownFilters}
            drilldown={drilldowns.medicalReports}
          />
          <DashboardDrilldownCard
            title="Medical Missing"
            value={metrics.missingMedicalVisits}
            iconName="heartPulse"
            color="rose"
            drilldownKind="missingMedicalReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingMedicalReports}
          />
          <DashboardDrilldownCard
            title="Medical Drafts"
            value={metrics.pendingMedicalReports}
            iconName="fileEdit"
            color="sky"
            drilldownKind="medicalDrafts"
            filters={drilldownFilters}
            drilldown={drilldowns.medicalDrafts}
          />
        </div>
      </div>

      {/* ── Row 6: Assessments (Published, Missing, Drafts) ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Assessments
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Assessments Published"
            value={metrics.completedAssessments}
            iconName="clipboardCheck"
            color="emerald"
            drilldownKind="assessmentReports"
            filters={drilldownFilters}
            drilldown={drilldowns.assessmentReports}
          />
          <DashboardDrilldownCard
            title="Assessments Missing"
            value={metrics.missingAssessments}
            iconName="clipboardList"
            color="rose"
            drilldownKind="missingAssessments"
            filters={drilldownFilters}
            drilldown={drilldowns.missingAssessments}
          />
          <DashboardDrilldownCard
            title="Assessments Drafts"
            value={metrics.pendingAssessments}
            iconName="fileText"
            color="sky"
            drilldownKind="assessmentDrafts"
            filters={drilldownFilters}
            drilldown={drilldowns.assessmentDrafts}
          />
        </div>
      </div>
    </FadeIn>
  );
}
