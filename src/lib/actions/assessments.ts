"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import type { AssessmentStatus, Prisma } from "@/generated/prisma/client";
import {
  ASSESSMENT_CONFIGS,
  ASSESSMENT_TYPE_NAMES,
  VALID_ASSESSMENT_TYPES,
} from "@/lib/assessment-types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetAssessmentsParams {
  assessmentType?: number;
  childId?: string;
  classId?: string;
  branchId?: string;
  status?: AssessmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CreateAssessmentData {
  childId: string;
  assessmentType: number;
  schoolYearId?: string;
  status?: AssessmentStatus;
  data?: Record<string, unknown>;
}

interface UpdateAssessmentData {
  childId?: string;
  status?: AssessmentStatus;
  data?: Record<string, unknown>;
}

interface GetAssessmentDatesParams {
  assessmentType?: number;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

interface CreateAssessmentDateData {
  assessmentType: number;
  branchId: string;
  scheduledDate: string;
}

interface GetAssessmentReviewParams {
  assessmentType?: number;
  classId?: string;
  branchId?: string;
}

export type AssessmentReviewStatus =
  | "COMPLETED"
  | "INCOMPLETE"
  | "DRAFT"
  | "MISSING";

export interface AssessmentReviewRow {
  assessmentType: number;
  assessmentTypeName: string;
  childId: string;
  assessmentId: string | null;
  childNumber: string | null;
  firstName: string;
  lastName: string;
  photo: string | null;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string | null;
  currentAge: string;
  joiningAge: string;
  status: AssessmentReviewStatus;
  progress: number | null;
  reportDate: Date | null;
  actionHref: string;
}

export interface AssessmentReviewSummary {
  completed: number;
  incomplete: number;
  drafts: number;
  missing: number;
  total: number;
}

const assessmentTypes = [...VALID_ASSESSMENT_TYPES];
const PRESERVED_ASSESSMENT_DATA_KEYS = [
  "_legacy",
  "_legacyRaw",
  "_legacyAssessmentType",
  "_legacyNewAssessmentOnly",
  "_legacyNewAssessmentMarkers",
] as const;

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

async function findAssessmentChildForOrg(childId: string, orgId: string) {
  return db.child.findFirst({
    where: { id: childId, branch: { organizationId: orgId } },
    select: { id: true, legacyId: true },
  });
}

function shouldPublishNewAssessmentMarker(status: AssessmentStatus) {
  return status !== "DRAFT";
}

function readStringValue(value: unknown) {
  if (value === undefined || value === null) return null;
  const stringValue = String(value);
  return stringValue.length > 0 ? stringValue : null;
}

function legacyAssessmentReportId(data: Record<string, unknown>, assessmentId: string) {
  const legacy = jsonObject(data._legacy as Prisma.JsonValue | null | undefined);
  return (
    readStringValue(legacy?.reportId) ??
    readStringValue(legacy?.report_id) ??
    readStringValue(data.reportId) ??
    readStringValue(data.report_id) ??
    assessmentId
  );
}

function existingNewAssessmentMarkers(data: Record<string, unknown>) {
  const markers: Record<string, unknown>[] = [];
  const singleMarker = jsonObject(
    data._legacyNewAssessmentOnly as Prisma.JsonValue | null | undefined
  );
  if (singleMarker) markers.push(singleMarker);

  const markerList = data._legacyNewAssessmentMarkers;
  if (Array.isArray(markerList)) {
    markers.push(
      ...markerList
        .map((marker) => jsonObject(marker as Prisma.JsonValue | null | undefined))
        .filter((marker): marker is Record<string, unknown> => marker !== null)
    );
  }

  return markers;
}

function mergePreservedAssessmentData(
  data: Record<string, unknown>,
  previousData: Prisma.JsonValue | null | undefined
) {
  const previous = jsonObject(previousData);
  if (!previous) return data;

  const merged = { ...data };
  for (const key of PRESERVED_ASSESSMENT_DATA_KEYS) {
    if (merged[key] === undefined && previous[key] !== undefined) {
      merged[key] = previous[key];
    }
  }

  return merged;
}

function addNewAssessmentMarker(
  data: Prisma.JsonValue | Record<string, unknown> | null | undefined,
  params: {
    assessmentId: string;
    assessmentType: number;
    childId: string;
    legacyChildId: number | null;
    now: Date;
  }
): InputJsonValue | undefined {
  const payload =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...(data as Record<string, unknown>) }
      : {};
  const table = `t_assessment_${params.assessmentType}`;
  const reportId = legacyAssessmentReportId(payload, params.assessmentId);
  const hasMarker = existingNewAssessmentMarkers(payload).some(
    (marker) =>
      readStringValue(marker.table) === table &&
      readStringValue(marker.reportId) === reportId
  );

