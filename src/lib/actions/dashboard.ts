"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireOrg } from "@/lib/require-org";
import { getOrgBranchIds } from "@/lib/verify-org-access";
import {
  ASSESSMENT_TYPE_NAMES,
  VALID_ASSESSMENT_TYPES,
} from "@/lib/assessment-types";
import type { MedicalFormType, PaymentMethod, Prisma } from "@/generated/prisma/client";

// ── Types ──────────────────────────────────────────

export interface ActionItems {
  pendingAbsences: Array<{
    id: string;
    childName: string;
    childId: string;
    date: string;
    reason: string | null;
  }>;
  overduePayments: Array<{
    childId: string;
    childName: string;
    totalOverdue: number;
    oldestDate: string;
  }>;
  missingReportsByClass: Array<{
    className: string;
    count: number;
  }>;
  draftChildren: Array<{
    id: string;
    childName: string;
    createdAt: string;
  }>;
}

export type PillarStatus = "green" | "amber" | "red";

export interface MorningBriefing {
  attendance: { present: number; total: number; status: PillarStatus };
  reports: { submitted: number; total: number; status: PillarStatus };
  staff: { present: number; total: number; status: PillarStatus };
  finance: { overdueCount: number; overdueAmount: number; status: PillarStatus };
  health: { issues: number; status: PillarStatus };

  actionItems: ActionItems;
  totalAttentionItems: number;

  insights: Array<{ text: string; type: "positive" | "neutral" | "warning" }>;

  todayMenu: {
    breakfast: string | null;
    lunch: string | null;
    dessert: string | null;
    snack: string | null;
  };
  weeklyAttendance: Array<{ day: string; present: number; total: number }>;
}

export interface DashboardMetricFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  schoolYearId?: string | null;
}

export interface DashboardDrilldownRequestFilters {
  from?: string | null;
  to?: string | null;
  schoolYearId?: string | null;
}

interface NormalizedDashboardFilters {
  start: Date;
  endExclusive: Date;
  schoolYearId: string | null;
}

const medicalReportTypes = [
  "GENERAL",
  "CONDITIONS",
  "VISITS",
  "VACCINATIONS",
] satisfies MedicalFormType[];

type LegacyMedicalReportType = (typeof medicalReportTypes)[number];

const medicalReportConfig: Record<
  LegacyMedicalReportType,
  { label: string; baseHref: string }
> = {
  GENERAL: { label: "General Form", baseHref: "/medical/general" },
  CONDITIONS: { label: "Suffering Form", baseHref: "/medical/conditions" },
  VISITS: { label: "Medical Visit", baseHref: "/medical/visits" },
  VACCINATIONS: { label: "Vaccination Report", baseHref: "/medical/vaccinations" },
};

const assessmentTypes = [...VALID_ASSESSMENT_TYPES];

