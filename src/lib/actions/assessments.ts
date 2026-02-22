"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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
    };

    if (childId) {
      where.childId = childId;
    }

    if (status) {
      where.status = status;
    }

    if (classId || search) {
      where.child = {};
      if (classId) {
        where.child.classId = classId;
      }
      if (search) {
        where.child.OR = [
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
    const assessment = await db.assessment.findUnique({
      where: { id },
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
    });

    if (!assessment) {
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!input.childId || !input.assessmentType) {
      return { error: "childId and assessmentType are required" };
    }

    if (!VALID_ASSESSMENT_TYPES.includes(input.assessmentType as (typeof VALID_ASSESSMENT_TYPES)[number])) {
      return { error: "Invalid assessment type" };
    }

    const assessment = await db.assessment.create({
      data: {
        childId: input.childId,
        assessmentType: input.assessmentType,
        schoolYearId: input.schoolYearId ?? null,
        status: input.status || "DRAFT",
        data: (input.data as InputJsonValue) ?? undefined,
        createdById: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.assessment.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Assessment not found" };
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.assessment.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Assessment not found" };
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
    const { assessmentType, branchId, page = 1, pageSize = 50 } = params;

    const where: Prisma.AssessmentDateWhereInput = {};

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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await db.assessmentDate.delete({ where: { id } });

    revalidatePath("/assessments");
    return { success: true };
  } catch (error) {
    console.error("deleteAssessmentDate error:", error);
    return { error: "Failed to delete assessment date" };
  }
}
