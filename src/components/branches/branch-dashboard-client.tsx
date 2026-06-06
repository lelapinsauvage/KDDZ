"use client";

import {
  Ambulance,
  BookOpen,
  FileText,
  GraduationCap,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  DashboardDrilldownRequestFilters,
  DashboardDrilldowns,
} from "@/lib/actions/dashboard";
import { DashboardDrilldownCard } from "@/components/dashboard/dashboard-drilldown-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemographicsSection } from "@/components/dashboard/demographics-section";
import { StatCard } from "@/components/dashboard/stat-card";

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

interface BranchDemographics {
  childrenPerClass: Array<{ name: string; value: number }>;
  genderStats: Array<{ name: string; value: number }>;
}

interface DailyStats {
  totalAttendance: number;
  totalAbsence: number;
  missingDailyReports: number;
  missingAbsentReports: number;
}

interface ActionMetrics {
  totalPayments: number;
  accidentReports: number;
  loggedCalls: number;
  completedMedicalVisits: number;
  missingMedicalVisits: number;
  completedAssessments: number;
  missingAssessments: number;
  pendingMedicalReports: number;
  pendingAssessments: number;
}

export function BranchDashboardClient({
  branchId,
  selectedRange,
  selectedYearId,
  drilldownFilters,
  stats,
  demographics,
  dailyStats,
  actionMetrics,
}: {
  branchId: string;
  selectedRange: { from: string; to: string };
  selectedYearId: string | null;
  drilldownFilters: DashboardDrilldownRequestFilters;
  stats: BranchStats;
  demographics: BranchDemographics;
  dailyStats: DailyStats;
  actionMetrics: ActionMetrics;
}) {
  const color = stats.themeColor || "#1caf9a";
  const drilldowns = emptyBranchDashboardDrilldowns();
  const attendanceBreakdown = [
    { name: "Present", value: dailyStats.totalAttendance },
    { name: "Absent", value: dailyStats.totalAbsence },
    { name: "Missing Report", value: dailyStats.missingDailyReports },
  ];
  const filterQuery = new URLSearchParams({
    from: selectedRange.from,
    to: selectedRange.to,
  });
  if (selectedYearId) filterQuery.set("year", selectedYearId);
  const filterSuffix = filterQuery.toString();
  const withDashboardFilters = (href: string) =>
    `${href}${href.includes("?") ? "&" : "?"}${filterSuffix}`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <DashboardHeader selectedRange={selectedRange} selectedYearId={selectedYearId} />
      </div>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Garderie Branch
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          <StatCard
            title="Total Classes"
            value={stats.classCount}
            icon={BookOpen}
            color="sky"
            href={withDashboardFilters(`/branches/${branchId}/classes`)}
          />
          <StatCard
            title="Total Active Children"
            value={stats.childrenCount}
            icon={Users}
            color="emerald"
            href={withDashboardFilters(`/branches/${branchId}/children`)}
          />
          <StatCard
            title="Teachers"
            value={stats.teacherCount}
            icon={GraduationCap}
            color="purple"
            href={withDashboardFilters(`/employees/teachers?branch=${branchId}`)}
          />
          <StatCard
            title="Nurses"
            value={stats.nurseCount}
            icon={Stethoscope}
            color="rose"
            href={withDashboardFilters(`/employees/nurses?branch=${branchId}`)}
          />
          <StatCard
            title="Doctors"
            value={stats.doctorCount}
            icon={Stethoscope}
            color="orange"
            href={withDashboardFilters(`/employees/doctors?branch=${branchId}`)}
          />
          <StatCard
            title="Managers"
            value={stats.managerCount}
            icon={UserCog}
            color="blue"
            href={withDashboardFilters(`/employees/managers?branch=${branchId}`)}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Branch Charts
        </h3>
        <DemographicsSection
          attendanceBreakdown={attendanceBreakdown}
          childrenPerClass={demographics.childrenPerClass}
          genderStats={demographics.genderStats}
        />
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Daily Compliance
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Attendance"
            value={dailyStats.totalAttendance}
            icon={UserCheck}
            color="green"
            href={withDashboardFilters(`/daily-reports?branch=${branchId}&status=submitted`)}
          />
          <StatCard
            title="Total Absence"
            value={dailyStats.totalAbsence}
            icon={UserX}
            color="rose"
            href={withDashboardFilters(`/absent-reports?branch=${branchId}`)}
          />
          <DashboardDrilldownCard
            title="Missing Daily Reports"
            value={dailyStats.missingDailyReports}
            iconName="fileWarning"
            color="sky"
            drilldownKind="missingDailyReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingDailyReports}
          />
          <DashboardDrilldownCard
            title="Missing Absent Reports"
            value={dailyStats.missingAbsentReports}
            iconName="alertTriangle"
            color="amber"
            drilldownKind="missingAbsentReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingAbsentReports}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Operations
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Total Payments"
            value={`$${actionMetrics.totalPayments.toLocaleString()}`}
            iconName="dollarSign"
            color="green"
            drilldownKind="payments"
            filters={drilldownFilters}
            drilldown={drilldowns.payments}
          />
          <StatCard
            title="Accident Reports"
            value={actionMetrics.accidentReports}
            icon={Ambulance}
            color="orange"
            href={withDashboardFilters(`/medical/accidents?branch=${branchId}`)}
          />
          <StatCard
            title="Incoming/Outgoing Calls"
            value={actionMetrics.loggedCalls}
            icon={Phone}
            color="sky"
            href={withDashboardFilters(`/calls?branch=${branchId}`)}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Medical Reports
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Total Medical Reports"
            value={actionMetrics.completedMedicalVisits}
            iconName="stethoscope"
            color="green"
            drilldownKind="medicalReports"
            filters={drilldownFilters}
            drilldown={drilldowns.medicalReports}
          />
          <DashboardDrilldownCard
            title="Missing Medical Reports"
            value={actionMetrics.missingMedicalVisits}
            iconName="heartPulse"
            color="rose"
            drilldownKind="missingMedicalReports"
            filters={drilldownFilters}
            drilldown={drilldowns.missingMedicalReports}
          />
          <DashboardDrilldownCard
            title="Total Drafts"
            value={actionMetrics.pendingMedicalReports}
            iconName="fileEdit"
            color="sky"
            drilldownKind="medicalDrafts"
            filters={drilldownFilters}
            drilldown={drilldowns.medicalDrafts}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Assessments
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <DashboardDrilldownCard
            title="Total Assessments"
            value={actionMetrics.completedAssessments}
            iconName="clipboardCheck"
            color="green"
            drilldownKind="assessmentReports"
            filters={drilldownFilters}
            drilldown={drilldowns.assessmentReports}
          />
          <DashboardDrilldownCard
            title="Missing Assessments"
            value={actionMetrics.missingAssessments}
            iconName="clipboardList"
            color="rose"
            drilldownKind="missingAssessments"
            filters={drilldownFilters}
            drilldown={drilldowns.missingAssessments}
          />
          <DashboardDrilldownCard
            title="Total Drafts"
            value={actionMetrics.pendingAssessments}
            iconName="fileText"
            color="sky"
            drilldownKind="assessmentDrafts"
            filters={drilldownFilters}
            drilldown={drilldowns.assessmentDrafts}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Compliance
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="rounded-sm">
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
                    Government Compliance
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

          <Card className="rounded-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className="flex size-20 items-center justify-center rounded-sm"
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
      </section>
    </div>
  );
}

function emptyBranchDashboardDrilldowns(): DashboardDrilldowns {
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
