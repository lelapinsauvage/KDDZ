"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
  capacity?: number;
  ageGroup?: string | null;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// getClasses
// ---------------------------------------------------------------------------

export async function getClasses(
  params: ClassListParams = {},
): Promise<ActionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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

    return { success: true, data: classes };
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return { success: false, error: "Failed to fetch classes" };
  }
}

// ---------------------------------------------------------------------------
// createClass
// ---------------------------------------------------------------------------

export async function createClass(data: ClassData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const created = await db.class.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        capacity: data.capacity ?? 0,
        ageGroup: data.ageGroup ?? null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/classes");

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create class:", error);
    return { success: false, error: "Failed to create class" };
  }
}

// ---------------------------------------------------------------------------
// updateClass
// ---------------------------------------------------------------------------

export async function updateClass(
  id: string,
  data: Partial<ClassData>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.ageGroup !== undefined) updateData.ageGroup = data.ageGroup;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await db.class.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/classes");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update class:", error);
    return { success: false, error: "Failed to update class" };
  }
}

// ---------------------------------------------------------------------------
// deleteClass
// ---------------------------------------------------------------------------

export async function deleteClass(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.class.delete({ where: { id } });

    revalidatePath("/classes");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { success: false, error: "Failed to delete class" };
  }
}
