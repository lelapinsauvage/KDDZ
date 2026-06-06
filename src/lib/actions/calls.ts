"use server";

import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import { revalidatePath } from "next/cache";
import type { CallDirection, Prisma } from "@/generated/prisma/client";

// ── Types ─────────────────────────────────────────

interface GetCallLogsParams {
  childId?: string;
  branchId?: string;
  classId?: string;
  direction?: CallDirection;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CreateCallLogData {
  childId: string;
  direction: CallDirection;
  date: string;
  time?: string;
  contact?: string;
  phone?: string;
  subject?: string;
  reason?: string;
  remarks?: string;
  staffId?: string;
  attachments?: Array<{
    title?: string;
    filename: string;
    fileUrl: string;
  }>;
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ── getChildCallLogs ────────────────────────────

export async function getChildCallLogs(childId: string) {
  try {
    const { organizationId: orgId } = await requireOrg();

    if (!(await verifyChildAccess(childId, orgId))) {
      return [];
    }

    const calls = await db.callLog.findMany({
      where: { childId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        attachments: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
    });

    return calls;
  } catch (error) {
    console.error("getChildCallLogs error:", error);
    return [];
  }
}

// ── getCallLogs — List with filtering & pagination ──

export async function getCallLogs(params: GetCallLogsParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const {
      childId,
      branchId,
      classId,
      direction,
      dateFrom,
      dateTo,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const childWhere: Prisma.ChildWhereInput = {
      branch: { organizationId: orgId },
    };

    if (branchId) {
      childWhere.branchId = branchId;
    }
    if (classId) {
      childWhere.classId = classId;
    }

    const where: Prisma.CallLogWhereInput = {
      child: childWhere,
    };
    if (childId) where.childId = childId;
    if (direction) where.direction = direction;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { contact: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { child: { firstName: { contains: search, mode: "insensitive" } } },
        { child: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [calls, total] = await Promise.all([
      db.callLog.findMany({
        where,
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              branchId: true,
              classId: true,
              branch: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { attachments: true },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      db.callLog.count({ where }),
    ]);

    return { calls, total };
  } catch (error) {
    console.error("getCallLogs error:", error);
    return { calls: [], total: 0 };
  }
}

// ── getCallCauseOptions — migrated callparent/callcauses lookup ──

export async function getCallCauseOptions() {
  try {
    await requireOrg();

    const causes = await db.callCause.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: [
        { category: { name: "asc" } },
        { parentLabel: "asc" },
        { childLabel: "asc" },
      ],
    });

    return causes
      .map((cause) => {
        const category = cause.category?.name ?? cause.parentLabel ?? "";
        const childLabel = cause.childLabel ?? "";
        const label = childLabel || category;
        if (!label) return null;

        return {
          id: cause.id,
          category,
          label,
          value: category && childLabel ? `${category}: ${childLabel}` : label,
        };
      })
      .filter((cause): cause is NonNullable<typeof cause> => cause !== null);
  } catch (error) {
    console.error("getCallCauseOptions error:", error);
    return [];
  }
}

// ── getCallChildOptions — active children for global call logging ──

export async function getCallChildOptions() {
  try {
    const { organizationId: orgId } = await requireOrg();

    return await db.child.findMany({
      where: {
        branch: { organizationId: orgId },
        isActive: true,
        isDraft: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  } catch (error) {
    console.error("getCallChildOptions error:", error);
    return [];
  }
}

// ── createCallLog ─────────────────────────────────

export async function createCallLog(
  data: CreateCallLogData
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    if (!data.childId) {
      return { success: false, error: "Child ID is required" };
    }
    if (!data.direction) {
      return { success: false, error: "Direction is required" };
    }
    if (!data.date) {
      return { success: false, error: "Date is required" };
    }

    if (!(await verifyChildAccess(data.childId, ctx.organizationId))) {
      return { success: false, error: "Child not found" };
    }

    const call = await db.callLog.create({
      data: {
        childId: data.childId,
        direction: data.direction,
        date: new Date(data.date),
        time: data.time ? new Date(`1970-01-01T${data.time}`) : null,
        contact: data.contact || null,
        phone: data.phone || null,
        subject: data.subject || null,
        reason: data.reason || null,
        remarks: data.remarks || null,
        staffId: data.staffId || null,
        createdById: ctx.userId,
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((attachment) => ({
                childId: data.childId,
                formType: "CALL_LOG",
                title: attachment.title ?? null,
                filename: attachment.filename,
                fileUrl: attachment.fileUrl,
              })),
            }
          : undefined,
      },
    });

    revalidatePath(`/children/${data.childId}/calls`);
    revalidatePath("/calls");

    return { success: true, id: call.id };
  } catch (error) {
    console.error("createCallLog error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create call log";
    return { success: false, error: message };
  }
}

// ── deleteCallLog ─────────────────────────────────

export async function deleteCallLog(id: string): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.callLog.findUnique({
      where: { id },
      include: { child: { include: { branch: { select: { organizationId: true } } } } },
    });
    if (!existing || existing.child.branch.organizationId !== ctx.organizationId) {
      return { success: false, error: "Call log not found" };
    }

    await db.callLog.delete({ where: { id } });

    revalidatePath(`/children/${existing.childId}/calls`);
    revalidatePath("/calls");

    return { success: true, id };
  } catch (error) {
    console.error("deleteCallLog error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete call log";
    return { success: false, error: message };
  }
}
