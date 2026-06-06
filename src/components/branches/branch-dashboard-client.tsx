"use client";

import {
  Ambulance,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileEdit,
  FileText,
  FileWarning,
  GraduationCap,
  HeartPulse,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserCog,
  UserX,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  stats,
  demographics,
  dailyStats,
  actionMetrics,
}: {
  branchId: string;
  stats: BranchStats;
  demographics: BranchDemographics;
  dailyStats: DailyStats;
  actionMetrics: ActionMetrics;
}) {
  const color = stats.themeColor || "#1caf9a";
  const attendanceBreakdown = [
    { name: "Present", value: dailyStats.totalAttendance },
    { name: "Absent", value: dailyStats.totalAbsence },
    { name: "Missing Report", value: dailyStats.missingDailyReports },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
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
            href={`/branches/${branchId}/classes`}
          />
          <StatCard
            title="Total Active Children"
            value={stats.childrenCount}
            icon={Users}
            color="emerald"
            href={`/children?branch=${branchId}`}
          />
          <StatCard
            title="Teachers"
            value={stats.teacherCount}
            icon={GraduationCap}
            color="purple"
            href={`/employees/teachers?branch=${branchId}`}
          />
          <StatCard
            title="Nurses"
            value={stats.nurseCount}
            icon={Stethoscope}
            color="rose"
            href={`/employees/nurses?branch=${branchId}`}
          />
          <StatCard
            title="Doctors"
            value={stats.doctorCount}
            icon={Stethoscope}
            color="orange"
            href={`/employees/doctors?branch=${branchId}`}
          />
          <StatCard
            title="Managers"
            value={stats.managerCount}
            icon={UserCog}
            color="blue"
            href={`/employees/managers?branch=${branchId}`}
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
            href={`/daily-reports?branch=${branchId}&status=submitted`}
          />
          <StatCard
            title="Total Absence"
            value={dailyStats.totalAbsence}
            icon={UserX}
            color="rose"
            href={`/absent-reports?branch=${branchId}`}
          />
          <StatCard
            title="Missing Daily Reports"
            value={dailyStats.missingDailyReports}
            icon={FileWarning}
            color="sky"
            href={`/daily-reports?branch=${branchId}&status=missing`}
          />
          <StatCard
            title="Missing Absent Reports"
            value={dailyStats.missingAbsentReports}
            icon={AlertTriangle}
            color="amber"
            href={`/absent-reports?branch=${branchId}&status=missing`}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Operations
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Payments"
            value={`$${actionMetrics.totalPayments.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            href={`/accounting?branch=${branchId}`}
          />
          <StatCard
            title="Accident Reports"
            value={actionMetrics.accidentReports}
            icon={Ambulance}
            color="orange"
            href={`/medical/accidents?branch=${branchId}`}
          />
          <StatCard
            title="Incoming/Outgoing Calls"
            value={actionMetrics.loggedCalls}
            icon={Phone}
            color="sky"
            href={`/calls?branch=${branchId}`}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Medical Reports
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Medical Reports"
            value={actionMetrics.completedMedicalVisits}
            icon={Stethoscope}
            color="green"
            href={`/medical/general?branch=${branchId}`}
          />
          <StatCard
            title="Missing Medical Reports"
            value={actionMetrics.missingMedicalVisits}
            icon={HeartPulse}
            color="rose"
            href={`/medical/general?branch=${branchId}&status=missing`}
          />
          <StatCard
            title="Total Drafts"
            value={actionMetrics.pendingMedicalReports}
            icon={FileEdit}
            color="sky"
            href={`/medical/general?branch=${branchId}&status=draft`}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Assessments
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Assessments"
            value={actionMetrics.completedAssessments}
            icon={ClipboardCheck}
            color="green"
            href={`/assessments?branch=${branchId}`}
          />
          <StatCard
            title="Missing Assessments"
            value={actionMetrics.missingAssessments}
            icon={ClipboardList}
            color="rose"
            href={`/assessments?branch=${branchId}&status=missing`}
          />
          <StatCard
            title="Total Drafts"
            value={actionMetrics.pendingAssessments}
            icon={FileText}
            color="sky"
            href={`/assessments?branch=${branchId}&status=draft`}
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
