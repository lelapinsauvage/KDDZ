"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchoolYearData {
  label: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

// ---------------------------------------------------------------------------
// getSchoolYears
// ---------------------------------------------------------------------------

export async function getSchoolYears(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const schoolYears = await db.schoolYear.findMany({
      where: { organizationId: orgId },
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: {
            children: true,
            assessments: true,
          },
        },
      },
    });

    return { success: true, data: schoolYears };
  } catch (error) {
    console.error("Failed to fetch school years:", error);
    return { success: false, error: "Failed to fetch school years" };
  }
}

// ---------------------------------------------------------------------------
// createSchoolYear
// ---------------------------------------------------------------------------

export async function createSchoolYear(
  data: SchoolYearData,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const schoolYear = await db.schoolYear.create({
      data: {
        label: data.label,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        isActive: data.isActive ?? false,
        organizationId: ctx.organizationId,
      },
    });

    revalidatePath("/settings/school-years");

    return { success: true, data: schoolYear };
  } catch (error) {
    console.error("Failed to create school year:", error);
    return { success: false, error: "Failed to create school year" };
  }
}

// ---------------------------------------------------------------------------
// updateSchoolYear
// ---------------------------------------------------------------------------

export async function updateSchoolYear(
  id: string,
  data: Partial<SchoolYearData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.schoolYear.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "School year not found" };
    }
    if (existing.organizationId !== ctx.organizationId) {
      return { success: false, error: "School year not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.startDate !== undefined)
      updateData.startDate = toDate(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = toDate(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const schoolYear = await db.schoolYear.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/school-years");

    return { success: true, data: schoolYear };
  } catch (error) {
    console.error("Failed to update school year:", error);
    return { success: false, error: "Failed to update school year" };
  }
}

// ---------------------------------------------------------------------------
// setActiveSchoolYear — activate one, deactivate all others
// ---------------------------------------------------------------------------

export async function setActiveSchoolYear(
  id: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const target = await db.schoolYear.findUnique({ where: { id } });
    if (!target) {
      return { success: false, error: "School year not found" };
    }
    if (target.organizationId !== ctx.organizationId) {
      return { success: false, error: "School year not found" };
    }

    // Use a transaction to deactivate all within org, then activate the chosen one
    await db.$transaction([
      db.schoolYear.updateMany({
        where: { isActive: true, organizationId: ctx.organizationId },
        data: { isActive: false },
      }),
      db.schoolYear.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    revalidatePath("/settings/school-years");

    return { success: true };
  } catch (error) {
    console.error("Failed to set active school year:", error);
    return { success: false, error: "Failed to set active school year" };
  }
}
