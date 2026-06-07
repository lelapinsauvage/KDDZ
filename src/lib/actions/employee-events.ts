"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess, getOrgBranchIds } from "@/lib/verify-org-access";
import type { EmployeeEventStatus, AttendanceLogStatus } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up an employee's branchId from the appropriate model. */
async function getEmployeeBranchId(
  employeeId: string,
  employeeType: string,
): Promise<string | null> {
  let employee: { branchId: string } | null = null;
  switch (employeeType) {
    case "teacher":
      employee = await db.teacher.findUnique({ where: { id: employeeId }, select: { branchId: true } });
      break;
    case "nurse":
      employee = await db.nurse.findUnique({ where: { id: employeeId }, select: { branchId: true } });
      break;
    case "doctor":
      employee = await db.doctor.findUnique({ where: { id: employeeId }, select: { branchId: true } });
      break;
    case "manager":
      employee = await db.manager.findUnique({ where: { id: employeeId }, select: { branchId: true } });
      break;
  }
  return employee?.branchId ?? null;
}

// ---------------------------------------------------------------------------
// Calendar Events (EmployeeEvent)
// ---------------------------------------------------------------------------

export async function getEmployeeEvents(params: {
  employeeId?: string;
  employeeType?: string;
  month?: number; // 0-based
  year?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const orgBranchIds = await getOrgBranchIds(orgId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { branchId: { in: orgBranchIds } };

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }
    if (params.employeeType) {
      where.employeeType = params.employeeType;
    }

    // Date range filtering
    if (params.month !== undefined && params.year !== undefined) {
      const startDate = new Date(params.year, params.month, 1);
      const endDate = new Date(params.year, params.month + 1, 0);
      where.date = { gte: startDate, lte: endDate };
    } else if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) where.date.gte = new Date(params.dateFrom);
      if (params.dateTo) where.date.lte = new Date(params.dateTo);
    }

    const events = await db.employeeEvent.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch employee events:", error);
    return { success: false, error: "Failed to fetch employee events" };
  }
}

export async function createEmployeeEvent(data: {
  employeeId: string;
  employeeType: string;
  status: EmployeeEventStatus;
  date: string;
  referenceNumber?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Look up employee's branch and verify it belongs to org
    const branchId = await getEmployeeBranchId(data.employeeId, data.employeeType);
    if (!branchId || !(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Employee not found in your organization" };
    }

    const event = await db.employeeEvent.create({
      data: {
        employeeId: data.employeeId,
        employeeType: data.employeeType,
        status: data.status,
        date: new Date(data.date),
        referenceNumber: data.referenceNumber ?? null,
        notes: data.notes ?? null,
        branchId,
      },
    });

    revalidatePath("/employees/calendar");
    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to create employee event:", error);
    return { success: false, error: "Failed to create event. An event may already exist for this date." };
  }
}

export async function updateEmployeeEvent(
  id: string,
  data: {
    status?: EmployeeEventStatus;
    referenceNumber?: string | null;
    notes?: string | null;
  },
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Fetch event and verify it belongs to org
    const existing = await db.employeeEvent.findUnique({ where: { id } });
    if (!existing || !existing.branchId || !(await verifyBranchAccess(existing.branchId, orgId))) {
      return { success: false, error: "Event not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.referenceNumber !== undefined) updateData.referenceNumber = data.referenceNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const event = await db.employeeEvent.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/employees/calendar");
    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to update employee event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEmployeeEvent(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Fetch event and verify it belongs to org
    const existing = await db.employeeEvent.findUnique({ where: { id } });
    if (!existing || !existing.branchId || !(await verifyBranchAccess(existing.branchId, orgId))) {
      return { success: false, error: "Event not found" };
    }

    await db.employeeEvent.delete({ where: { id } });

    revalidatePath("/employees/calendar");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete employee event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

// ---------------------------------------------------------------------------
// Attendance Logs (TeacherAttendance)
// ---------------------------------------------------------------------------

export async function getAttendanceLogs(params: {
  employeeId?: string;
  employeeType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number | "all";
}): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const orgBranchIds = await getOrgBranchIds(orgId);

    const { page = 1, pageSize = 50 } = params;
    const paginated = pageSize !== "all";
    const numericPageSize = paginated ? Math.max(1, pageSize) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { branchId: { in: orgBranchIds } };

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }
    if (params.employeeType) {
      where.employeeType = params.employeeType;
    }

    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) where.date.gte = new Date(params.dateFrom);
      if (params.dateTo) where.date.lte = new Date(params.dateTo);
    }

    if (params.search) {
      where.OR = [
        { readerName: { contains: params.search, mode: "insensitive" } },
        { note: { contains: params.search, mode: "insensitive" } },
        { cardId: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = numericPageSize ? (page - 1) * numericPageSize : undefined;

    const [logs, total] = await Promise.all([
      db.teacherAttendance.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        ...(skip !== undefined ? { skip } : {}),
        ...(numericPageSize !== undefined ? { take: numericPageSize } : {}),
      }),
      db.teacherAttendance.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        pageSize,
        totalPages: numericPageSize ? Math.ceil(total / numericPageSize) : 1,
      },
    };
  } catch (error) {
    console.error("Failed to fetch attendance logs:", error);
    return { success: false, error: "Failed to fetch attendance logs" };
  }
}

