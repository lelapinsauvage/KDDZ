"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  channelDeliveryAuditData,
  deliverParentChannelNotification,
  type ChannelDeliverySummary,
  type MessageDeliveryChannel,
} from "@/lib/channel-delivery";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import { hash } from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";

const MIN_PASSWORD_LENGTH = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParentUserListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number | "all";
}

interface ParentUserData {
  username: string;
  password: string;
  childId: string;
  isActive?: boolean;
}

interface ParentUserCredentialDeliveryData {
  channel: MessageDeliveryChannel;
  password: string;
  username?: string;
  childId?: string;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

function legacyObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parentCredentialMessage(username: string, password: string) {
  return `Dear Parent, you can now login to your KiddzOnline account username: ${username} password: ${password} using the KiddzOnline Mobile App Or visit https://kiddzonline.com/Garderie_parent`;
}

function deliveryResultMessage(summary: ChannelDeliverySummary) {
  if (summary.deliveredCount > 0) {
    return `${summary.channel.toUpperCase()} sent to ${summary.deliveredCount} contact(s).`;
  }
  if (summary.failedCount > 0) {
    return `${summary.channel.toUpperCase()} failed for ${summary.failedCount} contact(s).`;
  }
  return (
    summary.errors[0] ??
    `${summary.channel.toUpperCase()} delivery skipped.`
  );
}

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

    const paginated = pageSize !== "all";
    const numericPageSize = paginated ? Math.max(1, pageSize) : undefined;
    const skip = numericPageSize ? (page - 1) * numericPageSize : undefined;

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
            },
          },
        },
        orderBy: { username: "asc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(numericPageSize !== undefined ? { take: numericPageSize } : {}),
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
        totalPages: numericPageSize ? Math.ceil(total / numericPageSize) : 1,
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

    const username = data.username.trim();
    if (!username) {
      return { success: false, error: "Username is required" };
    }

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
        username,
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

    if (data.username !== undefined) {
      const username = data.username.trim();
      if (!username) {
        return { success: false, error: "Username is required" };
      }
      updateData.username = username;
    }
    if (data.childId !== undefined) {
      if (!(await verifyChildAccess(data.childId, orgId))) {
        return { success: false, error: "Child not found in organization" };
      }
      updateData.childId = data.childId;
    }
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
// sendParentUserCredentials
// ---------------------------------------------------------------------------

export async function sendParentUserCredentials(
  id: string,
  data: ParentUserCredentialDeliveryData,
): Promise<ActionResult<{ delivery: ChannelDeliverySummary; message: string }>> {
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

    const username = data.username?.trim() || existing.username;
    if (!username) {
      return { success: false, error: "Username is required" };
    }
    if (!data.password || data.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    const childId = data.childId ?? existing.childId;
    if (childId !== existing.childId && !(await verifyChildAccess(childId, orgId))) {
      return { success: false, error: "Child not found in organization" };
    }

    const passwordHash = await hash(data.password, 12);
    const credentialMessage = parentCredentialMessage(username, data.password);
    const baseLegacyData = legacyObject(existing.legacyData);
    const previousCredentialDelivery = legacyObject(
      baseLegacyData.credentialDelivery,
    );

    await db.parentUser.update({
      where: { id },
      data: {
        username,
        childId,
        isActive: data.isActive ?? existing.isActive,
        passwordHash,
      },
    });

    const delivery = await deliverParentChannelNotification({
      channel: data.channel,
      recipientParentUserIds: [id],
      subject: "KiddzOnline account",
      body: credentialMessage,
      category: "PARENT_CREDENTIALS",
      metadata: {
        source: "legacy_parent_user_credentials",
        parentUserId: id,
        childId,
      },
    });

    await db.parentUser.update({
      where: { id },
      data: {
        legacyData: {
          ...baseLegacyData,
          credentialDelivery: {
            ...previousCredentialDelivery,
            [data.channel]: {
              sentAt: new Date().toISOString(),
              username,
              childId,
              delivery: channelDeliveryAuditData(delivery),
            },
          },
        } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/settings/parent-users");
    revalidatePath(`/settings/parent-users/${id}`);

    return {
      success: true,
      data: {
        delivery,
        message: deliveryResultMessage(delivery),
      },
    };
  } catch (error) {
    console.error("Failed to send parent user credentials:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: "Failed to send parent credentials" };
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
