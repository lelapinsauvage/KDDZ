"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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
    const { search, isActive, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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
            include: { branch: true },
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
          include: { branch: true, class: true },
        },
      },
    });

    if (!parentUser) {
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parentUser = await db.parentUser.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!parentUser) {
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
