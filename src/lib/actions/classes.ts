"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { AgeUnit, Prisma } from "@/generated/prisma/client";

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
    const where: Prisma.ClassWhereInput = {};

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
    const session = await auth();
    if (!session?.user) {
      return { success: false as const, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false as const, error: "Unauthorized" };
    }

    const existing = await db.class.findUnique({ where: { id } });
    if (!existing) {
      return { success: false as const, error: "Class not found" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false as const, error: "Unauthorized" };
    }

    const existing = await db.class.findUnique({ where: { id } });
    if (!existing) {
      return { success: false as const, error: "Class not found" };
    }

    await db.class.delete({ where: { id } });

    revalidatePath("/classes");

    return { success: true as const };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { success: false as const, error: "Failed to delete class" };
  }
}
