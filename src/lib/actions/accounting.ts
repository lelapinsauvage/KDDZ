"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import type { AccountingEntryType } from "@/generated/prisma/client";

// ── Types ─────────────────────────────────────────

interface CreateAccountingEntryData {
  childId: string;
  description?: string;
  amount: number;
  type: AccountingEntryType;
  date?: string;
  schoolYearId?: string;
}

interface AccountingSummary {
  totalFees: number;
  totalPayments: number;
  totalDiscounts: number;
  totalAdjustments: number;
  balance: number;
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ── getChildAccounting ────────────────────────────

export async function getChildAccounting(childId: string) {
  try {
    const { organizationId: orgId } = await requireOrg();

    if (!(await verifyChildAccess(childId, orgId))) {
      return [];
    }

    const entries = await db.accountingEntry.findMany({
      where: { childId },
      orderBy: { date: "desc" },
    });

    return entries;
  } catch (error) {
    console.error("getChildAccounting error:", error);
    return [];
  }
}

// ── createAccountingEntry ─────────────────────────

export async function createAccountingEntry(
  data: CreateAccountingEntryData
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    // Validate required fields
    if (!data.childId) {
      return { success: false, error: "Child ID is required" };
    }
    if (data.amount === undefined || data.amount === null) {
      return { success: false, error: "Amount is required" };
    }
    if (!data.type) {
      return { success: false, error: "Entry type is required" };
    }

    // Validate type is one of the allowed values
    const allowedTypes: AccountingEntryType[] = [
      "FEE",
      "DISCOUNT",
      "PAYMENT",
      "ADJUSTMENT",
    ];
    if (!allowedTypes.includes(data.type)) {
      return {
        success: false,
        error: `Invalid entry type. Must be one of: ${allowedTypes.join(", ")}`,
      };
    }

    // Verify child exists and belongs to org
    if (!(await verifyChildAccess(data.childId, ctx.organizationId))) {
      return { success: false, error: "Child not found" };
    }

    const entry = await db.accountingEntry.create({
      data: {
        childId: data.childId,
        description: data.description || null,
        amount: data.amount,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        schoolYearId: data.schoolYearId || null,
      },
    });

    revalidatePath(`/children/${data.childId}/accounting`);
    revalidatePath("/accounting");

    return { success: true, id: entry.id };
  } catch (error) {
    console.error("createAccountingEntry error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create accounting entry";
    return { success: false, error: message };
  }
}

// ── getAccountingSummary ──────────────────────────

export async function getAccountingSummary(
  childId?: string
): Promise<AccountingSummary> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      child: { branch: { organizationId: orgId } },
    };
    if (childId) where.childId = childId;

    const entries = await db.accountingEntry.findMany({
      where,
      select: {
        amount: true,
        type: true,
      },
    });

    let totalFees = 0;
    let totalPayments = 0;
    let totalDiscounts = 0;
    let totalAdjustments = 0;

    for (const entry of entries) {
      const amount = Number(entry.amount);
      switch (entry.type) {
        case "FEE":
          totalFees += amount;
          break;
        case "PAYMENT":
          totalPayments += amount;
          break;
        case "DISCOUNT":
          totalDiscounts += amount;
          break;
        case "ADJUSTMENT":
          totalAdjustments += amount;
          break;
      }
    }

    // Balance = (fees + adjustments) - (payments + discounts)
    const balance =
      totalFees + totalAdjustments - totalPayments - totalDiscounts;

    return {
      totalFees,
      totalPayments,
      totalDiscounts,
      totalAdjustments,
      balance,
    };
  } catch (error) {
    console.error("getAccountingSummary error:", error);
    return {
      totalFees: 0,
      totalPayments: 0,
      totalDiscounts: 0,
      totalAdjustments: 0,
      balance: 0,
    };
  }
}
