"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    const schoolYears = await db.schoolYear.findMany({
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolYear = await db.schoolYear.create({
      data: {
        label: data.label,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        isActive: data.isActive ?? false,
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Use a transaction to deactivate all, then activate the chosen one
    await db.$transaction([
      db.schoolYear.updateMany({
        where: { isActive: true },
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
