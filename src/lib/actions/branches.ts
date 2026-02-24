"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BranchData {
  name: string;
  prefix?: string | null;
  address?: string | null;
  phone?: string | null;
  telephone?: string | null;
  email?: string | null;
  themeColor?: string | null;
  isActive?: boolean;
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
        compliance: {
          select: { completionPercentage: true },
        },
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
        compliance: true,
        _count: {
          select: {
            classes: true,
            children: true,
            teachers: true,
            nurses: true,
            doctors: true,
            managers: true,
            documents: true,
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
// getOrganizationId — helper to resolve the default organization
// ---------------------------------------------------------------------------

async function getDefaultOrganizationId(): Promise<string | null> {
  const org = await db.organization.findFirst({ select: { id: true } });
  return org?.id ?? null;
}

// ---------------------------------------------------------------------------
// createBranch
// ---------------------------------------------------------------------------

export async function createBranch(
  data: Omit<BranchData, "organizationId"> & { organizationId?: string },
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const organizationId =
      data.organizationId ?? (await getDefaultOrganizationId());
    if (!organizationId) {
      return { success: false, error: "No organization found" };
    }

    const branch = await db.branch.create({
      data: {
        name: data.name,
        prefix: data.prefix ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        telephone: data.telephone ?? null,
        email: data.email ?? null,
        themeColor: data.themeColor ?? "#1caf9a",
        isActive: data.isActive ?? true,
        organizationId,
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
    if (data.prefix !== undefined) updateData.prefix = data.prefix;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.organizationId !== undefined)
      updateData.organizationId = data.organizationId;

    const branch = await db.branch.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);

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
