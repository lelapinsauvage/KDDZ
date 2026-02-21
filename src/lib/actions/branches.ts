"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BranchData {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  organizationId: string;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// getBranches
// ---------------------------------------------------------------------------

export async function getBranches(): Promise<ActionResult> {
  try {
    const branches = await db.branch.findMany({
      include: {
        _count: {
          select: {
            classes: true,
            children: true,
            teachers: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: branches };
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return { success: false, error: "Failed to fetch branches" };
  }
}

// ---------------------------------------------------------------------------
// getBranch
// ---------------------------------------------------------------------------

export async function getBranch(id: string): Promise<ActionResult> {
  try {
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        organization: true,
        classes: true,
        teachers: true,
        nurses: true,
        doctors: true,
        managers: true,
        _count: {
          select: {
            classes: true,
            children: true,
            teachers: true,
            nurses: true,
            doctors: true,
            managers: true,
          },
        },
      },
    });

    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    return { success: true, data: branch };
  } catch (error) {
    console.error("Failed to fetch branch:", error);
    return { success: false, error: "Failed to fetch branch" };
  }
}

// ---------------------------------------------------------------------------
// createBranch
// ---------------------------------------------------------------------------

export async function createBranch(data: BranchData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const branch = await db.branch.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        organizationId: data.organizationId,
      },
    });

    revalidatePath("/branches");

    return { success: true, data: branch };
  } catch (error) {
    console.error("Failed to create branch:", error);
    return { success: false, error: "Failed to create branch" };
  }
}

// ---------------------------------------------------------------------------
// updateBranch
// ---------------------------------------------------------------------------

export async function updateBranch(
  id: string,
  data: Partial<BranchData>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.organizationId !== undefined)
      updateData.organizationId = data.organizationId;

    const branch = await db.branch.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/branches");

    return { success: true, data: branch };
  } catch (error) {
    console.error("Failed to update branch:", error);
    return { success: false, error: "Failed to update branch" };
  }
}

// ---------------------------------------------------------------------------
// deleteBranch (soft delete — set isActive=false)
// ---------------------------------------------------------------------------

export async function deleteBranch(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.branch.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/branches");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete branch:", error);
    return { success: false, error: "Failed to delete branch" };
  }
}
