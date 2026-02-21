"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { PaymentMethod } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentListParams {
  childId?: string;
  method?: PaymentMethod;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  pageSize?: number;
}

interface PaymentData {
  childId: string;
  amount: number;
  date: Date | string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? new Date(value) : value;
}

// ---------------------------------------------------------------------------
// getPayments
// ---------------------------------------------------------------------------

export async function getPayments(
  params: PaymentListParams = {},
): Promise<ActionResult> {
  try {
    const {
      childId,
      method,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 20,
    } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (childId) {
      where.childId = childId;
    }

    if (method) {
      where.method = method;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = toDate(dateFrom);
      }
      if (dateTo) {
        where.date.lte = toDate(dateTo);
      }
    }

    const skip = (page - 1) * pageSize;

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          child: {
            include: {
              branch: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      db.payment.count({ where }),
    ]);

    return {
      success: true,
      data: {
        payments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return { success: false, error: "Failed to fetch payments" };
  }
}

// ---------------------------------------------------------------------------
// createPayment
// ---------------------------------------------------------------------------

export async function createPayment(
  data: PaymentData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const payment = await db.payment.create({
      data: {
        childId: data.childId,
        amount: data.amount,
        date: toDate(data.date)!,
        method: data.method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/payments");
    revalidatePath(`/children/${data.childId}`);

    return { success: true, data: payment };
  } catch (error) {
    console.error("Failed to create payment:", error);
    return { success: false, error: "Failed to create payment" };
  }
}

// ---------------------------------------------------------------------------
// updatePayment
// ---------------------------------------------------------------------------

export async function updatePayment(
  id: string,
  data: Partial<PaymentData>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.childId !== undefined) updateData.childId = data.childId;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = toDate(data.date);
    if (data.method !== undefined) updateData.method = data.method;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/payments");

    return { success: true, data: payment };
  } catch (error) {
    console.error("Failed to update payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}

// ---------------------------------------------------------------------------
// deletePayment
// ---------------------------------------------------------------------------

export async function deletePayment(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.payment.delete({ where: { id } });

    revalidatePath("/payments");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}

// ---------------------------------------------------------------------------
// getPaymentsSummary
// ---------------------------------------------------------------------------

export async function getPaymentsSummary(
  childId?: string,
): Promise<ActionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (childId) {
      where.childId = childId;
    }

    // Total paid
    const totalAggregate = await db.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Breakdown by method
    const byMethod = await db.payment.groupBy({
      by: ["method"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const methodBreakdown = byMethod.map((entry) => ({
      method: entry.method,
      total: entry._sum.amount,
      count: entry._count.id,
    }));

    return {
      success: true,
      data: {
        totalPaid: totalAggregate._sum.amount,
        totalCount: totalAggregate._count.id,
        byMethod: methodBreakdown,
      },
    };
  } catch (error) {
    console.error("Failed to fetch payment summary:", error);
    return { success: false, error: "Failed to fetch payment summary" };
  }
}
