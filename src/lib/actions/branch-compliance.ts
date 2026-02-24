"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const completionPercentage = calculateCompletionPercentage(data);

    // Build data object — filter out non-schema fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...data, completionPercentage };
    delete payload.id;
    delete payload.branchId;
    delete payload.createdAt;
    delete payload.updatedAt;

    // Convert registrationDate string to Date if present
    if (typeof payload.registrationDate === "string" && payload.registrationDate) {
      payload.registrationDate = new Date(payload.registrationDate);
    } else if (!payload.registrationDate) {
      payload.registrationDate = null;
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
    revalidatePath("/branches");

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
    const documents = await db.branchDocument.findMany({
      where: { branchId },
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
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

    return { success: true, data: doc };
  } catch (error) {
    console.error("Failed to save document:", error);
    return { success: false, error: "Failed to save document" };
  }
}
