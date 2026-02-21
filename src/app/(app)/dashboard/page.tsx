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
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getPaymentsSummary } from "@/lib/actions/payments";
import { getOverdueVaccinations } from "@/lib/actions/alarms";
import { getMedicalForms } from "@/lib/actions/medical";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Next 7 days for upcoming events
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  // Fetch all real counts in parallel
  const [
    branchesResult,
    classesResult,
    activeChildrenResult,
    draftsResult,
    todayReportsResult,
    todayAbsenceCount,
    paymentsSummaryResult,
    overdueVaxResult,
    unreadMessagesCount,
    allMedicalResult,
    draftMedicalResult,
    upcomingEventsCount,
    accidentReportsCount,
  ] = await Promise.all([
    getBranches(),
    getClasses(),
    getChildren({ status: "ACTIVE", pageSize: 1 }),
    getDrafts({ pageSize: 1 }),
    getDailyReports({ dateFrom: todayISO, dateTo: todayISO, pageSize: 1 }),
    db.absenceReport.count({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    }),
    getPaymentsSummary(),
    getOverdueVaccinations(),
    db.message.count({ where: { isRead: false } }),
    getMedicalForms({ pageSize: 1 }),
    getMedicalForms({ status: "DRAFT", pageSize: 1 }),
    db.event.count({
      where: {
        isActive: true,
        date: { gte: today, lte: next7Days },
      },
    }),
    db.medicalForm.count({
      where: { formType: "ACCIDENTS" },
    }),
  ]);

  const branchCount = Array.isArray(branchesResult.data)
    ? branchesResult.data.length
    : 0;
  const classCount = Array.isArray(classesResult.data)
    ? classesResult.data.length
    : 0;
  const activeChildrenCount = activeChildrenResult.total ?? 0;
  const totalDrafts = draftsResult.total ?? 0;

  // Today's attendance (daily reports submitted today)
  const totalAttendance = todayReportsResult.total ?? 0;

  // Today's absences
  const totalAbsence = todayAbsenceCount;

  // Missing daily reports: active children without a daily report today
  const missingDailyReports = Math.max(0, activeChildrenCount - totalAttendance);

  // Missing absent reports: absences without approved status
  const pendingAbsences = await db.absenceReport.count({
    where: { status: "PENDING" },
  });
  const missingAbsentReports = pendingAbsences;

  // Payments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentData = paymentsSummaryResult.data as any;
  const totalPayments = paymentData?.totalCount ?? 0;

  // Overdue vaccinations as medical alerts
  const overdueVax = Array.isArray(overdueVaxResult.data) ? overdueVaxResult.data : [];
  const accidentReports = accidentReportsCount;

  // Messages
  const incomingCalls = unreadMessagesCount;

  // Medical
  const totalMedicalReports = allMedicalResult.total ?? 0;
  const missingMedicalReports = draftMedicalResult.total ?? 0;

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
            value={totalAttendance}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Absence"
            value={totalAbsence}
            icon={XCircle}
            color="red"
            href="/absent-reports"
          />
          <StatCard
            title="Missing Daily Reports"
            value={missingDailyReports}
            icon={FileWarning}
            color="blue-hoki"
            href="/daily-reports"
          />
          <StatCard
            title="Missing Absent Reports"
            value={missingAbsentReports}
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
            value={totalPayments}
            icon={DollarSign}
            color="green"
            href="/accounting"
          />
          <StatCard
            title="Accident Reports"
            value={accidentReports}
            icon={AlertTriangle}
            color="red-pink"
            href="/medical/accidents"
          />
          <StatCard
            title="Unread Messages"
            value={incomingCalls}
            icon={PhoneCall}
            color="blue-hoki"
          />
        </div>

        {/* Row 6: Medical metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Medical Reports"
            value={totalMedicalReports}
            icon={Stethoscope}
            color="green"
            href="/medical/general"
          />
          <StatCard
            title="Missing Medical Reports"
            value={missingMedicalReports}
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
