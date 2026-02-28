"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

interface CreateOrgData {
  name: string;
  slug: string;
  plan?: string;
  adminEmail: string;
  adminName: string;
}

interface UpdateOrgData {
  name?: string;
  slug?: string;
  plan?: string;
  isActive?: boolean;
}

interface CreateOrgUserData {
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
  branchId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: ADMIN only");
  }
  return session.user;
}

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url"); // ~8 chars
}

// ---------------------------------------------------------------------------
// getOrganizations
// ---------------------------------------------------------------------------

export async function getOrganizations(): Promise<ActionResult> {
  try {
    await requireAdmin();

    const organizations = await db.organization.findMany({
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: organizations };
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch organizations",
    };
  }
}

// ---------------------------------------------------------------------------
// getOrganization
// ---------------------------------------------------------------------------

export async function getOrganization(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            isActive: true,
            _count: { select: { children: true, teachers: true } },
          },
          orderBy: { name: "asc" },
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            branch: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { branches: true, users: true, schoolYears: true },
        },
      },
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    return { success: true, data: organization };
  } catch (error) {
    console.error("Failed to fetch organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch organization",
    };
  }
}

// ---------------------------------------------------------------------------
// createOrganization
// ---------------------------------------------------------------------------

export async function createOrganization(
  data: CreateOrgData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await db.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return { success: false, error: "Slug already in use" };
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 12);

    const now = new Date();
    const yearLabel = `${now.getFullYear()}-${now.getFullYear() + 1}`;
    const startDate = new Date(now.getFullYear(), 8, 1); // Sep 1
    const endDate = new Date(now.getFullYear() + 1, 6, 31); // Jul 31

    const org = await db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan ?? "free",
        branches: {
          create: {
            name: "Main Branch",
            isActive: true,
          },
        },
        schoolYears: {
          create: {
            label: yearLabel,
            startDate,
            endDate,
            isActive: true,
          },
        },
        users: {
          create: {
            email: data.adminEmail,
            name: data.adminName,
            passwordHash,
            role: "ADMIN",
            isActive: true,
          },
        },
      },
      include: {
        branches: true,
        users: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    revalidatePath("/settings/organizations");

    return { success: true, data: { organization: org, tempPassword } };
  } catch (error) {
    console.error("Failed to create organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create organization",
    };
  }
}

// ---------------------------------------------------------------------------
// updateOrganization
// ---------------------------------------------------------------------------

export async function updateOrganization(
  id: string,
  data: UpdateOrgData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const org = await db.organization.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/organizations");
    revalidatePath(`/settings/organizations/${id}`);

    return { success: true, data: org };
  } catch (error) {
    console.error("Failed to update organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update organization",
    };
  }
}

// ---------------------------------------------------------------------------
// toggleOrganizationStatus
// ---------------------------------------------------------------------------

export async function toggleOrganizationStatus(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const org = await db.organization.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!org) return { success: false, error: "Organization not found" };

    const updated = await db.organization.update({
      where: { id },
      data: { isActive: !org.isActive },
    });

    revalidatePath("/settings/organizations");
    revalidatePath(`/settings/organizations/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle organization status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle status",
    };
  }
}

// ---------------------------------------------------------------------------
// createOrgUser
// ---------------------------------------------------------------------------

export async function createOrgUser(
  orgId: string,
  data: CreateOrgUserData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return { success: false, error: "Email already in use" };
    }

    const org = await db.organization.findUnique({ where: { id: orgId } });
    if (!org) return { success: false, error: "Organization not found" };

    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 12);

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        passwordHash,
        isActive: true,
        organizationId: orgId,
        branchId: data.branchId ?? null,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    revalidatePath(`/settings/organizations/${orgId}`);

    return { success: true, data: { user, tempPassword } };
  } catch (error) {
    console.error("Failed to create org user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

// ---------------------------------------------------------------------------
// resetUserPassword
// ---------------------------------------------------------------------------

export async function resetUserPassword(
  userId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true },
    });
    if (!user) return { success: false, error: "User not found" };

    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 12);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    if (user.organizationId) {
      revalidatePath(`/settings/organizations/${user.organizationId}`);
    }

    return { success: true, data: { tempPassword } };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}
