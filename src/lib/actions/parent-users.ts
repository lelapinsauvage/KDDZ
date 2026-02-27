"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import { hash } from "bcryptjs";

const MIN_PASSWORD_LENGTH = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParentUserListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface ParentUserData {
  username: string;
  password: string;
  childId: string;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// getParentUsers
// ---------------------------------------------------------------------------

export async function getParentUsers(
  params: ParentUserListParams = {},
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const { search, isActive, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { child: { branch: { organizationId: orgId } } };

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        {
          child: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [parentUsers, total] = await Promise.all([
      db.parentUser.findMany({
        where,
        select: {
          id: true,
          username: true,
          childId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          child: {
            include: {
              branch: true,
              parents: {
                select: {
                  type: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { username: "asc" },
        skip,
        take: pageSize,
      }),
      db.parentUser.count({ where }),
    ]);

    return {
      success: true,
      data: {
        parentUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Failed to fetch parent users:", error);
    return { success: false, error: "Failed to fetch parent users" };
  }
}

// ---------------------------------------------------------------------------
// getParentUser
// ---------------------------------------------------------------------------

export async function getParentUser(id: string): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const parentUser = await db.parentUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        childId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        child: {
          include: {
            branch: true,
            class: true,
            parents: {
              select: {
                type: true,
                firstName: true,
                lastName: true,
                phone: true,
                mobile: true,
                email: true,
              },
            },
            relatives: {
              select: {
                name: true,
                relation: true,
                phone: true,
                isAuthorized: true,
              },
            },
          },
        },
      },
    });

    if (!parentUser) {
      return { success: false, error: "Parent user not found" };
    }

    if (parentUser.child.branch.organizationId !== orgId) {
      return { success: false, error: "Parent user not found" };
    }

    return { success: true, data: parentUser };
  } catch (error) {
    console.error("Failed to fetch parent user:", error);
    return { success: false, error: "Failed to fetch parent user" };
  }
}

// ---------------------------------------------------------------------------
// createParentUser
// ---------------------------------------------------------------------------

export async function createParentUser(
  data: ParentUserData,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    if (!(await verifyChildAccess(data.childId, orgId))) {
      return { success: false, error: "Child not found in organization" };
    }

    if (!data.password || data.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    const passwordHash = await hash(data.password, 12);

    const parentUser = await db.parentUser.create({
      data: {
        username: data.username,
        passwordHash,
        childId: data.childId,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        username: true,
        childId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/settings/parent-users");

    return { success: true, data: parentUser };
  } catch (error) {
    console.error("Failed to create parent user:", error);
    // Handle unique constraint violation on username
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: "Failed to create parent user" };
  }
}

// ---------------------------------------------------------------------------
// updateParentUser
// ---------------------------------------------------------------------------

export async function updateParentUser(
  id: string,
  data: Partial<Omit<ParentUserData, "password">>,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    const existing = await db.parentUser.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing || existing.child.branch.organizationId !== orgId) {
      return { success: false, error: "Parent user not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.childId !== undefined) updateData.childId = data.childId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const parentUser = await db.parentUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        childId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/settings/parent-users");

    return { success: true, data: parentUser };
  } catch (error) {
    console.error("Failed to update parent user:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: "Failed to update parent user" };
  }
}

// ---------------------------------------------------------------------------
// resetParentPassword
// ---------------------------------------------------------------------------

export async function resetParentPassword(
  id: string,
  newPassword: string,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    const existing = await db.parentUser.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing || existing.child.branch.organizationId !== orgId) {
      return { success: false, error: "Parent user not found" };
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    const passwordHash = await hash(newPassword, 12);

    await db.parentUser.update({
      where: { id },
      data: { passwordHash },
    });

    revalidatePath("/settings/parent-users");

    return { success: true };
  } catch (error) {
    console.error("Failed to reset parent password:", error);
    return { success: false, error: "Failed to reset parent password" };
  }
}

// ---------------------------------------------------------------------------
// toggleParentUserStatus
// ---------------------------------------------------------------------------

export async function toggleParentUserStatus(
  id: string,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    const parentUser = await db.parentUser.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });

    if (!parentUser || parentUser.child.branch.organizationId !== orgId) {
      return { success: false, error: "Parent user not found" };
    }

    const updated = await db.parentUser.update({
      where: { id },
      data: { isActive: !parentUser.isActive },
      select: {
        id: true,
        username: true,
        childId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/settings/parent-users");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle parent user status:", error);
    return {
      success: false,
      error: "Failed to toggle parent user status",
    };
  }
}
