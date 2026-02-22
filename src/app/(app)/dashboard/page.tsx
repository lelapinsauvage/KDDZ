import { redirect } from "next/navigation";
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
  MessageSquare,
  Stethoscope,
  FileMinus,
  FileEdit,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChildrenPerClassChart } from "@/components/dashboard/children-per-class-chart";
import { GenderStatsChart } from "@/components/dashboard/gender-stats-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { TodayMenuWidget } from "@/components/dashboard/today-menu-widget";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getChildren, getDrafts } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getPaymentsSummary } from "@/lib/actions/payments";
import { getOverdueVaccinations } from "@/lib/actions/alarms";
import { getMedicalForms } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  // Teachers get the Today view as their default landing page
  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const activeSchoolYear = await db.schoolYear.findFirst({
    where: { isActive: true },
    select: { startDate: true, endDate: true },
  });

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
    _upcomingEventsCount,
    accidentReportsCount,
    childrenPerClass,
    genderGroups,
    attendanceByMonth,
    absenceByMonth,
    todayFoodCalendar,
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
    db.class.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: {
          select: { children: { where: { isActive: true, isDraft: false } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.child.groupBy({
      by: ["gender"],
      _count: { _all: true },
      where: { isActive: true, isDraft: false, gender: { not: null } },
    }),
    activeSchoolYear
      ? db.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT TO_CHAR("reportDate", 'Mon') as month, COUNT(*) as count
          FROM daily_reports
          WHERE "reportDate" BETWEEN ${activeSchoolYear.startDate} AND ${activeSchoolYear.endDate}
          GROUP BY DATE_TRUNC('month', "reportDate"), TO_CHAR("reportDate", 'Mon')
          ORDER BY DATE_TRUNC('month', "reportDate")
        `
      : Promise.resolve([]),
    activeSchoolYear
      ? db.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT TO_CHAR("date", 'Mon') as month, COUNT(*) as count
          FROM absence_reports
          WHERE "date" BETWEEN ${activeSchoolYear.startDate} AND ${activeSchoolYear.endDate}
          GROUP BY DATE_TRUNC('month', "date"), TO_CHAR("date", 'Mon')
          ORDER BY DATE_TRUNC('month', "date")
        `
      : Promise.resolve([]),
    db.foodCalendar.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { food: { select: { name: true } } },
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
  const totalAttendance = todayReportsResult.total ?? 0;
  const totalAbsence = todayAbsenceCount;
  const missingDailyReports = Math.max(0, activeChildrenCount - totalAttendance);
  const pendingAbsences = await db.absenceReport.count({
    where: { status: "PENDING" },
  });
  const missingAbsentReports = pendingAbsences;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentData = paymentsSummaryResult.data as any;
  const totalPayments = paymentData?.totalCount ?? 0;
  const _overdueVax = Array.isArray(overdueVaxResult.data) ? overdueVaxResult.data : [];
  const accidentReports = accidentReportsCount;
  const incomingCalls = unreadMessagesCount;
  const totalMedicalReports = allMedicalResult.total ?? 0;
  const missingMedicalReports = draftMedicalResult.total ?? 0;

  const classChartData = childrenPerClass.map((c) => ({
    name: c.name,
    children: c._count.children,
  }));
  const genderChartData = genderGroups.map((g) => ({
    name: g.gender === "MALE" ? "Male" : "Female",
    value: g._count._all,
  }));
  const absenceMap = new Map(
    absenceByMonth.map((r) => [r.month, Number(r.count)])
  );
  const attendanceChartData = attendanceByMonth.map((r) => ({
    month: r.month,
    attendance: Number(r.count),
    absence: absenceMap.get(r.month) ?? 0,
  }));
  for (const r of absenceByMonth) {
    if (!attendanceByMonth.some((a) => a.month === r.month)) {
      attendanceChartData.push({
        month: r.month,
        attendance: 0,
        absence: Number(r.count),
      });
    }
  }

  // Today's menu
  const todayMenu = {
    breakfast: todayFoodCalendar.find((c) => c.mealType === "BREAKFAST")?.food.name ?? null,
    lunch: todayFoodCalendar.find((c) => c.mealType === "LUNCH")?.food.name ?? null,
    dessert: todayFoodCalendar.find((c) => c.mealType === "DESSERT")?.food.name ?? null,
    snack: todayFoodCalendar.find((c) => c.mealType === "SNACK")?.food.name ?? null,
  };

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayFormatted}
          </p>
        </div>
      </div>

      {/* Priority cards: what needs attention */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Children"
          value={activeChildrenCount}
          icon={Users}
          color="teal"
          href="/children"
        />
        <StatCard
          title="Reports Today"
          value={`${totalAttendance} / ${activeChildrenCount}`}
          icon={CheckCircle}
          color="emerald"
          href="/daily-reports"
        />
        <StatCard
          title="Absences Today"
          value={totalAbsence}
          icon={XCircle}
          color="rose"
          href="/absent-reports"
        />
        <StatCard
          title="Missing Reports"
          value={missingDailyReports}
          icon={FileWarning}
          color="amber"
          href="/daily-reports"
        />
      </div>

      {/* Charts + Menu */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChildrenPerClassChart data={classChartData} />
        <GenderStatsChart data={genderChartData} />
        <TodayMenuWidget {...todayMenu} />
      </div>

      {/* Infrastructure stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Branches"
          value={branchCount}
          icon={Building2}
          color="blue"
          href="/branches"
        />
        <StatCard
          title="Classes"
          value={classCount}
          icon={BookOpen}
          color="purple"
          href="/classes"
        />
        <StatCard
          title="Pending Absences"
          value={missingAbsentReports}
          icon={FileText}
          color="orange"
          href="/absent-reports?status=PENDING"
        />
      </div>

      {/* Attendance trend */}
      <AttendanceChart data={attendanceChartData} />

      {/* Financial, medical, messaging */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Payments"
          value={totalPayments}
          icon={DollarSign}
          color="emerald"
          href="/accounting"
        />
        <StatCard
          title="Accident Reports"
          value={accidentReports}
          icon={AlertTriangle}
          color="rose"
          href="/medical/accidents"
        />
        <StatCard
          title="Unread Messages"
          value={incomingCalls}
          icon={MessageSquare}
          color="sky"
        />
      </div>

      {/* Medical & drafts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Medical Reports"
          value={totalMedicalReports}
          icon={Stethoscope}
          color="teal"
          href="/medical/general"
        />
        <StatCard
          title="Draft Medical"
          value={missingMedicalReports}
          icon={FileMinus}
          color="amber"
        />
        <StatCard
          title="Child Drafts"
          value={totalDrafts}
          icon={FileEdit}
          color="purple"
          href="/children?status=DRAFT"
        />
      </div>
    </div>
  );
}
