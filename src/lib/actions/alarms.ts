"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { AlarmType } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlarmListParams {
  type?: AlarmType;
  branchId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface AlarmData {
  type: AlarmType;
  referenceId?: string | null;
  referenceType?: string | null;
  message?: string | null;
  dueDate?: Date | string | null;
  branchId?: string | null;
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

function toDateOrNull(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  return typeof value === "string" ? new Date(value) : value;
}

// ---------------------------------------------------------------------------
// getAlarms
// ---------------------------------------------------------------------------

export async function getAlarms(
  params: AlarmListParams = {},
): Promise<ActionResult> {
  try {
    const { type, branchId, isActive, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (type) where.type = type;
    if (branchId) where.branchId = branchId;
    if (typeof isActive === "boolean") where.isActive = isActive;

    const skip = (page - 1) * pageSize;

    const [alarms, total] = await Promise.all([
      db.alarm.findMany({
        where,
        include: { branch: true },
        orderBy: { dueDate: "asc" },
        skip,
        take: pageSize,
      }),
      db.alarm.count({ where }),
    ]);

    return {
      success: true,
      data: {
        alarms,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Failed to fetch alarms:", error);
    return { success: false, error: "Failed to fetch alarms" };
  }
}

// ---------------------------------------------------------------------------
// createAlarm
// ---------------------------------------------------------------------------

export async function createAlarm(data: AlarmData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const alarm = await db.alarm.create({
      data: {
        type: data.type,
        referenceId: data.referenceId ?? null,
        referenceType: data.referenceType ?? null,
        message: data.message ?? null,
        dueDate: toDateOrNull(data.dueDate),
        branchId: data.branchId ?? null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to create alarm:", error);
    return { success: false, error: "Failed to create alarm" };
  }
}

// ---------------------------------------------------------------------------
// updateAlarm
// ---------------------------------------------------------------------------

export async function updateAlarm(
  id: string,
  data: Partial<AlarmData>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.referenceId !== undefined)
      updateData.referenceId = data.referenceId;
    if (data.referenceType !== undefined)
      updateData.referenceType = data.referenceType;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.dueDate !== undefined)
      updateData.dueDate = toDateOrNull(data.dueDate);
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const alarm = await db.alarm.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to update alarm:", error);
    return { success: false, error: "Failed to update alarm" };
  }
}

// ---------------------------------------------------------------------------
// dismissAlarm — set isActive=false
// ---------------------------------------------------------------------------

export async function dismissAlarm(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.alarm.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss alarm:", error);
    return { success: false, error: "Failed to dismiss alarm" };
  }
}

// ---------------------------------------------------------------------------
// deleteAlarm
// ---------------------------------------------------------------------------

export async function deleteAlarm(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.alarm.delete({ where: { id } });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete alarm:", error);
    return { success: false, error: "Failed to delete alarm" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingBirthdays
// ---------------------------------------------------------------------------

export async function getUpcomingBirthdays(
  branchId?: string,
): Promise<ActionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      dateOfBirth: { not: null },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const children = await db.child.findMany({
      where,
      include: { branch: true, class: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthdays = children
      .map((child) => {
        const dob = child.dateOfBirth!;
        // Calculate next birthday
        const nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );

        // If the birthday already passed this year, use next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate age at next birthday
        const age = nextBirthday.getFullYear() - dob.getFullYear();

        return {
          child,
          daysUntil,
          age,
          nextBirthday,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { success: true, data: birthdays };
  } catch (error) {
    console.error("Failed to fetch upcoming birthdays:", error);
    return { success: false, error: "Failed to fetch upcoming birthdays" };
  }
}

// ---------------------------------------------------------------------------
// getOverdueVaccinations
// ---------------------------------------------------------------------------

export async function getOverdueVaccinations(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      nextDueDate: { lt: today },
    };

    if (branchId) {
      where.child = { branchId };
    }

    const vaccinations = await db.vaccination.findMany({
      where,
      include: {
        child: {
          include: { branch: true, class: true },
        },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return { success: true, data: vaccinations };
  } catch (error) {
    console.error("Failed to fetch overdue vaccinations:", error);
    return { success: false, error: "Failed to fetch overdue vaccinations" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingAssessments
// ---------------------------------------------------------------------------

export async function getUpcomingAssessments(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      scheduledDate: { gte: today },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const assessmentDates = await db.assessmentDate.findMany({
      where,
      include: { branch: true },
      orderBy: { scheduledDate: "asc" },
    });

    return { success: true, data: assessmentDates };
  } catch (error) {
    console.error("Failed to fetch upcoming assessments:", error);
    return { success: false, error: "Failed to fetch upcoming assessments" };
  }
}
