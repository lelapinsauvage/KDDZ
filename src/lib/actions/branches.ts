"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { requireLegacyActionAllowed } from "@/lib/legacy-action-permissions";
import { verifyBranchAccess } from "@/lib/verify-org-access";

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
  imageUrl?: string | null;
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
    const { organizationId: orgId } = await requireOrg();

    const branches = await db.branch.findMany({
      where: { organizationId: orgId },
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
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    });

    const sortedBranches = branches.sort((a, b) => {
      if (a.legacyId != null && b.legacyId != null && a.legacyId !== b.legacyId) {
        return b.legacyId - a.legacyId;
      }
      if (a.legacyId != null && b.legacyId == null) return -1;
      if (a.legacyId == null && b.legacyId != null) return 1;
      const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.name.localeCompare(b.name);
    });

    return { success: true, data: sortedBranches };
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
    const { organizationId: orgId } = await requireOrg();

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

    if (branch.organizationId !== orgId) {
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

export async function createBranch(
  data: Omit<BranchData, "organizationId">,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "addBranch");
    if (!permission.ok) return { success: false, error: permission.error };

    const branch = await db.branch.create({
      data: {
        name: data.name,
        prefix: data.prefix ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        telephone: data.telephone ?? null,
        email: data.email ?? null,
        imageUrl: data.imageUrl ?? null,
        themeColor: data.themeColor ?? "#1caf9a",
        isActive: data.isActive ?? true,
        organizationId: ctx.organizationId,
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
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "updateBranch");
    if (!permission.ok) return { success: false, error: permission.error };

    const hasAccess = await verifyBranchAccess(id, ctx.organizationId);
    if (!hasAccess) return { success: false, error: "Branch not found" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.prefix !== undefined) updateData.prefix = data.prefix;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    // Never allow changing organizationId

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

export async function setNewBranchImage(
  id: string,
  imageUrl: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "addBranch");
    if (!permission.ok) return { success: false, error: permission.error };

    const branch = await db.branch.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    if (!branch || branch.organizationId !== ctx.organizationId) {
      return { success: false, error: "Branch not found" };
    }

    const createdRecently =
      Date.now() - branch.createdAt.getTime() <= 15 * 60 * 1000;
    if (branch.imageUrl || !createdRecently) {
      return { success: false, error: "Access denied" };
    }

    const updated = await db.branch.update({
      where: { id },
      data: { imageUrl },
    });

    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to set new branch image:", error);
    return { success: false, error: "Failed to set branch image" };
  }
}

// ---------------------------------------------------------------------------
// deleteBranch (soft delete — set isActive=false)
// ---------------------------------------------------------------------------

export async function deleteBranch(id: string): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "deleteBranch");
    if (!permission.ok) return { success: false, error: permission.error };

    const hasAccess = await verifyBranchAccess(id, ctx.organizationId);
    if (!hasAccess) return { success: false, error: "Branch not found" };

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
