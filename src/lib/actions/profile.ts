"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

import { db } from "@/lib/db";
import { requireOrgSafe } from "@/lib/require-org";
import { isAdminRole } from "@/lib/require-role";

const MIN_PASSWORD_LENGTH = 5;

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function changeCurrentUserPassword(
  password: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };

  if (!password) {
    return { success: false, error: "No Change !" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  try {
    const existing = await db.user.findUnique({
      where: { id: result.ctx.userId },
      select: { id: true, isActive: true },
    });
    if (!existing?.isActive) {
      return { success: false, error: "User not found" };
    }

    const passwordHash = await hash(password, 12);
    await db.user.update({
      where: { id: result.ctx.userId },
      data: { passwordHash },
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("changeCurrentUserPassword error:", error);
    return { success: false, error: "Failed to update password" };
  }
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function updateActiveSchoolYearDates(
  startDate: string,
  endDate: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  if (!isAdminRole(ctx.role)) {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  if (!startDate || !endDate) {
    return { success: false, error: "Please Fill both start & end dates" };
  }

  const parsedStartDate = parseDateOnly(startDate);
  const parsedEndDate = parseDateOnly(endDate);
  if (!parsedStartDate || !parsedEndDate) {
    return { success: false, error: "Please Fill both start & end dates" };
  }

  if (parsedEndDate < parsedStartDate) {
    return { success: false, error: "End Date must be after Start Date" };
  }

  try {
    const activeYear = await db.schoolYear.findFirst({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: { id: true },
      orderBy: { startDate: "desc" },
    });

    if (!activeYear) {
      return { success: false, error: "Active scholastic year not found" };
    }

    await db.schoolYear.update({
      where: { id: activeYear.id },
      data: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/settings.php");
    revalidatePath("/settings/school-years");

    return { success: true };
  } catch (error) {
    console.error("updateActiveSchoolYearDates error:", error);
    return { success: false, error: "Failed to update scholastic year" };
  }
}
