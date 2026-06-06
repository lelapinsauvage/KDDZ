"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import {
  ASSESSMENT_CONFIGS,
  ASSESSMENT_TYPE_NAMES,
  VALID_ASSESSMENT_TYPES,
} from "@/lib/assessment-types";
import type { AgeUnit, MedicalFormType, Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// ClassDashboard types & action
// ---------------------------------------------------------------------------

export interface ClassDashboardData {
  selectedSchoolYear: {
    id: string;
    label: string;
  } | null;
  classInfo: {
    id: string;
    name: string;
    branchName: string;
    language: string | null;
    studentCount: number;
    maxStudents: number;
    maleCount: number;
    femaleCount: number;
  };
  dailyReports: {
    birthdays: number;
    withoutReport: number;
    completed: number;
    incomplete: number;
    drafts: number;
    rows: ClassDailyReportRow[];
    absentRows: ClassAbsentReportRow[];
  };
  medical: {
    published: number;
    missing: number;
    drafts: number;
    categories: ClassMedicalBreakdown[];
  };
  assessments: {
    completed: number;
    missing: number;
    incomplete: number;
    drafts: number;
    categories: ClassAssessmentBreakdown[];
  };
}

export interface ClassDailyReportRow {
  childId: string;
  reportId: string | null;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  attendanceStatus: string;
  reportStatus: "No Report" | "Completed Report" | "Incomplete Report" | "Draft Report";
  actionHref: string;
}

export interface ClassAbsentReportRow {
  childId: string;
  reportId: string;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  reason: string | null;
  from: string | null;
  to: string | null;
  reportStatus: "Pending Report" | "Completed Report" | "Rejected Report";
  actionHref: string;
}

export interface ClassMedicalBreakdown {
  key: string;
  label: string;
  completed: number;
  missing: number | null;
  drafts: number;
  href: string;
  createHref: string | null;
}

export interface ClassAssessmentBreakdown {
  type: number;
  label: string;
  completed: number;
  missing: number;
  incomplete: number;
  drafts: number;
  rows: ClassAssessmentRow[];
  href: string;
}

export interface ClassAssessmentRow {
  childId: string;
  assessmentId: string | null;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  currentAge: string;
  joiningAge: string;
  reportStatus:
    | "No Assessment"
    | "Completed Assessment"
    | "Incomplete Assessment"
    | "Draft Assessment";
  actionHref: string;
}

const assessmentTypes = [...VALID_ASSESSMENT_TYPES];

const medicalBreakdownConfig: Array<{
  key: string;
  label: string;
  formType?: MedicalFormType;
  href: string;
  createHref: string | null;
  todayOnly?: boolean;
  sufferingOnly?: boolean;
}> = [
  {
    key: "general",
    label: "General Form",
    formType: "GENERAL",
    href: "/medical/general",
    createHref: "/medical/general/new",
  },
  {
    key: "suffering",
    label: "Suffering Form",
    formType: "CONDITIONS",
    href: "/medical/suffering",
    createHref: "/medical/suffering/new",
    sufferingOnly: true,
  },
  {
    key: "visits",
    label: "Medical Visits",
    formType: "VISITS",
    href: "/medical/visits",
    createHref: "/medical/visits/new",
  },
  {
    key: "vaccinations",
    label: "Vaccination Reports",
    href: "/medical/vaccinations",
    createHref: "/medical/vaccinations/new",
  },
  {
    key: "accidents",
    label: "Accident Reports Today",
    formType: "ACCIDENTS",
    href: "/medical/accidents",
    createHref: "/medical/accidents/new",
    todayOnly: true,
  },
  {
    key: "calls",
    label: "Incoming/Outgoing Calls Today",
    href: "/calls",
    createHref: null,
    todayOnly: true,
  },
];

const fallbackAssessmentWindows: Record<number, { minDays: number; maxDays: number }> = {
  1: { minDays: 0, maxDays: 90 },
  2: { minDays: 91, maxDays: 243 },
  3: { minDays: 244, maxDays: 365 },
  4: { minDays: 366, maxDays: 730 },
  5: { minDays: 731, maxDays: 1095 },
  6: { minDays: 1096, maxDays: 1460 },
  7: { minDays: 1461, maxDays: 1825 },
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateString(date: Date | null | undefined) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function monthDayKey(date: Date) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function ageInDays(dateOfBirth: Date | null, asOf: Date) {
  if (!dateOfBirth) return null;
  return Math.floor((asOf.getTime() - dateOfBirth.getTime()) / 86_400_000);
}

function formatAge(from: Date | null, to: Date | null) {
  if (!from || !to || to < from) return "-";

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += previousMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years}y ${months}m ${days}d`;
}

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function legacyDailyProgress(value: Prisma.JsonValue | null | undefined) {
  const payload = jsonObject(value);
  const raw = payload?.d_progress_all ?? payload?.progress ?? payload?.d_progress;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw);
  }

  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }

  return null;
}

function legacyNumber(value: Prisma.JsonValue | null | undefined, ...keys: string[]) {
  const payload = jsonObject(value);
  if (!payload) return null;

  for (const key of keys) {
    const raw = payload[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function assessmentProgressPercent(data: Prisma.JsonValue | null | undefined, type: number) {
  const config = ASSESSMENT_CONFIGS[type];
  const payload = jsonObject(data);
  if (!config || !payload) return null;

  const criteria = config.categories
    .filter((category) => !category.isRedFlags)
    .flatMap((category) => category.criteria);

  if (criteria.length === 0) return null;

  const answered = criteria.filter((criterion) => {
    const value = payload[criterion.key];
    return typeof value === "number" && value !== 0;
  }).length;

  return Math.round((answered / criteria.length) * 100);
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

function schoolYearLookupValues(label: string) {
  const values = new Set([label]);
  const startYear = label.match(/\b(\d{4})\b/)?.[1];
  if (startYear) values.add(startYear);
  return [...values];
}

async function resolveClassDashboardSchoolYear(
  organizationId: string,
  schoolYearId?: string | null
) {
  const selectedSchoolYear = schoolYearId
    ? await db.schoolYear.findFirst({
        where: { id: schoolYearId, organizationId },
        select: { id: true, label: true, sourceDatabase: true },
      })
    : await db.schoolYear.findFirst({
        where: { organizationId, isActive: true },
        select: { id: true, label: true, sourceDatabase: true },
        orderBy: { startDate: "desc" },
      }) ??
      (await db.schoolYear.findFirst({
        where: { organizationId },
        select: { id: true, label: true, sourceDatabase: true },
        orderBy: { startDate: "desc" },
      }));

  if (!selectedSchoolYear) {
    return { selectedSchoolYear: null, legacyMedicalVisitDbIds: [] as number[] };
  }

  if (!schoolYearId) {
    const selectedYearDbs = await db.legacyYearDatabase.findMany({
      where: {
        legacyTable: "year_db",
        isSelected: true,
        ...(selectedSchoolYear.sourceDatabase
          ? { sourceDatabase: selectedSchoolYear.sourceDatabase }
          : {}),
      },
      select: { legacyId: true },
    });
    if (selectedYearDbs.length > 0) {
      return {
        selectedSchoolYear,
        legacyMedicalVisitDbIds: selectedYearDbs.map((row) => row.legacyId),
      };
    }
  }

  const yearSelectRows = await db.legacyYearDatabase.findMany({
    where: {
      legacyTable: "year_select",
      selectedYear: { in: schoolYearLookupValues(selectedSchoolYear.label) },
      ...(selectedSchoolYear.sourceDatabase
        ? { sourceDatabase: selectedSchoolYear.sourceDatabase }
        : {}),
    },
    select: { legacyId: true },
  });

  const yearSelectIds = yearSelectRows.map((row) => row.legacyId);
  if (yearSelectIds.length === 0) {
    return { selectedSchoolYear, legacyMedicalVisitDbIds: [] as number[] };
  }

  const yearDbRows = await db.legacyYearDatabase.findMany({
    where: {
      legacyTable: "year_db",
      legacyYearId: { in: yearSelectIds },
      ...(selectedSchoolYear.sourceDatabase
        ? { sourceDatabase: selectedSchoolYear.sourceDatabase }
        : {}),
    },
    select: { legacyId: true },
  });

  return {
    selectedSchoolYear,
    legacyMedicalVisitDbIds: yearDbRows.map((row) => row.legacyId),
  };
}

function matchesLegacyMedicalVisitYear(
  data: Prisma.JsonValue | null | undefined,
  legacyDbIds: number[]
) {
  if (legacyDbIds.length === 0) return true;

  const legacyDbId = legacyNumber(data, "db_id");
  if (legacyDbId === null) return true;

  return legacyDbIds.includes(legacyDbId);
}

export async function getClassDashboard(
  classId: string,
  params: { schoolYearId?: string | null } = {}
): Promise<{ success: true; data: ClassDashboardData } | { success: false; error: string }> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const cls = await db.class.findUnique({
      where: { id: classId },
      include: {
        branch: { select: { name: true, organizationId: true } },
        _count: { select: { children: true } },
      },
    });

    if (!cls || cls.branch.organizationId !== orgId) {
      return { success: false, error: "Class not found" };
    }

    const { selectedSchoolYear, legacyMedicalVisitDbIds } =
      await resolveClassDashboardSchoolYear(orgId, params.schoolYearId);

    // Active children in this class
    const activeChildren = await db.child.findMany({
      where: { classId, isActive: true, isDraft: false },
      select: {
        id: true,
        childNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        enrollmentDate: true,
        gender: true,
      },
      orderBy: [{ childNumber: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    });

    const activeChildIds = activeChildren.map((c) => c.id);
    const activeStudentCount = activeChildren.length;
    const maleCount = activeChildren.filter((child) => child.gender === "MALE").length;
    const femaleCount = activeChildren.filter((child) => child.gender === "FEMALE").length;

    const today = startOfToday();
    const tomorrow = addDays(today, 1);

    // Legacy class dashboard counts birthdays in the next seven calendar days.
    const birthdayWindow = new Set(
      Array.from({ length: 7 }, (_, index) => monthDayKey(addDays(today, index)))
    );
    const birthdays = activeChildren.filter((c) => {
      if (!c.dateOfBirth) return false;
      return birthdayWindow.has(monthDayKey(new Date(c.dateOfBirth)));
    }).length;

    if (activeChildIds.length === 0) {
      return {
        success: true,
        data: {
          selectedSchoolYear,
          classInfo: {
            id: cls.id,
            name: cls.name,
            branchName: cls.branch.name,
            language: cls.language,
            studentCount: activeStudentCount,
            maxStudents: cls.maxStudents || cls.capacity,
            maleCount,
            femaleCount,
          },
          dailyReports: {
            birthdays,
            withoutReport: 0,
            completed: 0,
            incomplete: 0,
            drafts: 0,
            rows: [],
            absentRows: [],
          },
          medical: {
            published: 0,
            missing: 0,
            drafts: 0,
            categories: medicalBreakdownConfig.map((item) => ({
              key: item.key,
              label: item.label,
              completed: 0,
              missing: item.key === "calls" || item.todayOnly ? null : 0,
              drafts: 0,
              href: item.href,
              createHref: item.createHref,
            })),
          },
          assessments: {
            completed: 0,
            missing: 0,
            incomplete: 0,
            drafts: 0,
            categories: assessmentTypes.map((type) => ({
              type,
              label: ASSESSMENT_TYPE_NAMES[type],
              completed: 0,
              missing: 0,
              incomplete: 0,
              drafts: 0,
              rows: [],
              href: `/assessments/${type}`,
            })),
          },
        },
      };
    }

    const childFilter = { childId: { in: activeChildIds } };

    const [
      todayReports,
      todayAbsenceReports,
      medicalForms,
      vaccinations,
      todayCalls,
      assessments,
      scheduleRules,
    ] = await Promise.all([
      db.dailyReport.findMany({
        where: { ...childFilter, reportDate: { gte: today, lt: tomorrow } },
        select: { id: true, childId: true, status: true, legacyData: true },
      }),
      db.absenceReport.findMany({
        where: {
          ...childFilter,
          OR: [
            { date: { gte: today, lt: tomorrow } },
            { AND: [{ absentFrom: { lte: today } }, { absentTo: { gte: today } }] },
          ],
        },
        select: {
          id: true,
          childId: true,
          reason: true,
          absentFrom: true,
          absentTo: true,
          status: true,
          child: {
            select: {
              childNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      db.medicalForm.findMany({
        where: { ...childFilter },
        select: { id: true, childId: true, formType: true, status: true, data: true, createdAt: true },
      }),
      db.vaccination.findMany({
        where: { ...childFilter },
        select: { id: true, childId: true },
      }),
      db.callLog.findMany({
        where: { ...childFilter, date: { gte: today, lt: tomorrow } },
        select: { id: true, childId: true, isDraft: true },
      }),
      db.assessment.findMany({
        where: { ...childFilter, assessmentType: { in: assessmentTypes } },
        select: {
          id: true,
          childId: true,
          assessmentType: true,
          status: true,
          data: true,
        },
      }),
      db.assessmentScheduleRule.findMany({
        where: { organizationId: orgId, assessmentType: { in: assessmentTypes } },
        select: { assessmentType: true, minimumAgeDays: true, maximumAgeDays: true },
      }),
    ]);

    const reportByChildId = new Map(todayReports.map((report) => [report.childId, report]));
    const reportedChildIds = new Set(todayReports.map((report) => report.childId));
    const withoutReport = activeChildIds.filter((id) => !reportedChildIds.has(id)).length;

    const completed = todayReports.filter((report) => {
      if (report.status !== "SUBMITTED") return false;
      const progress = legacyDailyProgress(report.legacyData);
      return progress === null || progress >= 100;
    }).length;
    const incomplete = todayReports.filter((report) => {
      if (report.status !== "SUBMITTED") return false;
      const progress = legacyDailyProgress(report.legacyData);
      return progress !== null && progress < 100;
    }).length;
    const draftReports = todayReports.filter((report) => report.status === "DRAFT").length;

    const absenceChildIds = new Set(todayAbsenceReports.map((report) => report.childId));
    const dailyRows: ClassDailyReportRow[] = activeChildren.map((child) => {
      const report = reportByChildId.get(child.id);
      const hasAbsence = absenceChildIds.has(child.id);
      const progress = legacyDailyProgress(report?.legacyData);
      const isIncomplete = report?.status === "SUBMITTED" && progress !== null && progress < 100;

      const reportStatus =
        isIncomplete
          ? "Incomplete Report"
          : report?.status === "SUBMITTED"
          ? "Completed Report"
          : report?.status === "DRAFT"
            ? "Draft Report"
            : "No Report";

      const attendanceStatus =
        hasAbsence
          ? "Absent"
          : isIncomplete
            ? "Incomplete"
            : report?.status === "SUBMITTED"
              ? "Present"
              : report?.status === "DRAFT"
                ? "Draft"
                : "-";

      return {
        childId: child.id,
        reportId: report?.id ?? null,
        childNumber: child.childNumber,
        firstName: child.firstName,
        lastName: child.lastName,
        attendanceStatus,
        reportStatus,
        actionHref:
          report?.id && report.status === "DRAFT"
            ? `/daily-reports/${report.id}/edit`
            : report?.id
              ? `/daily-reports/${report.id}`
              : `/daily-reports/new?childId=${child.id}`,
      };
    });

    const absentRows: ClassAbsentReportRow[] = todayAbsenceReports.map((report) => ({
      childId: report.childId,
      reportId: report.id,
      childNumber: report.child.childNumber,
      firstName: report.child.firstName,
      lastName: report.child.lastName,
      reason: report.reason,
      from: toDateString(report.absentFrom),
      to: toDateString(report.absentTo),
      reportStatus:
        report.status === "APPROVED"
          ? "Completed Report"
          : report.status === "REJECTED"
            ? "Rejected Report"
            : "Pending Report",
      actionHref:
        report.status === "PENDING"
          ? `/absent-reports/${report.id}/edit`
          : `/absent-reports/${report.id}`,
    }));

    const medicalCategories = medicalBreakdownConfig.map((config) => {
      if (config.key === "calls") {
        const submittedCalls = todayCalls.filter((call) => !call.isDraft).length;
        const draftCalls = todayCalls.filter((call) => call.isDraft).length;

        return {
          key: config.key,
          label: config.label,
          completed: submittedCalls,
          missing: null,
          drafts: draftCalls,
          href: `${config.href}?class=${classId}`,
          createHref: config.createHref,
        };
      }

      if (config.key === "vaccinations") {
        const coveredChildIds = new Set(vaccinations.map((vaccination) => vaccination.childId));
        return {
          key: config.key,
          label: config.label,
          completed: vaccinations.length,
          missing: Math.max(0, activeStudentCount - coveredChildIds.size),
          drafts: 0,
          href: config.href,
          createHref: config.createHref,
        };
      }

      const forms = medicalForms.filter((form) => {
        if (form.formType !== config.formType) return false;
        if (
          config.formType === "VISITS" &&
          !matchesLegacyMedicalVisitYear(form.data, legacyMedicalVisitDbIds)
        ) {
          return false;
        }
        if (config.todayOnly && (form.createdAt < today || form.createdAt >= tomorrow)) return false;
        if (config.sufferingOnly) {
          const data = jsonObject(form.data);
          return data?.formSubType === "SUFFERING";
        }
        return true;
      });

      const coveredChildIds = new Set(forms.map((form) => form.childId));
      const completedCount = forms.filter((form) => form.status === "SUBMITTED" || form.status === "REVIEWED").length;
      const drafts = forms.filter((form) => form.status === "DRAFT").length;

      return {
        key: config.key,
        label: config.label,
        completed: completedCount,
        missing: config.todayOnly ? null : Math.max(0, activeStudentCount - coveredChildIds.size),
        drafts,
        href: config.href,
        createHref: config.createHref,
      };
    });

    const ruleByType = new Map(
      scheduleRules.map((rule) => [
        rule.assessmentType,
        {
          minDays: Number(rule.minimumAgeDays ?? fallbackAssessmentWindows[rule.assessmentType]?.minDays ?? 0),
          maxDays: Number(rule.maximumAgeDays ?? fallbackAssessmentWindows[rule.assessmentType]?.maxDays ?? Number.MAX_SAFE_INTEGER),
        },
      ])
    );

    const assessmentsByType = new Map<number, typeof assessments>();
    for (const assessment of assessments) {
      const current = assessmentsByType.get(assessment.assessmentType) ?? [];
      current.push(assessment);
      assessmentsByType.set(assessment.assessmentType, current);
    }

    const assessmentCategories: ClassAssessmentBreakdown[] = assessmentTypes.map((type) => {
      const records = assessmentsByType.get(type) ?? [];
      const recordsByChildId = new Map<string, typeof records>();
      for (const record of records) {
        const current = recordsByChildId.get(record.childId) ?? [];
        current.push(record);
        recordsByChildId.set(record.childId, current);
      }

      const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];
      const eligibleChildren = activeChildren.filter((child) =>
        isEligibleForAssessment(child, today, window.minDays, window.maxDays)
      );

      let completedCount = 0;
      let incompleteCount = 0;
      let drafts = 0;
      const rows: ClassAssessmentRow[] = [];

      for (const child of activeChildren) {
        const childRecords = recordsByChildId.get(child.id) ?? [];
        const sortedRecords = [...childRecords].sort((a, b) => {
          if (a.status === "DRAFT" && b.status !== "DRAFT") return 1;
          if (a.status !== "DRAFT" && b.status === "DRAFT") return -1;
          return 0;
        });
        const record = sortedRecords[0] ?? null;
        const progress = record ? assessmentProgressPercent(record.data, type) : null;
        const eligible = isEligibleForAssessment(child, today, window.minDays, window.maxDays);

        if (record?.status === "DRAFT") {
          drafts += childRecords.filter((item) => item.status === "DRAFT").length;
        }

        if (record && record.status !== "DRAFT") {
          if (progress !== null && progress < 100) {
            incompleteCount += 1;
          } else {
            completedCount += 1;
          }
        }

        if (!record && !eligible) {
          continue;
        }

        const reportStatus: ClassAssessmentRow["reportStatus"] =
          !record
            ? "No Assessment"
            : record.status === "DRAFT"
              ? "Draft Assessment"
              : progress !== null && progress < 100
                ? "Incomplete Assessment"
                : "Completed Assessment";

        rows.push({
          childId: child.id,
          assessmentId: record?.id ?? null,
          childNumber: child.childNumber,
          firstName: child.firstName,
          lastName: child.lastName,
          currentAge: formatAge(child.dateOfBirth, today),
          joiningAge: formatAge(child.dateOfBirth, child.enrollmentDate ?? today),
          reportStatus,
          actionHref: record?.id ? `/assessments/${type}/${record.id}` : `/assessments/${type}/new?childId=${child.id}`,
        });
      }

      const assessedChildIds = new Set(records.map((record) => record.childId));
      const missing = eligibleChildren.filter((child) => !assessedChildIds.has(child.id)).length;

      return {
        type,
        label: ASSESSMENT_TYPE_NAMES[type],
        completed: completedCount,
        missing,
        incomplete: incompleteCount,
        drafts,
        rows,
        href: `/assessments/${type}`,
      };
    });

    const submittedMedical = medicalCategories
      .filter((category) => category.key !== "calls")
      .reduce((sum, category) => sum + category.completed, 0);
    const draftMedical = medicalCategories
      .filter((category) => category.key !== "calls")
      .reduce((sum, category) => sum + category.drafts, 0);
    const missingMedical = medicalCategories.reduce(
      (sum, category) => sum + (category.missing ?? 0),
      0
    );

    const completedAssessments = assessmentCategories.reduce((sum, item) => sum + item.completed, 0);
    const missingAssessments = assessmentCategories.reduce((sum, item) => sum + item.missing, 0);
    const incompleteAssessments = assessmentCategories.reduce((sum, item) => sum + item.incomplete, 0);
    const draftAssessments = assessmentCategories.reduce((sum, item) => sum + item.drafts, 0);

    return {
      success: true,
      data: {
        selectedSchoolYear,
        classInfo: {
          id: cls.id,
          name: cls.name,
          branchName: cls.branch.name,
          language: cls.language,
          studentCount: activeStudentCount,
          maxStudents: cls.maxStudents || cls.capacity,
          maleCount,
          femaleCount,
        },
        dailyReports: {
          birthdays,
          withoutReport,
          completed,
          incomplete,
          drafts: draftReports,
          rows: dailyRows,
          absentRows,
        },
        medical: {
          published: submittedMedical,
          missing: missingMedical,
          drafts: draftMedical,
          categories: medicalCategories,
        },
        assessments: {
          completed: completedAssessments,
          missing: missingAssessments,
          incomplete: incompleteAssessments,
          drafts: draftAssessments,
          categories: assessmentCategories,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch class dashboard:", error);
    return { success: false, error: "Failed to fetch class dashboard" };
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassListParams {
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

interface ClassData {
  name: string;
  branchId: string;
  language?: string | null;
  ageFrom?: number | null;
  ageTo?: number | null;
  ageFromUnit?: AgeUnit | null;
  ageToUnit?: AgeUnit | null;
  cameraNumber?: number | null;
  maxStudents?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// getClasses
// ---------------------------------------------------------------------------

export async function getClasses(params: ClassListParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const where: Prisma.ClassWhereInput = {
      branch: { organizationId: orgId },
    };

    if (params.branchId) {
      where.branchId = params.branchId;
    }

    if (typeof params.isActive === "boolean") {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.name = { contains: params.search, mode: "insensitive" };
    }

    const classes = await db.class.findMany({
      where,
      include: {
        branch: true,
        _count: { select: { children: true } },
      },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    });

    const sortedClasses = classes.sort((a, b) => {
      if (a.legacyId != null && b.legacyId != null && a.legacyId !== b.legacyId) {
        return b.legacyId - a.legacyId;
      }
      if (a.legacyId != null && b.legacyId == null) return -1;
      if (a.legacyId == null && b.legacyId != null) return 1;
      const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.name.localeCompare(b.name);
    });

    return { success: true as const, data: sortedClasses };
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return { success: false as const, error: "Failed to fetch classes" };
  }
}

// ---------------------------------------------------------------------------
// getClass
// ---------------------------------------------------------------------------

export async function getClass(id: string) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const cls = await db.class.findUnique({
      where: { id },
      include: {
        branch: true,
        _count: { select: { children: true } },
      },
    });

    if (!cls) {
      return { success: false as const, error: "Class not found" };
    }

    if (cls.branch.organizationId !== orgId) {
      return { success: false as const, error: "Class not found" };
    }

    return { success: true as const, data: cls };
  } catch (error) {
    console.error("Failed to fetch class:", error);
    return { success: false as const, error: "Failed to fetch class" };
  }
}

// ---------------------------------------------------------------------------
// createClass
// ---------------------------------------------------------------------------

export async function createClass(data: ClassData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false as const, error: result.error };
    const { ctx } = result;

    if (!(await verifyBranchAccess(data.branchId, ctx.organizationId))) {
      return { success: false as const, error: "Branch not found" };
    }

    const created = await db.class.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        language: data.language ?? null,
        ageFrom: data.ageFrom ?? null,
        ageTo: data.ageTo ?? null,
        ageFromUnit: data.ageFromUnit ?? null,
        ageToUnit: data.ageToUnit ?? null,
        cameraNumber: data.cameraNumber ?? null,
        maxStudents: data.maxStudents ?? 0,
        capacity: data.maxStudents ?? 0,
        imageUrl: data.imageUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/classes");
    revalidatePath("/branches", "layout");

    return { success: true as const, data: created };
  } catch (error) {
    console.error("Failed to create class:", error);
    return { success: false as const, error: "Failed to create class" };
  }
}

// ---------------------------------------------------------------------------
// updateClass
// ---------------------------------------------------------------------------

export async function updateClass(id: string, data: Partial<ClassData>) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false as const, error: result.error };
    const { ctx } = result;

    const existing = await db.class.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) {
      return { success: false as const, error: "Class not found" };
    }
    if (existing.branch.organizationId !== ctx.organizationId) {
      return { success: false as const, error: "Class not found" };
    }

    if (data.branchId && data.branchId !== existing.branchId) {
      if (!(await verifyBranchAccess(data.branchId, ctx.organizationId))) {
        return { success: false as const, error: "Branch not found" };
      }
    }

    const updateData: Prisma.ClassUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.ageFrom !== undefined) updateData.ageFrom = data.ageFrom;
    if (data.ageTo !== undefined) updateData.ageTo = data.ageTo;
    if (data.ageFromUnit !== undefined) updateData.ageFromUnit = data.ageFromUnit;
    if (data.ageToUnit !== undefined) updateData.ageToUnit = data.ageToUnit;
    if (data.cameraNumber !== undefined) updateData.cameraNumber = data.cameraNumber;
    if (data.maxStudents !== undefined) {
      updateData.maxStudents = data.maxStudents;
      updateData.capacity = data.maxStudents;
    }
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.branchId !== undefined) {
      updateData.branch = { connect: { id: data.branchId } };
    }

    const updated = await db.class.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/classes");
    revalidatePath("/branches", "layout");

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Failed to update class:", error);
    return { success: false as const, error: "Failed to update class" };
  }
}

// ---------------------------------------------------------------------------
// deleteClass
// ---------------------------------------------------------------------------

export async function deleteClass(id: string) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false as const, error: result.error };
    const { ctx } = result;

    const existing = await db.class.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) {
      return { success: false as const, error: "Class not found" };
    }
    if (existing.branch.organizationId !== ctx.organizationId) {
      return { success: false as const, error: "Class not found" };
    }

    await db.class.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/classes");
    revalidatePath("/branches", "layout");

    return { success: true as const };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { success: false as const, error: "Failed to delete class" };
  }
}
