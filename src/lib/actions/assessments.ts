"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess, verifyBranchAccess } from "@/lib/verify-org-access";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import type { AssessmentStatus, Prisma } from "@/generated/prisma/client";
import { VALID_ASSESSMENT_TYPES } from "@/lib/assessment-types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetAssessmentsParams {
  assessmentType: number;
  childId?: string;
  classId?: string;
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
      status,
      search,
      page = 1,
      pageSize = 50,
    } = params;

    if (!VALID_ASSESSMENT_TYPES.includes(assessmentType as (typeof VALID_ASSESSMENT_TYPES)[number])) {
      return { assessments: [], total: 0 };
    }

    const where: Prisma.AssessmentWhereInput = {
      assessmentType,
      child: { branch: { organizationId: orgId } },
    };

    if (childId) {
      where.childId = childId;
    }

    if (status) {
      where.status = status;
    }

    if (classId || search) {
      const childWhere = where.child as Prisma.ChildWhereInput;
      if (classId) {
        childWhere.classId = classId;
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
            include: { class: true },
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

    if (!(await verifyChildAccess(input.childId, orgId))) {
      return { error: "Access denied" };
    }

    const assessment = await db.assessment.create({
      data: {
        childId: input.childId,
        assessmentType: input.assessmentType,
        schoolYearId: input.schoolYearId ?? null,
        status: input.status || "DRAFT",
        data: (input.data as InputJsonValue) ?? undefined,
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

    if (input.childId !== undefined) {
      updateData.child = { connect: { id: input.childId } };
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.data !== undefined) {
      updateData.data = input.data as InputJsonValue;
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