export async function createAttendanceLog(data: {
  employeeId: string;
  employeeType?: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status?: AttendanceLogStatus;
  readerId?: string;
  readerName?: string;
  cardId?: string;
  note?: string;
}): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Look up employee's branch and verify it belongs to org
    const branchId = await getEmployeeBranchId(data.employeeId, data.employeeType ?? "teacher");
    if (!branchId || !(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Employee not found in your organization" };
    }

    const log = await db.teacherAttendance.create({
      data: {
        employeeId: data.employeeId,
        employeeType: data.employeeType ?? "teacher",
        date: new Date(data.date),
        timeIn: data.timeIn ? new Date(`1970-01-01T${data.timeIn}`) : null,
        timeOut: data.timeOut ? new Date(`1970-01-01T${data.timeOut}`) : null,
        status: data.status ?? null,
        readerId: data.readerId ?? null,
        readerName: data.readerName ?? null,
        cardId: data.cardId ?? null,
        note: data.note ?? null,
        branchId,
      },
    });

    revalidatePath("/employees/attendance-logs");
    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to create attendance log:", error);
    return { success: false, error: "Failed to create attendance log" };
  }
}

export async function bulkCreateAttendanceLogs(
  logs: Array<{
    employeeId: string;
    employeeType?: string;
    date: string;
    timeIn?: string;
    timeOut?: string;
    status?: AttendanceLogStatus;
    readerId?: string;
    readerName?: string;
    cardId?: string;
    note?: string;
  }>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Verify all employees belong to org by looking up their branches
    const uniqueEmployees = [
      ...new Map(
        logs.map((l) => [`${l.employeeId}:${l.employeeType ?? "teacher"}`, l]),
      ).values(),
    ];
    const branchMap = new Map<string, string>();
    for (const emp of uniqueEmployees) {
      const branchId = await getEmployeeBranchId(emp.employeeId, emp.employeeType ?? "teacher");
      if (!branchId || !(await verifyBranchAccess(branchId, orgId))) {
        return { success: false, error: "Some employees do not belong to your organization" };
      }
      branchMap.set(emp.employeeId, branchId);
    }

    const created = await db.teacherAttendance.createMany({
      data: logs.map((log) => ({
        employeeId: log.employeeId,
        employeeType: log.employeeType ?? "teacher",
        date: new Date(log.date),
        timeIn: log.timeIn ? new Date(`1970-01-01T${log.timeIn}`) : null,
        timeOut: log.timeOut ? new Date(`1970-01-01T${log.timeOut}`) : null,
        status: log.status ?? null,
        readerId: log.readerId ?? null,
        readerName: log.readerName ?? null,
        cardId: log.cardId ?? null,
        note: log.note ?? null,
        branchId: branchMap.get(log.employeeId) ?? null,
      })),
    });

    revalidatePath("/employees/attendance");
    revalidatePath("/employees/attendance-logs");
    return { success: true, data: { count: created.count } };
  } catch (error) {
    console.error("Failed to bulk create attendance logs:", error);
    return { success: false, error: "Failed to upload attendance data" };
  }
}

export async function updateAttendanceLog(
  id: string,
  data: {
    timeIn?: string | null;
    timeOut?: string | null;
    status?: AttendanceLogStatus | null;
    note?: string | null;
  },
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    // Fetch log and verify it belongs to org
    const existing = await db.teacherAttendance.findUnique({ where: { id } });
    if (!existing || !existing.branchId || !(await verifyBranchAccess(existing.branchId, orgId))) {
      return { success: false, error: "Attendance log not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.timeIn !== undefined) {
      updateData.timeIn = data.timeIn ? new Date(`1970-01-01T${data.timeIn}`) : null;
    }
    if (data.timeOut !== undefined) {
      updateData.timeOut = data.timeOut ? new Date(`1970-01-01T${data.timeOut}`) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;

    const log = await db.teacherAttendance.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/employees/attendance-logs");
    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to update attendance log:", error);
    return { success: false, error: "Failed to update attendance log" };
  }
}