  if (hasMarker) {
    return JSON.parse(JSON.stringify(payload)) as InputJsonValue;
  }

  const marker = {
    id: params.assessmentId,
    datetime: formatSqlDateTime(params.now),
    table,
    reportId,
    childId: params.legacyChildId ?? params.childId,
    sent: false,
    modernGenerated: true,
  };
  const currentMarkers = Array.isArray(payload._legacyNewAssessmentMarkers)
    ? payload._legacyNewAssessmentMarkers
    : [];

  return JSON.parse(
    JSON.stringify({
      ...payload,
      _legacyNewAssessmentMarkers: [...currentMarkers, marker],
    })
  ) as InputJsonValue;
}

function formatSqlDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
  ].join(" ");
}

function legacyProgressPercent(data: Prisma.JsonValue | null | undefined) {
  const payload = jsonObject(data);
  const legacy = jsonObject(payload?._legacy as Prisma.JsonValue | null | undefined);
  const progress = legacy?.progress;

  if (typeof progress === "number" && Number.isFinite(progress)) {
    return Math.round(progress);
  }

  if (typeof progress === "string") {
    const parsed = Number(progress);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }

  return null;
}

function assessmentProgressPercent(data: Prisma.JsonValue | null | undefined, type: number) {
  const legacyProgress = legacyProgressPercent(data);
  if (legacyProgress !== null) return legacyProgress;

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

function reviewStatusFromRecord(
  record: { status: AssessmentStatus; data: Prisma.JsonValue | null },
  type: number
): { status: AssessmentReviewStatus; progress: number | null; rank: number } {
  if (record.status === "DRAFT") {
    return { status: "DRAFT", progress: null, rank: 2 };
  }

  const progress = assessmentProgressPercent(record.data, type);
  if (progress !== null && progress < 100) {
    return { status: "INCOMPLETE", progress, rank: 1 };
  }

  return { status: "COMPLETED", progress, rank: 0 };
}

// ─────────────────────────────────────────────
// getAssessments — List with filtering
// ─────────────────────────────────────────────

export async function getAssessments(params: GetAssessmentsParams) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const {
      assessmentType,
      childId,
      classId,
      branchId,
      status,
      search,
      page = 1,
      pageSize = 50,
    } = params;

    // If a specific type is given, validate it
    if (assessmentType !== undefined && !VALID_ASSESSMENT_TYPES.includes(assessmentType as (typeof VALID_ASSESSMENT_TYPES)[number])) {
      return { assessments: [], total: 0 };
    }

    const where: Prisma.AssessmentWhereInput = {
      child: { branch: { organizationId: orgId } },
    };

    if (assessmentType !== undefined) {
      where.assessmentType = assessmentType;
    }

    if (childId) {
      where.childId = childId;
    }

    if (status) {
      where.status = status;
    }

    if (classId || branchId || search) {
      const childWhere = where.child as Prisma.ChildWhereInput;
      if (classId) {
        childWhere.classId = classId;
      }
      if (branchId) {
        childWhere.branchId = branchId;
      }
      if (search) {
        childWhere.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    const skip = (page - 1) * pageSize;

    const [assessments, total] = await Promise.all([
      db.assessment.findMany({
        where,
        include: {
          child: {
            include: { class: true, branch: { select: { id: true, name: true } } },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          schoolYear: {
            select: { id: true, label: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.assessment.count({ where }),
    ]);

    return { assessments, total };
  } catch (error) {
    console.error("getAssessments error:", error);
    return { assessments: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// getAssessmentReview — Legacy-style report parity rows
// ─────────────────────────────────────────────

export async function getAssessmentReview(params: GetAssessmentReviewParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();
    const { assessmentType, classId, branchId } = params;

    if (
      assessmentType !== undefined &&
      !VALID_ASSESSMENT_TYPES.includes(assessmentType as (typeof VALID_ASSESSMENT_TYPES)[number])
    ) {
      return {
        rows: [],
        summary: { completed: 0, incomplete: 0, drafts: 0, missing: 0, total: 0 },
      };
    }

    const childWhere: Prisma.ChildWhereInput = {
      isActive: true,
      isDraft: false,
      branch: { organizationId: orgId },
    };

    if (branchId) {
      childWhere.branchId = branchId;
    }
    if (classId) {
      childWhere.classId = classId;
    }

    const selectedTypes = assessmentType ? [assessmentType] : assessmentTypes;
    const today = startOfToday();

    const [children, assessments, scheduleRules] = await Promise.all([
      db.child.findMany({
        where: childWhere,
        select: {
          id: true,
          childNumber: true,
          firstName: true,
          lastName: true,
          photo: true,
          dateOfBirth: true,
          enrollmentDate: true,
          classId: true,
          branchId: true,
          class: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      db.assessment.findMany({
        where: {
          assessmentType: { in: selectedTypes },
          child: childWhere,
        },
        select: {
          id: true,
          childId: true,
          assessmentType: true,
          status: true,
          data: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.assessmentScheduleRule.findMany({
        where: {
          organizationId: orgId,
          assessmentType: { in: selectedTypes },
        },
        select: {
          assessmentType: true,
          minimumAgeDays: true,
          maximumAgeDays: true,
        },
      }),
    ]);

    const ruleByType = new Map(
      scheduleRules.map((rule) => [
        rule.assessmentType,
        {
          minDays: Number(
            rule.minimumAgeDays ??
              fallbackAssessmentWindows[rule.assessmentType]?.minDays ??
              0
          ),
          maxDays: Number(
            rule.maximumAgeDays ??
              fallbackAssessmentWindows[rule.assessmentType]?.maxDays ??
              Number.MAX_SAFE_INTEGER
          ),
        },
      ])
    );

    const recordsByTypeChild = new Map<string, typeof assessments>();
    for (const assessment of assessments) {
      const key = `${assessment.assessmentType}:${assessment.childId}`;
      const current = recordsByTypeChild.get(key) ?? [];
      current.push(assessment);
      recordsByTypeChild.set(key, current);
    }

    const rows: AssessmentReviewRow[] = [];
    const summary: AssessmentReviewSummary = {
      completed: 0,
      incomplete: 0,
      drafts: 0,
      missing: 0,
      total: 0,
    };

    for (const type of selectedTypes) {
      const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];

      for (const child of children) {
        const records = recordsByTypeChild.get(`${type}:${child.id}`) ?? [];
        const rankedRecords = records
          .map((record) => ({
            record,
            review: reviewStatusFromRecord(record, type),
          }))
          .sort((a, b) => {
            if (a.review.rank !== b.review.rank) return a.review.rank - b.review.rank;
            return b.record.createdAt.getTime() - a.record.createdAt.getTime();
          });
        const picked = rankedRecords[0] ?? null;

        if (picked) {
          rows.push({
            assessmentType: type,
            assessmentTypeName: ASSESSMENT_TYPE_NAMES[type] ?? `Type ${type}`,
            childId: child.id,
            assessmentId: picked.record.id,
            childNumber: child.childNumber,
            firstName: child.firstName,
            lastName: child.lastName,
            photo: child.photo,
            branchId: child.branchId,
            branchName: child.branch.name,
            classId: child.classId,
            className: child.class?.name ?? null,
            currentAge: formatAge(child.dateOfBirth, today),
            joiningAge: formatAge(child.dateOfBirth, child.enrollmentDate ?? today),
            status: picked.review.status,
            progress: picked.review.progress,
            reportDate: picked.record.createdAt,
            actionHref: `/assessments/${type}/${picked.record.id}`,
          });

          if (picked.review.status === "COMPLETED") summary.completed += 1;
          if (picked.review.status === "INCOMPLETE") summary.incomplete += 1;
          if (picked.review.status === "DRAFT") summary.drafts += 1;
          continue;
        }

        if (!isEligibleForAssessment(child, today, window.minDays, window.maxDays)) {
          continue;
        }

        rows.push({
          assessmentType: type,
          assessmentTypeName: ASSESSMENT_TYPE_NAMES[type] ?? `Type ${type}`,
          childId: child.id,
          assessmentId: null,
          childNumber: child.childNumber,
          firstName: child.firstName,
          lastName: child.lastName,
          photo: child.photo,
          branchId: child.branchId,
          branchName: child.branch.name,
          classId: child.classId,
          className: child.class?.name ?? null,
          currentAge: formatAge(child.dateOfBirth, today),
          joiningAge: formatAge(child.dateOfBirth, child.enrollmentDate ?? today),
          status: "MISSING",
          progress: null,
          reportDate: null,
          actionHref: `/assessments/${type}/new?childId=${child.id}`,
        });
        summary.missing += 1;
      }
    }

    summary.total =
      summary.completed + summary.incomplete + summary.drafts + summary.missing;

    rows.sort((a, b) => {
      const statusOrder: Record<AssessmentReviewStatus, number> = {
        MISSING: 0,
        INCOMPLETE: 1,
        DRAFT: 2,
        COMPLETED: 3,
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.assessmentType !== b.assessmentType) {
        return a.assessmentType - b.assessmentType;
      }
      return `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`
      );
    });

    return { rows, summary };
  } catch (error) {
    console.error("getAssessmentReview error:", error);
    return {
      rows: [],
      summary: { completed: 0, incomplete: 0, drafts: 0, missing: 0, total: 0 },
    };
  }
}

// ─────────────────────────────────────────────
// getAssessment — Single assessment
// ─────────────────────────────────────────────

export async function getAssessment(id: string) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const assessment = await db.assessment.findUnique({
      where: { id },
      include: {
        child: {
          include: { class: true, branch: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        schoolYear: {
          select: { id: true, label: true },
        },
      },
    });

    if (!assessment) {
      return { error: "Assessment not found" };
    }

    if (assessment.child.branch.organizationId !== orgId) {
      return { error: "Assessment not found" };
    }

    return { assessment };
  } catch (error) {
    console.error("getAssessment error:", error);
    return { error: "Failed to load assessment" };
  }
}

// ─────────────────────────────────────────────
// createAssessment
// ─────────────────────────────────────────────

export async function createAssessment(input: CreateAssessmentData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { organizationId: orgId, userId } = result.ctx;

    if (!input.childId || !input.assessmentType) {
      return { error: "childId and assessmentType are required" };
    }

    if (!VALID_ASSESSMENT_TYPES.includes(input.assessmentType as (typeof VALID_ASSESSMENT_TYPES)[number])) {
      return { error: "Invalid assessment type" };
    }

    const child = await findAssessmentChildForOrg(input.childId, orgId);
    if (!child) {
      return { error: "Access denied" };
    }

    const assessmentId = randomUUID();
    const status = input.status || "DRAFT";
    const data = shouldPublishNewAssessmentMarker(status)
      ? addNewAssessmentMarker(input.data, {
          assessmentId,
          assessmentType: input.assessmentType,
          childId: child.id,
          legacyChildId: child.legacyId,
          now: new Date(),
        })
      : ((input.data as InputJsonValue) ?? undefined);

    const assessment = await db.assessment.create({
      data: {
        id: assessmentId,
        childId: input.childId,
        assessmentType: input.assessmentType,
        schoolYearId: input.schoolYearId ?? null,
        status,
        data,
        createdById: userId,
      },
    });

    revalidatePath("/assessments");
    return { success: true, assessmentId: assessment.id };
  } catch (error) {
    console.error("createAssessment error:", error);
    return { error: "Failed to create assessment" };
  }
}

// ─────────────────────────────────────────────
// updateAssessment
// ─────────────────────────────────────────────

export async function updateAssessment(id: string, input: UpdateAssessmentData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.assessment.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Assessment not found" };
    }
    if (existing.child.branch.organizationId !== orgId) {
      return { error: "Access denied" };
    }

    const updateData: Prisma.AssessmentUpdateInput = {};
    let targetChild = {
      id: existing.child.id,
      legacyId: existing.child.legacyId,
    };

    if (input.childId !== undefined) {
      const child = await findAssessmentChildForOrg(input.childId, orgId);
      if (!child) return { error: "Access denied" };
      targetChild = child;
      updateData.child = { connect: { id: input.childId } };
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    const finalStatus = input.status ?? existing.status;
    const nextData =
      input.data !== undefined
        ? mergePreservedAssessmentData(input.data, existing.data)
        : existing.data;
    if (shouldPublishNewAssessmentMarker(finalStatus)) {
      updateData.data = addNewAssessmentMarker(nextData, {
        assessmentId: id,
        assessmentType: existing.assessmentType,
        childId: targetChild.id,
        legacyChildId: targetChild.legacyId,
        now: new Date(),
      });
    } else if (input.data !== undefined) {
      updateData.data = nextData as InputJsonValue;
    }

    const assessment = await db.assessment.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/assessments");
    return { success: true, assessmentId: assessment.id };
  } catch (error) {
    console.error("updateAssessment error:", error);
    return { error: "Failed to update assessment" };
  }
}

// ─────────────────────────────────────────────
// deleteAssessment
// ─────────────────────────────────────────────

export async function deleteAssessment(id: string) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.assessment.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Assessment not found" };
    }
    if (existing.child.branch.organizationId !== orgId) {
      return { error: "Access denied" };
    }

    await db.assessment.delete({ where: { id } });

    revalidatePath("/assessments");
    return { success: true };
  } catch (error) {
    console.error("deleteAssessment error:", error);
    return { error: "Failed to delete assessment" };
  }
}

// ─────────────────────────────────────────────
// Assessment Dates CRUD
// ─────────────────────────────────────────────

export async function getAssessmentDates(params: GetAssessmentDatesParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const { assessmentType, branchId, page = 1, pageSize = 50 } = params;

    const where: Prisma.AssessmentDateWhereInput = {
      branch: { organizationId: orgId },
    };

    if (assessmentType) {
      where.assessmentType = assessmentType;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const skip = (page - 1) * pageSize;

    const [dates, total] = await Promise.all([
      db.assessmentDate.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
        },
        orderBy: { scheduledDate: "desc" },
        skip,
        take: pageSize,
      }),
      db.assessmentDate.count({ where }),
    ]);

    return { dates, total };
  } catch (error) {
    console.error("getAssessmentDates error:", error);
    return { dates: [], total: 0 };
  }
}

export async function createAssessmentDate(input: CreateAssessmentDateData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { organizationId: orgId } = result.ctx;

    if (!(await verifyBranchAccess(input.branchId, orgId))) {
      return { error: "Access denied" };
    }

    const date = await db.assessmentDate.create({
      data: {
        assessmentType: input.assessmentType,
        branchId: input.branchId,
        scheduledDate: new Date(input.scheduledDate),
      },
    });

    revalidatePath("/assessments");
    return { success: true, dateId: date.id };
  } catch (error) {
    console.error("createAssessmentDate error:", error);
    return { error: "Failed to create assessment date" };
  }
}

export async function deleteAssessmentDate(id: string) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.assessmentDate.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) {
      return { error: "Assessment date not found" };
    }
    if (existing.branch.organizationId !== orgId) {
      return { error: "Access denied" };
    }

    await db.assessmentDate.delete({ where: { id } });

    revalidatePath("/assessments");
    return { success: true };
  } catch (error) {
    console.error("deleteAssessmentDate error:", error);
    return { error: "Failed to delete assessment date" };
  }
}
