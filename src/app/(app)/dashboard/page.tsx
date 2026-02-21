import {
  Building2,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  FileWarning,
  DollarSign,
  AlertTriangle,
  PhoneCall,
  Stethoscope,
  FileMinus,
  FileEdit,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChildrenPerClassChart } from "@/components/dashboard/children-per-class-chart";
import { GenderStatsChart } from "@/components/dashboard/gender-stats-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getChildren, getDrafts } from "@/lib/actions/children";

export default async function DashboardPage() {
  // Fetch real counts in parallel
  const [branchesResult, classesResult, activeChildrenResult, draftsResult] =
    await Promise.all([
      getBranches(),
      getClasses(),
      getChildren({ status: "ACTIVE", pageSize: 1 }),
      getDrafts({ pageSize: 1 }),
    ]);

  const branchCount = Array.isArray(branchesResult.data)
    ? branchesResult.data.length
    : 0;
  const classCount = Array.isArray(classesResult.data)
    ? classesResult.data.length
    : 0;
  const activeChildrenCount = activeChildrenResult.total ?? 0;
  const totalDrafts = draftsResult.total ?? 0;

  // Demo data for stats we cannot yet compute from the DB
  const demoStats = {
    totalAttendance: 85,
    totalAbsence: 6,
    missingDailyReports: 4,
    missingAbsentReports: 2,
    totalPayments: 24,
    accidentReports: 1,
    incomingCalls: 8,
    totalMedicalReports: 78,
    missingMedicalReports: 13,
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Row 1: Branch / Class / Children totals */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Branches"
            value={branchCount}
            icon={Building2}
            color="blue"
            href="/branches"
          />
          <StatCard
            title="Total Classes"
            value={classCount}
            icon={BookOpen}
            color="blue-hoki"
            href="/classes"
          />
          <StatCard
            title="Active Children"
            value={activeChildrenCount}
            icon={Users}
            color="green"
            href="/children"
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChildrenPerClassChart />
          <GenderStatsChart />
        </div>

        {/* Row 3: Attendance metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Attendance"
            value={demoStats.totalAttendance}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Absence"
            value={demoStats.totalAbsence}
            icon={XCircle}
            color="red"
            href="/absent-reports"
          />
          <StatCard
            title="Missing Daily Reports"
            value={demoStats.missingDailyReports}
            icon={FileWarning}
            color="blue-hoki"
            href="/daily-reports"
          />
          <StatCard
            title="Missing Absent Reports"
            value={demoStats.missingAbsentReports}
            icon={FileText}
            color="blue-hoki"
            href="/absent-reports/drafts"
          />
        </div>

        {/* Row 4: Attendance trend chart */}
        <AttendanceChart />

        {/* Row 5: Financial & incident metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Payments"
            value={demoStats.totalPayments}
            icon={DollarSign}
            color="green"
            href="/accounting"
          />
          <StatCard
            title="Accident Reports"
            value={demoStats.accidentReports}
            icon={AlertTriangle}
            color="red-pink"
            href="/medical/accidents"
          />
          <StatCard
            title="Incoming / Outgoing Calls"
            value={demoStats.incomingCalls}
            icon={PhoneCall}
            color="blue-hoki"
          />
        </div>

        {/* Row 6: Medical metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Medical Reports"
            value={demoStats.totalMedicalReports}
            icon={Stethoscope}
            color="green"
            href="/medical/general"
          />
          <StatCard
            title="Missing Medical Reports"
            value={demoStats.missingMedicalReports}
            icon={FileMinus}
            color="red-pink"
          />
          <StatCard
            title="Total Drafts"
            value={totalDrafts}
            icon={FileEdit}
            color="blue-hoki"
            href="/children/drafts"
          />
        </div>
      </div>
    </>
  );
}
