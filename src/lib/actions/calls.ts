"use server";

import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import { revalidatePath } from "next/cache";
import type { CallDirection, Prisma } from "@/generated/prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/client";

// ── Types ─────────────────────────────────────────

interface GetCallLogsParams {
  childId?: string;
  branchId?: string;
  classId?: string;
  direction?: CallDirection;
  isDraft?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CallLogMutationData {
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
  isDraft?: boolean;
  attachments?: Array<{
    title?: string;
    filename: string;
    fileUrl: string;
  }>;
}

type CreateCallLogData = CallLogMutationData;
type UpdateCallLogData = CallLogMutationData;

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function parseCallDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseCallTime(value?: string) {
  if (!value) return null;
  const [hours = "00", minutes = "00", seconds = "00"] = value.split(":");
  return new Date(
    `1970-01-01T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}.000Z`,
  );
}

function validateCallLogData(data: CallLogMutationData): string | null {
  if (!data.childId) return "Child ID is required";
  if (data.isDraft) return null;
  if (!data.direction) return "Direction is required";
  if (!data.date) return "Date is required";
  if (!data.time) return "Time is required";
  if (!data.reason?.trim()) return "Cause of call is required";
  if (!data.subject?.trim()) return "Subject is required";
  if (!data.staffId) return "Teacher is required";
  return null;
}

function legacyCallType(direction: CallDirection) {
  if (direction === "OUTGOING") return "Outgoing";
  if (direction === "MISSED") return "Missed";
  return "Incoming";
}

function rawLegacyData(
  data: CallLogMutationData,
  child: {
    legacyId: number | null;
    branch: { legacyId: number | null };
    class: { legacyId: number | null } | null;
  },
  legacyTeacherId: number | null,
  existingData?: Prisma.JsonValue | null,
) {
  const existing =
    existingData && typeof existingData === "object" && !Array.isArray(existingData)
      ? (existingData as Record<string, unknown>)
      : {};

  return {
    ...existing,
    child_id: child.legacyId ?? existing.child_id ?? null,
    childid: child.legacyId ?? existing.childid ?? null,
    branch_id: child.branch.legacyId ?? existing.branch_id ?? null,
    class_id: child.class?.legacyId ?? existing.class_id ?? null,
    calltype: legacyCallType(data.direction),
    accident_date: data.date,
    accident_time: data.time ?? "",
    causeofcall: data.reason ?? "",
    subject: data.subject ?? "",
    remarks: data.remarks ?? "",
    teacher_id: legacyTeacherId ?? existing.teacher_id ?? null,
    is_rep_draft: data.isDraft ? 1 : 0,
    modernChildId: data.childId,
    modernStaffId: data.staffId ?? null,
  } satisfies Record<string, unknown>;
}

async function callLogLegacyContext(
  childId: string,
  staffId?: string,
  _existingData?: Prisma.JsonValue | null,
) {
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      legacyId: true,
      branch: { select: { legacyId: true } },
      class: { select: { legacyId: true } },
    },
  });

  if (!child) return null;

  const teacher = staffId
    ? await db.teacher.findFirst({
        where: { OR: [{ id: staffId }, { userId: staffId }] },
        select: { legacyId: true },
      })
    : null;

  return {
    child,
    legacyTeacherId: teacher?.legacyId ?? null,
  };
}

function callLogData(
  data: CallLogMutationData,
  legacyContext: NonNullable<Awaited<ReturnType<typeof callLogLegacyContext>>>,
  existingData?: Prisma.JsonValue | null,
) {
  const normalizedData = {
    ...data,
    date: data.date || todayDate(),
    direction: data.direction || "INCOMING",
  };
  const legacyChild = legacyContext.child;
  const legacyTeacherId = legacyContext.legacyTeacherId;
  return {
    childId: normalizedData.childId,
    direction: normalizedData.direction,
    date: parseCallDate(normalizedData.date),
    time: parseCallTime(normalizedData.time),
    contact: data.contact || null,
    phone: data.phone || null,
    subject: data.subject || null,
    reason: data.reason || null,
    remarks: data.remarks || null,
    staffId: data.staffId || null,
    isDraft: Boolean(data.isDraft),
    legacyChildId: legacyChild?.legacyId ?? null,
    legacyBranchId: legacyChild?.branch.legacyId ?? null,
    legacyClassId: legacyChild?.class?.legacyId ?? null,
    legacyTeacherId,
    legacyData: rawLegacyData(
      normalizedData,
      legacyChild,
      legacyTeacherId,
      existingData,
    ) as InputJsonValue,
  };
}

