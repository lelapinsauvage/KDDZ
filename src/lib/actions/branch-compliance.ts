"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireLegacyActionAllowed } from "@/lib/legacy-action-permissions";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import { calculateCompletionPercentage } from "@/lib/validations/branch";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// getCompliance
// ---------------------------------------------------------------------------

export async function getCompliance(branchId: string): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in organization" };
    }

    const compliance = await db.branchCompliance.findUnique({
      where: { branchId },
    });

    return { success: true, data: compliance };
  } catch (error) {
    console.error("Failed to fetch compliance:", error);
    return { success: false, error: "Failed to fetch compliance data" };
  }
}

// ---------------------------------------------------------------------------
// upsertCompliance
// ---------------------------------------------------------------------------

export async function upsertCompliance(
  branchId: string,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    const permission = await requireLegacyActionAllowed(res.ctx, "Upnurseryinfo");
    if (!permission.ok) return { success: false, error: permission.error };

    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in organization" };
    }

    const completionPercentage = calculateCompletionPercentage(data);

    // Build data object — filter out non-schema fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...data, completionPercentage };
    delete payload.id;
    delete payload.branchId;
    delete payload.createdAt;
    delete payload.updatedAt;

    // Convert date fields
    for (const dateKey of ["registrationDate", "ownerDob"]) {
      if (typeof payload[dateKey] === "string" && payload[dateKey]) {
        payload[dateKey] = new Date(payload[dateKey]);
      } else if (!payload[dateKey]) {
        payload[dateKey] = null;
      }
    }

    // Convert number fields
    for (const key of ["totalChildren", "walkers", "nonWalkers"]) {
      if (payload[key] !== undefined && payload[key] !== null) {
        payload[key] = Number(payload[key]) || 0;
      }
    }

    const compliance = await db.branchCompliance.upsert({
      where: { branchId },
      create: { branchId, ...payload },
      update: payload,
    });

    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/branches/${branchId}/compliance`);
    revalidatePath("/branches");
    revalidatePath("/settings/nursery");

    return { success: true, data: compliance };
  } catch (error) {
    console.error("Failed to save compliance:", error);
    return { success: false, error: "Failed to save compliance data" };
  }
}

// ---------------------------------------------------------------------------
// getDocuments
// ---------------------------------------------------------------------------

export async function getDocuments(branchId: string): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in organization" };
    }

    const documents = await db.branchDocument.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// ---------------------------------------------------------------------------
// upsertDocument
// ---------------------------------------------------------------------------

export async function upsertDocument(
  branchId: string,
  data: {
    id?: string;
    documentType: string;
    label?: string;
    filename?: string;
    fileUrl?: string;
    issueDate?: string;
    expiryDate?: string;
    status?: string;
    notes?: string;
  },
): Promise<ActionResult> {
  try {
    const res = await requireOrgSafe();
    if (!res.ok) return { success: false, error: res.error };
    const { organizationId: orgId } = res.ctx;

    const permission = await requireLegacyActionAllowed(res.ctx, "Upnurseryinfo");
    if (!permission.ok) return { success: false, error: permission.error };

    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in organization" };
    }

    if (data.id) {
      const existing = await db.branchDocument.findUnique({
        where: { id: data.id },
        select: { branchId: true },
      });
      if (!existing || existing.branchId !== branchId) {
        return { success: false, error: "Document not found in branch" };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      documentType: data.documentType,
      label: data.label ?? null,
      filename: data.filename ?? null,
      fileUrl: data.fileUrl ?? null,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status: data.status ?? "PENDING",
      notes: data.notes ?? null,
    };

    let doc;
    if (data.id) {
      doc = await db.branchDocument.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      doc = await db.branchDocument.create({
        data: { branchId, ...payload },
      });
    }

    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/branches/${branchId}/compliance`);
    revalidatePath("/settings/nursery");

    return { success: true, data: doc };
  } catch (error) {
    console.error("Failed to save document:", error);
    return { success: false, error: "Failed to save document" };
  }
}

// ---------------------------------------------------------------------------
// getStaffForCompliance — returns all employees for a branch with their docs
// ---------------------------------------------------------------------------

export async function getStaffForCompliance(branchId: string): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in organization" };
    }

    const [teachers, nurses, doctors, managers] = await Promise.all([
      db.teacher.findMany({
        where: { branchId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hireDate: true,
          documents: { select: { type: true, title: true, expiryDate: true } },
          attachments: { select: { type: true, filename: true, expiryDate: true } },
        },
        orderBy: { lastName: "asc" },
      }),
      db.nurse.findMany({
        where: { branchId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hireDate: true,
          documents: { select: { type: true, title: true, expiryDate: true } },
          attachments: { select: { type: true, filename: true, expiryDate: true } },
        },
        orderBy: { lastName: "asc" },
      }),
      db.doctor.findMany({
        where: { branchId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hireDate: true,
          documents: { select: { type: true, title: true, expiryDate: true } },
          attachments: { select: { type: true, title: true, filename: true, expiryDate: true } },
        },
        orderBy: { lastName: "asc" },
      }),
      db.manager.findMany({
        where: { branchId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hireDate: true,
          attachments: { select: { type: true, title: true, filename: true, expiryDate: true } },
        },
        orderBy: { lastName: "asc" },
      }),
    ]);

    const staff = [
      ...teachers.map((t) => ({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        hireDate: t.hireDate,
        type: "teacher",
        documents: [
          ...t.documents,
          ...t.attachments.map((a) => ({
            type: a.type ?? "ATTACHMENT",
            title: a.filename,
            expiryDate: a.expiryDate,
          })),
        ],
      })),
      ...nurses.map((n) => ({
        id: n.id,
        firstName: n.firstName,
        lastName: n.lastName,
        hireDate: n.hireDate,
        type: "nurse",
        documents: [
          ...n.documents,
          ...n.attachments.map((a) => ({
            type: a.type ?? "ATTACHMENT",
            title: a.filename,
            expiryDate: a.expiryDate,
          })),
        ],
      })),
      ...doctors.map((d) => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        hireDate: d.hireDate,
        type: "doctor",
        documents: [
          ...d.documents,
          ...d.attachments.map((a) => ({
            type: a.type ?? "ATTACHMENT",
            title: a.title ?? a.filename,
            expiryDate: a.expiryDate,
          })),
        ],
      })),
      ...managers.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        hireDate: m.hireDate,
        type: "manager",
        documents: m.attachments.map((a) => ({
          type: a.type ?? "ATTACHMENT",
          title: a.title ?? a.filename,
          expiryDate: a.expiryDate,
        })),
      })),
    ];

    return { success: true, data: staff };
  } catch (error) {
    console.error("Failed to fetch staff for compliance:", error);
    return { success: false, error: "Failed to fetch staff" };
  }
}
