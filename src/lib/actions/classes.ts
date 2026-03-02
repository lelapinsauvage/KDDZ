"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import type { AgeUnit, Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// ClassDashboard types & action
// ---------------------------------------------------------------------------

export interface ClassDashboardData {
  classInfo: {
    id: string;
    name: string;
    branchName: string;
    language: string | null;
    studentCount: number;
  };
  dailyReports: {
    birthdays: number;
    withoutReport: number;
    completed: number;
    incomplete: number;
    drafts: number;
  };
  medical: {
    published: number;
    missing: number;
    drafts: number;
  };
  assessments: {
    completed: number;
    missing: number;
    drafts: number;
  };
}

export async function getClassDashboard(
  classId: string
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

    // Active children in this class
    const activeChildren = await db.child.findMany({
      where: { classId, isActive: true, isDraft: false },
      select: { id: true, dateOfBirth: true },
    });

    const activeChildIds = activeChildren.map((c) => c.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count birthdays this month
    const currentMonth = today.getMonth() + 1;
    const birthdays = activeChildren.filter((c) => {
      if (!c.dateOfBirth) return false;
      return new Date(c.dateOfBirth).getMonth() + 1 === currentMonth;
    }).length;

    if (activeChildIds.length === 0) {
      return {
        success: true,
        data: {
          classInfo: {
            id: cls.id,
            name: cls.name,
            branchName: cls.branch.name,
            language: cls.language,
            studentCount: cls._count.children,
          },
          dailyReports: { birthdays, withoutReport: 0, completed: 0, incomplete: 0, drafts: 0 },
          medical: { published: 0, missing: 0, drafts: 0 },
          assessments: { completed: 0, missing: 0, drafts: 0 },
        },
      };
    }

    const childFilter = { childId: { in: activeChildIds } };

    const [
      submittedReports,
      draftReports,
      todayReportChildIds,
      submittedMedical,
      draftMedical,
      medicalChildIds,
      submittedAssessments,
      draftAssessments,
      assessmentChildIds,
    ] = await Promise.all([
      // Daily reports — submitted today
      db.dailyReport.count({
        where: { ...childFilter, reportDate: { gte: today, lt: tomorrow }, status: "SUBMITTED" },
      }),
      // Daily reports — drafts today
      db.dailyReport.count({
        where: { ...childFilter, reportDate: { gte: today, lt: tomorrow }, status: "DRAFT" },
      }),
      // Children who have any report today (to compute "without report")
      db.dailyReport.findMany({
        where: { ...childFilter, reportDate: { gte: today, lt: tomorrow } },
        select: { childId: true },
        distinct: ["childId"],
      }),
      // Medical — submitted
      db.medicalForm.count({
        where: { ...childFilter, status: "SUBMITTED" },
      }),
      // Medical — drafts
      db.medicalForm.count({
        where: { ...childFilter, status: "DRAFT" },
      }),
      // Distinct children with a submitted medical form
      db.medicalForm.findMany({
        where: { ...childFilter, status: "SUBMITTED" },
        select: { childId: true },
        distinct: ["childId"],
      }),
      // Assessments — submitted
      db.assessment.count({
        where: { ...childFilter, status: "SUBMITTED" },
      }),
      // Assessments — drafts
      db.assessment.count({
        where: { ...childFilter, status: "DRAFT" },
      }),
      // Distinct children with a submitted assessment
      db.assessment.findMany({
        where: { ...childFilter, status: "SUBMITTED" },
        select: { childId: true },
        distinct: ["childId"],
      }),
    ]);

    const reportedChildIds = new Set(todayReportChildIds.map((r) => r.childId));
    const withoutReport = activeChildIds.filter((id) => !reportedChildIds.has(id)).length;

    // "Incomplete" = children who have a draft but not submitted today
    const incomplete = draftReports;
    // "Completed" = submitted reports today
    const completed = submittedReports;

    const medicalCoveredIds = new Set(medicalChildIds.map((m) => m.childId));
    const missingMedical = activeChildIds.filter((id) => !medicalCoveredIds.has(id)).length;

    const assessmentCoveredIds = new Set(assessmentChildIds.map((a) => a.childId));
    const missingAssessments = activeChildIds.filter((id) => !assessmentCoveredIds.has(id)).length;

    return {
      success: true,
      data: {
        classInfo: {
          id: cls.id,
          name: cls.name,
          branchName: cls.branch.name,
          language: cls.language,
          studentCount: cls._count.children,
        },
        dailyReports: {
          birthdays,
          withoutReport,
          completed,
          incomplete,
          drafts: draftReports,
        },
        medical: {
          published: submittedMedical,
          missing: missingMedical,
          drafts: draftMedical,
        },
        assessments: {
          completed: submittedAssessments,
          missing: missingAssessments,
          drafts: draftAssessments,
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
      orderBy: { name: "asc" },
    });

    return { success: true as const, data: classes };
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
    if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
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

    await db.class.delete({ where: { id } });

    revalidatePath("/classes");
    revalidatePath("/branches", "layout");

    return { success: true as const };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { success: false as const, error: "Failed to delete class" };
  }
}