const fallbackAssessmentWindows: Record<number, { minDays: number; maxDays: number }> = {
  1: { minDays: 0, maxDays: 90 },
  2: { minDays: 91, maxDays: 243 },
  3: { minDays: 244, maxDays: 365 },
  4: { minDays: 366, maxDays: 730 },
  5: { minDays: 731, maxDays: 1095 },
  6: { minDays: 1096, maxDays: 1460 },
  7: { minDays: 1461, maxDays: 1825 },
};

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function dateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthDayKey(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function rangeDates(start: Date, endExclusive: Date): Date[] {
  const dates: Date[] = [];
  for (let day = new Date(start); day < endExclusive; day = addDays(day, 1)) {
    dates.push(new Date(day));
  }
  return dates;
}

function normalizeDashboardFilters(filters?: DashboardMetricFilters): NormalizedDashboardFilters {
  const today = startOfDay(new Date());
  const rawStart = filters?.startDate ? startOfDay(filters.startDate) : today;
  const rawEnd = filters?.endDate ? startOfDay(filters.endDate) : rawStart;
  const start = rawStart <= rawEnd ? rawStart : rawEnd;
  const end = rawStart <= rawEnd ? rawEnd : rawStart;
  const schoolYearId = filters?.schoolYearId?.trim() || null;

  return {
    start,
    endExclusive: addDays(end, 1),
    schoolYearId,
  };
}

function dateFromRequestKey(value?: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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

function metricFiltersFromRequest(
  filters?: DashboardDrilldownRequestFilters
): DashboardMetricFilters {
  return {
    startDate: dateFromRequestKey(filters?.from),
    endDate: dateFromRequestKey(filters?.to),
    schoolYearId: filters?.schoolYearId?.trim() || null,
  };
}

function dateRangeWhere(range: NormalizedDashboardFilters) {
  return { gte: range.start, lt: range.endExclusive };
}

function childScope(
  orgId: string,
  branchId: string | null | undefined,
  schoolYearId?: string | null
): Prisma.ChildWhereInput {
  return {
    ...(branchId ? { branchId } : { branch: { organizationId: orgId } }),
    ...(schoolYearId ? { schoolYearId } : {}),
  };
}

function ageInDays(dateOfBirth: Date | null, asOf: Date) {
  if (!dateOfBirth) return null;
  return Math.floor((asOf.getTime() - dateOfBirth.getTime()) / 86_400_000);
}

function isEligibleForAssessment(
  child: { dateOfBirth: Date | null; enrollmentDate: Date | null },
  asOf: Date,
  minDays: number,
  maxDays: number
) {
  const currentAge = ageInDays(child.dateOfBirth, asOf);
  if (currentAge === null || currentAge < minDays) return false;

  const joiningAge = ageInDays(child.dateOfBirth, child.enrollmentDate ?? asOf);
  return joiningAge === null || joiningAge <= maxDays;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function displayChildNumber(child: { childNumber: string | null; legacyId?: number | null; id: string }) {
  return child.childNumber?.trim() || child.legacyId?.toString() || child.id.slice(0, 8);
}

function displayChildName(child: {
  firstName: string;
  lastName: string;
  class: { name: string } | null;
}) {
  const name = `${child.firstName} ${child.lastName}`.trim();
  return child.class?.name ? `${name} (${child.class.name})` : name;
}

function hrefWithQuery(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${path}?${query.toString()}`;
}

function dateOnlyFromValue(value: unknown): string | null {
  if (value instanceof Date) return dateKey(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) return dateOnlyMatch[1];

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return dateKey(parsed);
  }

  return null;
}

function dateFromData(data: unknown, keys: string[], fallback: Date) {
  if (isRecord(data)) {
    for (const key of keys) {
      const value = dateOnlyFromValue(data[key]);
      if (value) return value;
    }
  }

  return dateKey(fallback);
}

function isLegacyMedicalReportType(type: MedicalFormType): type is LegacyMedicalReportType {
  return medicalReportTypes.includes(type as LegacyMedicalReportType);
}

// ── Main briefing function ─────────────────────────

export async function getMorningBriefing(): Promise<MorningBriefing> {
  const { organizationId: orgId } = await requireOrg();
  const orgBranchIds = await getOrgBranchIds(orgId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Build last 5 working days (Sun-Thu for nursery context, but we'll use last 5 calendar days with data)
  const last5Days: Date[] = [];
  for (let i = 0; i < 7 && last5Days.length < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip Friday and Saturday (weekend)
    const dow = d.getDay();
    if (dow !== 5 && dow !== 6) {
      last5Days.push(d);
    }
  }
  last5Days.reverse(); // oldest first

  const weekStart = last5Days[0] ?? today;
  const weekEnd = tomorrow;

  // One week ago range (for comparisons)
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);

  // 30 days ago (for health pillar — recent draft forms only)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeChildrenCount,
    todayReportCount,
    todayAbsenceCount,
    teacherCount,
    nurseCount,
    doctorCount,
    todayEmployeeAbsences,
    draftMedicalCount,
    activeHealthAlarms,
    todayFoodCalendar,
    weeklyReportCounts,
    lastWeekReportCount,
    lastWeekAbsenceCount,
    thisWeekAbsenceCount,
    chronicAbsences,
    illnessAbsences,
    actionItems,
  ] = await Promise.all([
    // 1. Active children
    db.child.count({ where: { isActive: true, isDraft: false, branch: { organizationId: orgId } } }),

    // 2. Today's daily reports
    db.dailyReport.count({
      where: { reportDate: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
    }),

    // 3. Today's absences
    db.absenceReport.count({
      where: { date: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
    }),

    // 4-5. Staff counts
    db.teacher.count({ where: { isActive: true, branch: { organizationId: orgId } } }),
    db.nurse.count({ where: { isActive: true, branch: { organizationId: orgId } } }),
    db.doctor.count({ where: { isActive: true, branch: { organizationId: orgId } } }),

    // 6. Staff absent today
    db.employeeEvent.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["SICK", "ABSENT", "DAY_OFF"] },
        branchId: { in: orgBranchIds },
      },
    }),

    // 7. Health issues — draft medical forms created in the last 30 days
    db.medicalForm.count({
      where: { status: "DRAFT", createdAt: { gte: thirtyDaysAgo }, child: { branch: { organizationId: orgId } } },
    }),

    // 7b. Active health-related alarms
    db.alarm.count({
      where: {
        isActive: true,
        type: { in: ["MEDICAL", "MEDICINE", "VACCINATION"] },
        branch: { organizationId: orgId },
      },
    }),

    // 8. Food calendar for today
    db.foodCalendar.findMany({
      where: { date: { gte: today, lt: tomorrow }, branch: { organizationId: orgId } },
      include: { food: { select: { name: true } } },
    }),

    // 9. Weekly attendance — report counts per day for last 5 working days
    db.$queryRaw<Array<{ report_date: Date; count: bigint }>>`
      SELECT dr."reportDate" as report_date, COUNT(*) as count
      FROM daily_reports dr
      JOIN children c ON dr."childId" = c.id
      JOIN branches b ON c."branchId" = b.id
      WHERE dr."reportDate" >= ${weekStart} AND dr."reportDate" < ${weekEnd}
        AND b."organizationId" = cast(${orgId} as uuid)
      GROUP BY dr."reportDate"
      ORDER BY dr."reportDate"
    `,

    // 10. Last week data for comparisons
    db.dailyReport.count({
      where: { reportDate: { gte: lastWeekStart, lt: lastWeekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    db.absenceReport.count({
      where: { date: { gte: lastWeekStart, lt: lastWeekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    // This week absences (for comparison)
    db.absenceReport.count({
      where: { date: { gte: weekStart, lt: weekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    // Chronic absences (3+ days this week)
    db.$queryRaw<Array<{ child_id: string; absence_count: bigint }>>`
      SELECT ar."childId" as child_id, COUNT(*) as absence_count
      FROM absence_reports ar
      JOIN children c ON ar."childId" = c.id
      JOIN branches b ON c."branchId" = b.id
      WHERE ar."date" >= ${weekStart} AND ar."date" < ${weekEnd}
        AND b."organizationId" = cast(${orgId} as uuid)
      GROUP BY ar."childId"
      HAVING COUNT(*) >= 3
    `,

    // Illness-related absences this week
    db.absenceReport.count({
      where: {
        date: { gte: weekStart, lt: weekEnd },
        reason: { contains: "sick", mode: "insensitive" },
        child: { branch: { organizationId: orgId } },
      },
    }),

    // 11. Action items (reuse existing logic)
    getActionItems(),
  ]);

  // Overdue payments — use aggregate instead of fetching all records
  let overdueCount = 0;
  let overdueAmount = 0;
  try {
    const overdueAgg = await db.payment.aggregate({
      where: {
        status: "OVERDUE",
        deletedAt: null,
        child: { branch: { organizationId: orgId } },
      },
      _count: true,
      _sum: { amount: true },
    });
    overdueCount = overdueAgg._count;
    overdueAmount = Number(overdueAgg._sum.amount ?? 0);
  } catch {
    // status column may not exist yet
  }

  // ── Compute pillar statuses ────────────────────

  const totalStaff = teacherCount + nurseCount + doctorCount;
  const staffPresent = totalStaff - todayEmployeeAbsences;
  const healthIssues = draftMedicalCount + activeHealthAlarms;

  const attendancePct = activeChildrenCount > 0
    ? ((todayReportCount + todayAbsenceCount) / activeChildrenCount) * 100
    : 100;
  const reportPct = activeChildrenCount > 0
    ? (todayReportCount / activeChildrenCount) * 100
    : 100;

  const attendance = {
    present: todayReportCount,
    total: activeChildrenCount,
    status: statusFromPct(attendancePct, 90, 75),
  };
  const reports = {
    submitted: todayReportCount,
    total: activeChildrenCount,
    status: statusFromPct(reportPct, 90, 70),
  };
  const staff = {
    present: Math.max(0, staffPresent),
    total: totalStaff,
    status: todayEmployeeAbsences === 0 ? "green" as const
      : todayEmployeeAbsences === 1 ? "amber" as const
      : "red" as const,
  };
  const finance = {
    overdueCount,
    overdueAmount,
    status: overdueCount === 0 ? "green" as const
      : overdueCount <= 2 ? "amber" as const
      : "red" as const,
  };
  const health = {
    issues: healthIssues,
    status: healthIssues === 0 ? "green" as const
      : healthIssues <= 2 ? "amber" as const
      : "red" as const,
  };

  // ── Count total attention items ────────────────

  const totalAttentionItems =
    actionItems.pendingAbsences.length +
    actionItems.overduePayments.length +
    (actionItems.missingReportsByClass.reduce((s, c) => s + c.count, 0) > 0 ? 1 : 0) +
    actionItems.draftChildren.length;

  // ── Insights ───────────────────────────────────

  const insights: MorningBriefing["insights"] = [];

  // Attendance trend
  const thisWeekTotal = todayReportCount; // today's count as proxy
  if (lastWeekReportCount > 0 && last5Days.length > 0) {
    const lastWeekAvg = lastWeekReportCount / 5;
    const diff = ((thisWeekTotal - lastWeekAvg) / lastWeekAvg) * 100;
    if (Math.abs(diff) >= 3) {
      insights.push({
        text: `Attendance ${diff > 0 ? "up" : "down"} ${Math.abs(Math.round(diff))}% vs last week average`,
        type: diff > 0 ? "positive" : "warning",
      });
    }
  }

  // Chronic absences
  const chronicCount = chronicAbsences.length;
  if (chronicCount > 0) {
    insights.push({
      text: `${chronicCount} ${chronicCount === 1 ? "child" : "children"} absent 3+ days this week`,
      type: "warning",
    });
  }

  // Report completion rate
  if (activeChildrenCount > 0) {
    const completionRate = Math.round((todayReportCount / activeChildrenCount) * 100);
    if (lastWeekReportCount > 0) {
      const lastWeekRate = Math.round((lastWeekReportCount / 5 / activeChildrenCount) * 100);
      const diff = completionRate - lastWeekRate;
      if (Math.abs(diff) >= 3) {
        insights.push({
          text: `Report completion: ${completionRate}% (${diff > 0 ? "up from" : "down from"} ${lastWeekRate}% last week)`,
          type: diff >= 0 ? "positive" : "warning",
        });
      } else {
        insights.push({
          text: `Report completion rate: ${completionRate}%`,
          type: completionRate >= 80 ? "positive" : "neutral",
        });
      }
    } else {
      insights.push({
        text: `Report completion rate: ${completionRate}%`,
        type: completionRate >= 80 ? "positive" : "neutral",
      });
    }
  }

  // Illness cluster
  if (illnessAbsences >= 3) {
    insights.push({
      text: `${illnessAbsences} illness-related absences this week`,
      type: "warning",
    });
  }

  // Absence trend
  if (lastWeekAbsenceCount > 0) {
    const diff = thisWeekAbsenceCount - lastWeekAbsenceCount;
    if (Math.abs(diff) >= 2) {
      insights.push({
        text: `Absences ${diff > 0 ? "up" : "down"} by ${Math.abs(diff)} vs last week`,
        type: diff > 0 ? "warning" : "positive",
      });
    }
  }

  // ── Today's menu ───────────────────────────────

  const todayMenu = {
    breakfast: todayFoodCalendar.find((c) => c.mealType === "BREAKFAST")?.food.name ?? null,
    lunch: todayFoodCalendar.find((c) => c.mealType === "LUNCH")?.food.name ?? null,
    dessert: todayFoodCalendar.find((c) => c.mealType === "DESSERT")?.food.name ?? null,
    snack: todayFoodCalendar.find((c) => c.mealType === "SNACK")?.food.name ?? null,
  };

  // ── Weekly attendance ──────────────────────────

  const reportCountMap = new Map(
    weeklyReportCounts.map((r) => [
      new Date(r.report_date).toISOString().slice(0, 10),
      Number(r.count),
    ])
  );

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyAttendance = last5Days.map((d) => ({
    day: dayNames[d.getDay()],
    present: reportCountMap.get(d.toISOString().slice(0, 10)) ?? 0,
    total: activeChildrenCount,
  }));

  return {
    attendance,
    reports,
    staff,
    finance,
    health,
    actionItems,
    totalAttentionItems,
    insights,
    todayMenu,
    weeklyAttendance,
  };
}

// ── Demographics / KPI data ──────────────────────

export interface DashboardDemographics {
  totalBranches: number;
  totalClasses: number;
  totalActiveChildren: number;
  childrenPerClass: Array<{ name: string; value: number }>;
  genderStats: Array<{ name: string; value: number }>;
}

export async function getDashboardDemographics(
  branchId?: string | null,
  filters?: Pick<DashboardMetricFilters, "schoolYearId">
): Promise<DashboardDemographics> {
  const { organizationId: orgId } = await requireOrg();

  const branchWhere = branchId ? { id: branchId, organizationId: orgId } : { organizationId: orgId };
  const classWhere = branchId ? { branchId } : { branch: { organizationId: orgId } };
  const childFilter = childScope(orgId, branchId, filters?.schoolYearId);

  const [totalBranches, totalClasses, totalActiveChildren, classCounts, genderCounts] =
    await Promise.all([
      db.branch.count({ where: branchWhere }),
      db.class.count({ where: classWhere }),
      db.child.count({
        where: { isActive: true, isDraft: false, ...childFilter },
      }),
      db.child.groupBy({
        by: ["classId"],
        where: { isActive: true, isDraft: false, ...childFilter },
        _count: true,
      }),
      db.child.groupBy({
        by: ["gender"],
        where: { isActive: true, isDraft: false, ...childFilter },
        _count: true,
      }),
    ]);

  // Resolve class names for the grouped data
  const classIds = classCounts
    .map((c) => c.classId)
    .filter((id): id is string => id !== null);

  const classes =
    classIds.length > 0
      ? await db.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : [];

  const classNameMap = new Map(classes.map((c) => [c.id, c.name]));

  const childrenPerClass = classCounts.map((c) => ({
    name: c.classId ? classNameMap.get(c.classId) ?? "Unknown" : "No Class",
    value: c._count,
  }));

  const genderStats = genderCounts.map((g) => ({
    name: g.gender === "MALE" ? "Male" : g.gender === "FEMALE" ? "Female" : g.gender ?? "Unknown",
    value: g._count,
  }));

  return { totalBranches, totalClasses, totalActiveChildren, childrenPerClass, genderStats };
}

// ── Daily Compliance Stats ────────────────────────

export interface DailyComplianceStats {
  totalAttendance: number;
  totalAbsence: number;
  missingDailyReports: number;
  missingAbsentReports: number;
}

export type DashboardDrilldownKind =
  | "payments"
  | "missingDailyReports"
  | "missingAbsentReports"
  | "medicalReports"
  | "missingMedicalReports"
  | "medicalDrafts"
  | "assessmentReports"
  | "missingAssessments"
  | "assessmentDrafts";

export type DashboardDrilldownColumn =
  | "number"
  | "name"
  | "lastName"
  | "amount"
  | "type"
  | "for"
  | "date"
  | "from"
  | "to"
  | "remarks"
  | "attachment"
  | "action";

export interface DashboardDrilldownRow {
  id: string;
  number: string;
  name: string;
  lastName?: string;
  amount?: string;
  type?: string;
  for?: string;
  date?: string;
  from?: string;
  to?: string;
  remarks?: string;
  attachmentHref?: string | null;
  attachmentLabel?: string | null;
  href: string;
  actionLabel: "Create" | "Edit" | "View" | "Print";
}

export interface DashboardDrilldown {
  title: string;
  columns: DashboardDrilldownColumn[];
  rows: DashboardDrilldownRow[];
}

export type DashboardDrilldowns = Record<DashboardDrilldownKind, DashboardDrilldown>;

export async function getDailyComplianceStats(
  branchId?: string | null,
  filters?: DashboardMetricFilters
): Promise<DailyComplianceStats> {
  const { organizationId: orgId } = await requireOrg();
  const range = normalizeDashboardFilters(filters);
  const details = await getDailyComplianceDetails(orgId, branchId, range, false);
  return details.stats;
}

interface DailyComplianceDetails {
  stats: DailyComplianceStats;
  missingDailyRows: DashboardDrilldownRow[];
  missingAbsentRows: DashboardDrilldownRow[];
}

async function getDailyComplianceDetails(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters,
  includeRows = true
): Promise<DailyComplianceDetails> {
  const reportDateRange = dateRangeWhere(range);
  const childFilter = childScope(orgId, branchId, range.schoolYearId);

  const [
    activeChildren,
    reports,
    absences,
    absentChildIds,
    absenceReportChildIds,
    holidays,
  ] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, isDraft: false, ...childFilter },
      select: {
        id: true,
        childNumber: true,
        legacyId: true,
        firstName: true,
        lastName: true,
        enrollmentDate: true,
        class: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.dailyReport.findMany({
      where: {
        reportDate: reportDateRange,
        child: childFilter,
      },
      select: { childId: true, reportDate: true },
    }),
    db.absenceReport.findMany({
      where: {
        date: reportDateRange,
        child: childFilter,
      },
      select: { childId: true, date: true },
    }),
    // Modern absence reports are the closest migrated equivalent to legacy absent daily rows.
    db.absenceReport.findMany({
      where: {
        date: reportDateRange,
        child: childFilter,
      },
      select: { childId: true, date: true, status: true },
    }),
    db.absenceReport.findMany({
      where: {
        date: reportDateRange,
        status: { in: ["APPROVED", "PENDING"] },
        child: childFilter,
      },
      select: { childId: true, date: true },
    }),
    db.holiday.findMany({
      where: {
        isActive: true,
        date: { lt: range.endExclusive },
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: range.start } },
            ],
          },
          {
            OR: [
              { branchId: null },
              {
                branch: branchId
                  ? { id: branchId }
                  : { organizationId: orgId },
              },
            ],
          },
        ],
      },
      select: { date: true, endDate: true, repeated: true },
    }),
  ]);

  const reportedKeys = new Set(reports.map((r) => `${r.childId}:${dateKey(r.reportDate)}`));
  const absentKeys = new Set(absentChildIds.map((a) => `${a.childId}:${dateKey(a.date)}`));
  const absenceReportKeys = new Set(absenceReportChildIds.map((a) => `${a.childId}:${dateKey(a.date)}`));
  const days = rangeDates(range.start, range.endExclusive);
  const holidayDateKeys = new Set<string>();
  const repeatedHolidayKeys = new Set<string>();

  for (const holiday of holidays) {
    if (holiday.repeated) {
      repeatedHolidayKeys.add(monthDayKey(holiday.date));
      continue;
    }

    const holidayEnd = startOfDay(holiday.endDate ?? holiday.date);
    for (let day = startOfDay(holiday.date); day <= holidayEnd; day = addDays(day, 1)) {
      holidayDateKeys.add(dateKey(day));
    }
  }

  const missingDailyRows: DashboardDrilldownRow[] = [];
  const missingAbsentRows: DashboardDrilldownRow[] = [];
  let missingDailyReports = 0;
  let missingAbsentReports = 0;

  for (const child of activeChildren) {
    const enrollmentDate = child.enrollmentDate ? startOfDay(child.enrollmentDate) : null;

    for (const day of days) {
      if (day.getDay() === 0) continue;
      if (holidayDateKeys.has(dateKey(day))) continue;
      if (repeatedHolidayKeys.has(monthDayKey(day))) continue;
      if (enrollmentDate && day < enrollmentDate) continue;

      const dayKey = dateKey(day);
      const key = `${child.id}:${dayKey}`;

      if (!reportedKeys.has(key) && !absentKeys.has(key)) {
        missingDailyReports++;

        if (includeRows) {
          missingDailyRows.push({
            id: `missing-daily:${key}`,
            number: displayChildNumber(child),
            name: displayChildName(child),
            date: dayKey,
            href: hrefWithQuery("/daily-reports/new", { childId: child.id, date: dayKey }),
            actionLabel: "Create",
          });
        }
      }

      if (absentKeys.has(key) && !absenceReportKeys.has(key)) {
        missingAbsentReports++;

        if (includeRows) {
          missingAbsentRows.push({
            id: `missing-absent:${key}`,
            number: displayChildNumber(child),
            name: displayChildName(child),
            date: dayKey,
            href: hrefWithQuery("/absent-reports/new", { childId: child.id, date: dayKey }),
            actionLabel: "Create",
          });
        }
      }
    }
  }

  return {
    stats: {
      totalAttendance: reports.length,
      totalAbsence: absences.length,
      missingDailyReports,
      missingAbsentReports,
    },
    missingDailyRows,
    missingAbsentRows,
  };
}

export async function getDashboardDrilldowns(
  branchId?: string | null,
  filters?: DashboardMetricFilters
): Promise<DashboardDrilldowns> {
  const { organizationId: orgId } = await requireOrg();
  const range = normalizeDashboardFilters(filters);

  const [
    complianceDetails,
    medicalDrilldowns,
    assessmentDrilldowns,
    paymentDrilldown,
  ] = await Promise.all([
    getDailyComplianceDetails(orgId, branchId, range),
    getMedicalDrilldowns(orgId, branchId, range),
    getAssessmentDrilldowns(orgId, branchId, range),
    getPaymentDrilldown(orgId, branchId, range),
  ]);

  return {
    payments: paymentDrilldown,
    missingDailyReports: {
      title: "Missing Daily Reports",
      columns: ["number", "name", "date", "action"],
      rows: complianceDetails.missingDailyRows,
    },
    missingAbsentReports: {
      title: "Missing Absent Reports",
      columns: ["number", "name", "date", "action"],
      rows: complianceDetails.missingAbsentRows,
    },
    medicalReports: medicalDrilldowns.reports,
    missingMedicalReports: medicalDrilldowns.missing,
    medicalDrafts: medicalDrilldowns.drafts,
    assessmentReports: assessmentDrilldowns.reports,
    missingAssessments: assessmentDrilldowns.missing,
    assessmentDrafts: assessmentDrilldowns.drafts,
  };
}

export async function getDashboardDrilldown(
  kind: DashboardDrilldownKind,
  filters?: DashboardDrilldownRequestFilters
): Promise<DashboardDrilldown> {
  const session = await auth();
  const { organizationId: orgId } = await requireOrg();
  const branchId = session?.user?.branchId ?? null;
  const range = normalizeDashboardFilters(metricFiltersFromRequest(filters));

  if (kind === "payments") {
    return getPaymentDrilldown(orgId, branchId, range);
  }

  if (kind === "missingDailyReports" || kind === "missingAbsentReports") {
    const details = await getDailyComplianceDetails(orgId, branchId, range);
    return kind === "missingDailyReports"
      ? {
          title: "Missing Daily Reports",
          columns: ["number", "name", "date", "action"],
          rows: details.missingDailyRows,
        }
      : {
          title: "Missing Absent Reports",
          columns: ["number", "name", "date", "action"],
          rows: details.missingAbsentRows,
        };
  }

  if (
    kind === "medicalReports" ||
    kind === "missingMedicalReports" ||
    kind === "medicalDrafts"
  ) {
    const drilldowns = await getMedicalDrilldowns(orgId, branchId, range);
    if (kind === "medicalReports") return drilldowns.reports;
    if (kind === "missingMedicalReports") return drilldowns.missing;
    return drilldowns.drafts;
  }

  const drilldowns = await getAssessmentDrilldowns(orgId, branchId, range);
  if (kind === "assessmentReports") return drilldowns.reports;
  if (kind === "missingAssessments") return drilldowns.missing;
  return drilldowns.drafts;
}

async function getMedicalDrilldowns(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters
) {
  const childFilter = childScope(orgId, branchId, range.schoolYearId);

  const [activeChildren, forms] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, isDraft: false, ...childFilter },
      select: {
        id: true,
        childNumber: true,
        legacyId: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.medicalForm.findMany({
      where: { formType: { in: medicalReportTypes }, child: childFilter },
      select: {
        id: true,
        childId: true,
        formType: true,
        status: true,
        data: true,
        createdAt: true,
        child: {
          select: {
            id: true,
            childNumber: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]);

  const covered = new Set<string>();
  const reportRows: DashboardDrilldownRow[] = [];
  const draftRows: DashboardDrilldownRow[] = [];
  const dateKeys = [
    "date",
    "datetime",
    "formDate",
    "formdate",
    "assessmentDate",
    "assessment_date",
    "visitDate",
    "visit_date",
    "vaccinationDate",
    "vaccination_date",
  ];

  for (const form of forms) {
    if (!isLegacyMedicalReportType(form.formType)) continue;

    covered.add(`${form.formType}:${form.childId}`);
    const config = medicalReportConfig[form.formType];
    const row: DashboardDrilldownRow = {
      id: `medical:${form.id}`,
      number: displayChildNumber(form.child),
      name: displayChildName(form.child),
      type: config.label,
      date: dateFromData(form.data, dateKeys, form.createdAt),
      href: `${config.baseHref}/${form.id}`,
      actionLabel: form.status === "DRAFT" ? "Edit" : "View",
    };

    if (form.status === "DRAFT") {
      draftRows.push(row);
    } else if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
      reportRows.push(row);
    }
  }

  const missingRows: DashboardDrilldownRow[] = [];
  for (const child of activeChildren) {
    for (const type of medicalReportTypes) {
      if (covered.has(`${type}:${child.id}`)) continue;

      const config = medicalReportConfig[type];
      missingRows.push({
        id: `missing-medical:${type}:${child.id}`,
        number: displayChildNumber(child),
        name: displayChildName(child),
        type: config.label,
        href: hrefWithQuery(`${config.baseHref}/new`, { childId: child.id }),
        actionLabel: "Create",
      });
    }
  }

  return {
    reports: {
      title: "Medical Reports",
      columns: ["number", "name", "type", "date", "action"],
      rows: reportRows,
    },
    missing: {
      title: "Missing Medical Reports",
      columns: ["number", "name", "type", "action"],
      rows: missingRows,
    },
    drafts: {
      title: "Medical Reports - Drafts",
      columns: ["number", "name", "type", "date", "action"],
      rows: draftRows,
    },
  } satisfies Record<"reports" | "missing" | "drafts", DashboardDrilldown>;
}

async function getAssessmentDrilldowns(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters
) {
  const childFilter = childScope(orgId, branchId, range.schoolYearId);

  const [activeChildren, assessments, scheduleRules] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, isDraft: false, ...childFilter },
      select: {
        id: true,
        childNumber: true,
        legacyId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        enrollmentDate: true,
        class: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.assessment.findMany({
      where: {
        assessmentType: { in: assessmentTypes },
        child: childFilter,
        ...(range.schoolYearId ? { schoolYearId: range.schoolYearId } : {}),
      },
      select: {
        id: true,
        childId: true,
        assessmentType: true,
        status: true,
        data: true,
        createdAt: true,
        child: {
          select: {
            id: true,
            childNumber: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    db.assessmentScheduleRule.findMany({
      where: { organizationId: orgId, assessmentType: { in: assessmentTypes } },
      select: { assessmentType: true, minimumAgeDays: true, maximumAgeDays: true },
    }),
  ]);

  const ruleByType = new Map(
    scheduleRules.map((rule) => [
      rule.assessmentType,
      {
        minDays: Number(rule.minimumAgeDays ?? fallbackAssessmentWindows[rule.assessmentType]?.minDays ?? 0),
        maxDays: Number(
          rule.maximumAgeDays ??
            fallbackAssessmentWindows[rule.assessmentType]?.maxDays ??
            Number.MAX_SAFE_INTEGER
        ),
      },
    ])
  );
  const covered = new Set(assessments.map((assessment) => `${assessment.assessmentType}:${assessment.childId}`));
  const reportRows: DashboardDrilldownRow[] = [];
  const draftRows: DashboardDrilldownRow[] = [];
  const dateKeys = ["date", "datetime", "assessmentDate", "assessment_date", "created_at"];

  for (const assessment of assessments) {
    const typeLabel =
      ASSESSMENT_TYPE_NAMES[assessment.assessmentType] ?? `Type ${assessment.assessmentType}`;
    const row: DashboardDrilldownRow = {
      id: `assessment:${assessment.id}`,
      number: displayChildNumber(assessment.child),
      name: displayChildName(assessment.child),
      type: typeLabel,
      date: dateFromData(assessment.data, dateKeys, assessment.createdAt),
      href: `/assessments/${assessment.assessmentType}/${assessment.id}`,
      actionLabel: assessment.status === "DRAFT" ? "Edit" : "View",
    };

    if (assessment.status === "DRAFT") {
      draftRows.push(row);
    } else if (assessment.status === "SUBMITTED" || assessment.status === "REVIEWED") {
      reportRows.push(row);
    }
  }

  const today = startOfDay(new Date());
  const missingRows: DashboardDrilldownRow[] = [];
  for (const type of assessmentTypes) {
    const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];
    for (const child of activeChildren) {
      if (!isEligibleForAssessment(child, today, window.minDays, window.maxDays)) continue;
      if (covered.has(`${type}:${child.id}`)) continue;

      missingRows.push({
        id: `missing-assessment:${type}:${child.id}`,
        number: displayChildNumber(child),
        name: displayChildName(child),
        type: ASSESSMENT_TYPE_NAMES[type] ?? `Type ${type}`,
        href: hrefWithQuery(`/assessments/${type}/new`, { childId: child.id }),
        actionLabel: "Create",
      });
    }
  }

  return {
    reports: {
      title: "Assessment Reports",
      columns: ["number", "name", "type", "date", "action"],
      rows: reportRows,
    },
    missing: {
      title: "Missing Assessment Reports",
      columns: ["number", "name", "type", "action"],
      rows: missingRows,
    },
    drafts: {
      title: "Assessment Reports - Drafts",
      columns: ["number", "name", "type", "date", "action"],
      rows: draftRows,
    },
  } satisfies Record<"reports" | "missing" | "drafts", DashboardDrilldown>;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CHECK: "Cheque",
  CREDIT_CARD: "Credit Card",
  TRANSFER: "by Bank Transfer",
};

function monthName(month: number | null) {
  if (!month || month < 1 || month > 12) return "-";
  return new Date(1990, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

function formatPaymentAmount(amount: { toString(): string }, currency: string) {
  const value = Number(amount.toString());
  if (currency === "LBP") return `LL ${value.toLocaleString("en-US")}`;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function getPaymentDrilldown(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters
): Promise<DashboardDrilldown> {
  const childFilter = childScope(orgId, branchId, range.schoolYearId);
  const payments = await db.payment.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      date: dateRangeWhere(range),
      child: childFilter,
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      date: true,
      dateFrom: true,
      dateTo: true,
      month: true,
      method: true,
      notes: true,
      receiptFilename: true,
      receiptFileUrl: true,
      legacyImageFilename: true,
      child: {
        select: {
          id: true,
          childNumber: true,
          legacyId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const rows = payments
    .sort((a, b) => {
      const aNumber = displayChildNumber(a.child);
      const bNumber = displayChildNumber(b.child);
      return (
        aNumber.localeCompare(bNumber, undefined, { numeric: true }) ||
        a.date.getTime() - b.date.getTime()
      );
    })
    .map((payment): DashboardDrilldownRow => {
      const attachmentLabel =
        payment.receiptFileUrl
          ? "View Attachment"
          : payment.receiptFilename ?? payment.legacyImageFilename ?? null;

      return {
        id: `payment:${payment.id}`,
        number: displayChildNumber(payment.child),
        name: payment.child.firstName,
        lastName: payment.child.lastName,
        amount: formatPaymentAmount(payment.amount, payment.currency),
        for: monthName(payment.month),
        type: paymentMethodLabels[payment.method],
        date: dateKey(payment.date),
        from: payment.dateFrom ? dateKey(payment.dateFrom) : "-",
        to: payment.dateTo ? dateKey(payment.dateTo) : "-",
        remarks: payment.notes?.trim() || "-",
        attachmentHref: payment.receiptFileUrl,
        attachmentLabel,
        href: `/accounting/invoice/${payment.id}`,
        actionLabel: "Print",
      };
    });

  return {
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
    rows,
  };
}

// ── Action Center Metrics (9-Grid) ───────────────

export interface ActionCenterMetrics {
  totalPayments: number;
  accidentReports: number;
  loggedCalls: number;
  completedMedicalVisits: number;
  missingMedicalVisits: number;
  completedAssessments: number;
  missingAssessments: number;
  pendingDailyReports: number;
  pendingMedicalReports: number;
  pendingAssessments: number;
}

export async function getActionCenterMetrics(
  branchId?: string | null,
  filters?: DashboardMetricFilters
): Promise<ActionCenterMetrics> {
  const { organizationId: orgId } = await requireOrg();
  const range = normalizeDashboardFilters(filters);
  const rangeWhere = dateRangeWhere(range);
  const childFilter = childScope(orgId, branchId, range.schoolYearId);
  const assessmentWhere: Prisma.AssessmentWhereInput = {
    child: childFilter,
    ...(range.schoolYearId ? { schoolYearId: range.schoolYearId } : {}),
  };
  const medicalReportWhere: Prisma.MedicalFormWhereInput = {
    formType: { in: medicalReportTypes },
    child: childFilter,
  };

  const [
    paymentsAgg,
    accidentReports,
    loggedCalls,
    completedMedicalVisits,
    missingMedicalVisits,
    completedAssessments,
    missingAssessments,
    pendingDailyReports,
    pendingMedicalReports,
    pendingAssessments,
  ] = await Promise.all([
    // 1. Total payments collected
    db.payment.aggregate({
      where: { status: "PAID", deletedAt: null, date: rangeWhere, child: childFilter },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: null } })),

    // 2. Accident reports
    db.medicalForm.count({
      where: {
        formType: "ACCIDENTS",
        status: { in: ["SUBMITTED", "REVIEWED"] },
        createdAt: rangeWhere,
        child: childFilter,
      },
    }),

    // 3. Logged calls
    db.callLog.count({
      where: { date: rangeWhere, isDraft: false, child: childFilter },
    }),

    // 4. Completed medical reports
    db.medicalForm.count({
      where: { ...medicalReportWhere, status: { in: ["SUBMITTED", "REVIEWED"] } },
    }),

    // 5. Missing medical reports (active children without each legacy medical family)
    countMissingMedicalReports(orgId, branchId, range),

    // 6. Completed assessments (SUBMITTED)
    db.assessment.count({
      where: { status: { in: ["SUBMITTED", "REVIEWED"] }, ...assessmentWhere },
    }),

    // 7. Missing assessments (active children without a submitted assessment)
    countMissingAssessments(orgId, branchId, range),

    // 8. Pending daily reports (DRAFT)
    db.dailyReport.count({
      where: { status: "DRAFT", reportDate: rangeWhere, child: childFilter },
    }),

    // 9. Pending medical reports (DRAFT)
    db.medicalForm.count({
      where: { ...medicalReportWhere, status: "DRAFT" },
    }),

    // 10. Pending assessments (DRAFT)
    db.assessment.count({
      where: { status: "DRAFT", ...assessmentWhere },
    }),
  ]);

  return {
    totalPayments: Number(paymentsAgg._sum.amount ?? 0),
    accidentReports,
    loggedCalls,
    completedMedicalVisits,
    missingMedicalVisits,
    completedAssessments,
    missingAssessments,
    pendingDailyReports,
    pendingMedicalReports,
    pendingAssessments,
  };
}

async function countMissingMedicalReports(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters
): Promise<number> {
  const childFilter = childScope(orgId, branchId, range.schoolYearId);

  const [activeChildren, forms] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, isDraft: false, ...childFilter },
      select: { id: true },
    }),
    db.medicalForm.findMany({
      where: { formType: { in: medicalReportTypes }, child: childFilter },
      select: { childId: true, formType: true },
    }),
  ]);

  const covered = new Set(forms.map((form) => `${form.formType}:${form.childId}`));
  let missing = 0;

  for (const child of activeChildren) {
    for (const type of medicalReportTypes) {
      if (!covered.has(`${type}:${child.id}`)) {
        missing++;
      }
    }
  }

  return missing;
}

async function countMissingAssessments(
  orgId: string,
  branchId: string | null | undefined,
  range: NormalizedDashboardFilters
): Promise<number> {
  const childFilter = childScope(orgId, branchId, range.schoolYearId);

  const [activeChildren, assessments, scheduleRules] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, isDraft: false, ...childFilter },
      select: { id: true, dateOfBirth: true, enrollmentDate: true },
    }),
    db.assessment.findMany({
      where: {
        assessmentType: { in: assessmentTypes },
        child: childFilter,
        ...(range.schoolYearId ? { schoolYearId: range.schoolYearId } : {}),
      },
      select: { childId: true, assessmentType: true },
    }),
    db.assessmentScheduleRule.findMany({
      where: { organizationId: orgId, assessmentType: { in: assessmentTypes } },
      select: { assessmentType: true, minimumAgeDays: true, maximumAgeDays: true },
    }),
  ]);

  const ruleByType = new Map(
    scheduleRules.map((rule) => [
      rule.assessmentType,
      {
        minDays: Number(rule.minimumAgeDays ?? fallbackAssessmentWindows[rule.assessmentType]?.minDays ?? 0),
        maxDays: Number(
          rule.maximumAgeDays ??
            fallbackAssessmentWindows[rule.assessmentType]?.maxDays ??
            Number.MAX_SAFE_INTEGER
        ),
      },
    ])
  );
  const assessed = new Set(assessments.map((assessment) => `${assessment.assessmentType}:${assessment.childId}`));
  const today = startOfDay(new Date());
  let missing = 0;

  for (const type of assessmentTypes) {
    const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];
    for (const child of activeChildren) {
      if (!isEligibleForAssessment(child, today, window.minDays, window.maxDays)) continue;
      if (!assessed.has(`${type}:${child.id}`)) {
        missing++;
      }
    }
  }

  return missing;
}

// ── Helpers ──────────────────────────────────────

function statusFromPct(pct: number, greenThreshold: number, amberThreshold: number): PillarStatus {
  if (pct >= greenThreshold) return "green";
  if (pct >= amberThreshold) return "amber";
  return "red";
}

// ── Action items (internal helper, also exported for reuse) ──

export async function getActionItems(): Promise<ActionItems> {
  const { organizationId: orgId } = await requireOrg();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingAbsencesRaw, activeChildren, todayReports, draftChildrenRaw] =
    await Promise.all([
      db.absenceReport.findMany({
        where: { status: "PENDING", child: { branch: { organizationId: orgId } } },
        include: { child: true },
        take: 5,
        orderBy: { date: "desc" },
      }),

      db.child.findMany({
        where: { isActive: true, isDraft: false, branch: { organizationId: orgId } },
        select: { id: true, class: { select: { name: true } } },
      }),

      db.dailyReport.findMany({
        where: { reportDate: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
        select: { childId: true },
      }),

      db.child.findMany({
        where: { isDraft: true, branch: { organizationId: orgId } },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Overdue payments — separate because status column may not exist in DB yet
  let overduePaymentsRaw: Array<{
    childId: string;
    amount: { toNumber(): number };
    date: Date;
    child: { firstName: string; lastName: string };
  }> = [];
  try {
    const raw = await db.payment.findMany({
      where: {
        status: "OVERDUE",
        deletedAt: null,
        child: { branch: { organizationId: orgId } },
      },
      include: { child: true },
      take: 20,
    });
    overduePaymentsRaw = raw as typeof overduePaymentsRaw;
  } catch {
    // Column missing — skip
  }

  // Pending absences
  const pendingAbsences = pendingAbsencesRaw.map((a) => ({
    id: a.id,
    childName: `${a.child.firstName} ${a.child.lastName}`,
    childId: a.childId,
    date: a.date.toISOString().slice(0, 10),
    reason: a.reason,
  }));

  // Overdue payments — group by child
  const paymentsByChild = new Map<string, { childName: string; total: number; oldest: Date }>();
  for (const p of overduePaymentsRaw) {
    const existing = paymentsByChild.get(p.childId);
    const amount = p.amount.toNumber();
    if (existing) {
      existing.total += amount;
      if (p.date < existing.oldest) existing.oldest = p.date;
    } else {
      paymentsByChild.set(p.childId, {
        childName: `${p.child.firstName} ${p.child.lastName}`,
        total: amount,
        oldest: p.date,
      });
    }
  }
  const overduePayments = Array.from(paymentsByChild.entries())
    .map(([childId, data]) => ({
      childId,
      childName: data.childName,
      totalOverdue: data.total,
      oldestDate: data.oldest.toISOString().slice(0, 10),
    }))
    .slice(0, 5);

  // Missing reports by class
  const reportedChildIds = new Set(todayReports.map((r) => r.childId));
  const missingByClass = new Map<string, number>();
  for (const child of activeChildren) {
    if (!reportedChildIds.has(child.id)) {
      const className = child.class?.name ?? "No Class";
      missingByClass.set(className, (missingByClass.get(className) ?? 0) + 1);
    }
  }
  const missingReportsByClass = Array.from(missingByClass.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count);

  // Draft children
  const draftChildren = draftChildrenRaw.map((c) => ({
    id: c.id,
    childName: `${c.firstName} ${c.lastName}`,
    createdAt: c.createdAt.toISOString().slice(0, 10),
  }));

  return { pendingAbsences, overduePayments, missingReportsByClass, draftChildren };
}
