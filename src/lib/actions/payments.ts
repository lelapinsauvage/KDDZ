"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type {
  PaymentMethod,
  PaymentCategory,
  PaymentStatus,
} from "@/generated/prisma/client";
import { quickPaymentSchema, type QuickPaymentInput } from "@/lib/validations/payments";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentListParams {
  childId?: string;
  branchId?: string;
  classId?: string;
  method?: PaymentMethod;
  category?: PaymentCategory;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CreatePaymentData {
  childId: string;
  amount: number;
  currency?: string;
  date: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  month?: number | null;
  method: PaymentMethod;
  category: PaymentCategory;
  status?: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
}

interface UpdatePaymentData {
  childId?: string;
  amount?: number;
  currency?: string;
  date?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  month?: number | null;
  method?: PaymentMethod;
  category?: PaymentCategory;
  status?: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// getPayments — Full listing with filters
// ---------------------------------------------------------------------------

export async function getPayments(
  params: PaymentListParams = {},
): Promise<ActionResult> {
  try {
    const {
      childId,
      branchId,
      classId,
      method,
      category,
      status,
      dateFrom,
      dateTo,
      search,
      page = 1,
      pageSize = 500,
    } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (childId) where.childId = childId;
    if (method) where.method = method;
    if (category) where.category = category;
    if (status) where.status = status;

    // Branch/class filter via child relation
    if (branchId || classId || search) {
      where.child = {};
      if (branchId) where.child.branchId = branchId;
      if (classId) where.child.classId = classId;
      if (search) {
        where.child.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const skip = (page - 1) * pageSize;

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          child: {
            include: {
              branch: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          },
          createdBy: {
            select: { id: true, name: true },
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
// getPaymentsSummary — Summary cards data
// ---------------------------------------------------------------------------

export async function getPaymentsSummary(
  params: { branchId?: string; dateFrom?: string; dateTo?: string } = {},
): Promise<ActionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (params.branchId) {
      where.child = { branchId: params.branchId };
    }
    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) where.date.gte = new Date(params.dateFrom);
      if (params.dateTo) where.date.lte = new Date(params.dateTo);
    }

    // Total revenue (all PAID)
    const paidWhere = { ...where, status: "PAID" as PaymentStatus };
    const totalRevenue = await db.payment.aggregate({
      where: paidWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Total pending
    const pendingWhere = { ...where, status: "PENDING" as PaymentStatus };
    const totalPending = await db.payment.aggregate({
      where: pendingWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Total overdue
    const overdueWhere = { ...where, status: "OVERDUE" as PaymentStatus };
    const totalOverdue = await db.payment.aggregate({
      where: overdueWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // This month's collections
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthWhere = {
      ...where,
      status: "PAID" as PaymentStatus,
      date: { gte: startOfMonth, lte: endOfMonth },
    };
    const thisMonth = await db.payment.aggregate({
      where: monthWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Breakdown by category
    const byCategory = await db.payment.groupBy({
      by: ["category"],
      where: paidWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Breakdown by method
    const byMethod = await db.payment.groupBy({
      by: ["method"],
      where: paidWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        revenueCount: totalRevenue._count.id,
        totalPending: Number(totalPending._sum.amount ?? 0),
        pendingCount: totalPending._count.id,
        totalOverdue: Number(totalOverdue._sum.amount ?? 0),
        overdueCount: totalOverdue._count.id,
        thisMonthCollections: Number(thisMonth._sum.amount ?? 0),
        thisMonthCount: thisMonth._count.id,
        byCategory: byCategory.map((e) => ({
          category: e.category,
          total: Number(e._sum.amount ?? 0),
          count: e._count.id,
        })),
        byMethod: byMethod.map((e) => ({
          method: e.method,
          total: Number(e._sum.amount ?? 0),
          count: e._count.id,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch payments summary:", error);
    return { success: false, error: "Failed to fetch payments summary" };
  }
}

// ---------------------------------------------------------------------------
// createPayment
// ---------------------------------------------------------------------------

export async function createPayment(
  data: CreatePaymentData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate child exists
    const child = await db.child.findUnique({ where: { id: data.childId } });
    if (!child) {
      return { success: false, error: "Child not found" };
    }

    const payment = await db.payment.create({
      data: {
        childId: data.childId,
        amount: data.amount,
        currency: data.currency ?? "USD",
        date: new Date(data.date),
        dateFrom: data.dateFrom ? new Date(data.dateFrom) : null,
        dateTo: data.dateTo ? new Date(data.dateTo) : null,
        month: data.month ?? null,
        method: data.method,
        category: data.category,
        status: data.status ?? "PAID",
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/accounting");
    revalidatePath(`/children/${data.childId}/accounting`);

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
  data: UpdatePaymentData,
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
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.dateFrom !== undefined)
      updateData.dateFrom = data.dateFrom ? new Date(data.dateFrom) : null;
    if (data.dateTo !== undefined)
      updateData.dateTo = data.dateTo ? new Date(data.dateTo) : null;
    if (data.month !== undefined) updateData.month = data.month;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/accounting");

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

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    await db.payment.delete({ where: { id } });

    revalidatePath("/accounting");
    revalidatePath(`/children/${payment.childId}/accounting`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}

// ---------------------------------------------------------------------------
// getChildPayments — Per-child payment history
// ---------------------------------------------------------------------------

export async function getChildPayments(childId: string): Promise<ActionResult> {
  try {
    const payments = await db.payment.findMany({
      where: { childId },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Summary
    const paid = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const overdue = payments
      .filter((p) => p.status === "OVERDUE")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    for (const p of payments) {
      if (p.status === "PAID") {
        byCategory[p.category] = (byCategory[p.category] ?? 0) + Number(p.amount);
      }
    }

    return {
      success: true,
      data: {
        payments,
        summary: {
          totalPaid: paid,
          totalPending: pending,
          totalOverdue: overdue,
          byCategory,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch child payments:", error);
    return { success: false, error: "Failed to fetch child payments" };
  }
}

// ---------------------------------------------------------------------------
// getOverduePayments — Children with overdue payments
// ---------------------------------------------------------------------------

export async function getOverduePayments(): Promise<ActionResult> {
  try {
    const overduePayments = await db.payment.findMany({
      where: { status: "OVERDUE" },
      include: {
        child: {
          include: {
            branch: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Group by child
    const childMap = new Map<
      string,
      {
        child: (typeof overduePayments)[0]["child"];
        payments: typeof overduePayments;
        totalOverdue: number;
      }
    >();

    for (const p of overduePayments) {
      const existing = childMap.get(p.childId);
      if (existing) {
        existing.payments.push(p);
        existing.totalOverdue += Number(p.amount);
      } else {
        childMap.set(p.childId, {
          child: p.child,
          payments: [p],
          totalOverdue: Number(p.amount),
        });
      }
    }

    return {
      success: true,
      data: {
        overdueByChild: Array.from(childMap.values()).sort(
          (a, b) => b.totalOverdue - a.totalOverdue,
        ),
        totalOverdue: overduePayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        ),
        totalCount: overduePayments.length,
      },
    };
  } catch (error) {
    console.error("Failed to fetch overdue payments:", error);
    return { success: false, error: "Failed to fetch overdue payments" };
  }
}

// ---------------------------------------------------------------------------
// getChildrenForPayment — Light child list for payment form selector
// ---------------------------------------------------------------------------

export async function getChildrenForPayment(): Promise<ActionResult> {
  try {
    const children = await db.child.findMany({
      where: { isActive: true, isDraft: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branchId: true,
        branch: { select: { name: true } },
        class: { select: { name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return { success: true, data: children };
  } catch (error) {
    console.error("Failed to fetch children for payment:", error);
    return { success: false, error: "Failed to fetch children" };
  }
}

// ---------------------------------------------------------------------------
// recordPayment — Quick payment recording (zod-validated)
// ---------------------------------------------------------------------------

export async function recordPayment(
  input: QuickPaymentInput,
): Promise<ActionResult<{ id: string; childName: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = quickPaymentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const { childId, amount, method, category, notes } = parsed.data;

    const child = await db.child.findUnique({
      where: { id: childId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!child) {
      return { success: false, error: "Child not found" };
    }

    const payment = await db.payment.create({
      data: {
        childId,
        amount,
        currency: "USD",
        date: new Date(),
        method,
        category,
        status: "PAID",
        notes: notes || null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/accounting");
    revalidatePath(`/children/${childId}/accounting`);

    return {
      success: true,
      data: {
        id: payment.id,
        childName: `${child.firstName} ${child.lastName}`,
      },
    };
  } catch (error) {
    console.error("Failed to record payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}