function callLogAttachmentData(data: CallLogMutationData) {
  return data.attachments?.length
    ? {
        create: data.attachments.map((attachment) => ({
          childId: data.childId,
          formType: "CALL_LOG",
          title: attachment.title ?? null,
          filename: attachment.filename,
          fileUrl: attachment.fileUrl,
        })),
      }
    : undefined;
}

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
      isDraft,
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
    if (typeof isDraft === "boolean") where.isDraft = isDraft;

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
        { child: { childNumber: { contains: search, mode: "insensitive" } } },
        { child: { firstName: { contains: search, mode: "insensitive" } } },
        { child: { lastName: { contains: search, mode: "insensitive" } } },
        { child: { branch: { name: { contains: search, mode: "insensitive" } } } },
        { child: { class: { name: { contains: search, mode: "insensitive" } } } },
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
              legacyId: true,
              childNumber: true,
              photo: true,
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
        orderBy: [{ legacyId: "desc" }, { date: "desc" }, { createdAt: "desc" }],
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

// ── getCallStaffOptions — legacy teacher list for Form 6 ──

export async function getCallStaffOptions() {
  try {
    const { organizationId: orgId } = await requireOrg();

    const teachers = await db.teacher.findMany({
      where: {
        isActive: true,
        branch: { organizationId: orgId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        legacyId: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.firstName} ${teacher.lastName}`.trim(),
      email: teacher.email ?? "",
      legacyId: teacher.legacyId,
    }));
  } catch (error) {
    console.error("getCallStaffOptions error:", error);
    return [];
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
        legacyId: true,
        childNumber: true,
        photo: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true, legacyId: true } },
        class: { select: { id: true, name: true, legacyId: true } },
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
    const validationError = validateCallLogData(data);
    if (validationError) return { success: false, error: validationError };

    if (!(await verifyChildAccess(data.childId, ctx.organizationId))) {
      return { success: false, error: "Child not found" };
    }

    const legacyContext = await callLogLegacyContext(data.childId, data.staffId);
    if (!legacyContext) {
      return { success: false, error: "Child not found" };
    }

    const call = await db.callLog.create({
      data: {
        ...callLogData(data, legacyContext),
        createdById: ctx.userId,
        attachments: callLogAttachmentData(data),
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

// ── updateCallLog ─────────────────────────────────

export async function updateCallLog(
  id: string,
  data: UpdateCallLogData,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    if (!id) {
      return { success: false, error: "Call log ID is required" };
    }

    const validationError = validateCallLogData(data);
    if (validationError) return { success: false, error: validationError };

    const existing = await db.callLog.findUnique({
      where: { id },
      include: {
        child: {
          include: { branch: { select: { organizationId: true } } },
        },
      },
    });

    if (!existing || existing.child.branch.organizationId !== ctx.organizationId) {
      return { success: false, error: "Call log not found" };
    }

    if (!(await verifyChildAccess(data.childId, ctx.organizationId))) {
      return { success: false, error: "Child not found" };
    }

    const legacyContext = await callLogLegacyContext(
      data.childId,
      data.staffId,
      existing.legacyData,
    );
    if (!legacyContext) {
      return { success: false, error: "Child not found" };
    }

    await db.callLog.update({
      where: { id },
      data: {
        ...callLogData(data, legacyContext, existing.legacyData),
        attachments: callLogAttachmentData(data),
      },
    });

    revalidatePath(`/children/${existing.childId}/calls`);
    if (existing.childId !== data.childId) {
      revalidatePath(`/children/${data.childId}/calls`);
    }
    revalidatePath("/calls");

    return { success: true, id };
  } catch (error) {
    console.error("updateCallLog error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update call log";
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
