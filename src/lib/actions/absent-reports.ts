"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
import { absenceReportSchema } from "@/lib/validations/absence-report";
import type { AbsenceStatus, Prisma } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetAbsenceReportsParams {
  branchId?: string;
  childId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AbsenceStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────
// getAbsenceReports — List with filtering & pagination
// ─────────────────────────────────────────────

export async function getAbsenceReports(params: GetAbsenceReportsParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const {
      branchId,
      childId,
      dateFrom,
      dateTo,
      status,
      search,
      page = 1,
      pageSize = 50,
    } = params;

    const where: Prisma.AbsenceReportWhereInput = {
      child: { branch: { organizationId: orgId } },
    };

    if (childId) {
      where.childId = childId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    if (branchId || search) {
      const childWhere = where.child as Prisma.ChildWhereInput;
      if (branchId) {
        childWhere.branchId = branchId;
      }
      if (search) {
        childWhere.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    const skip = (page - 1) * pageSize;

    const [reports, total] = await Promise.all([
      db.absenceReport.findMany({
        where,
        include: {
          child: {
            include: {
              class: true,
              branch: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      db.absenceReport.count({ where }),
    ]);

    return { reports, total };
  } catch (error) {
    console.error("getAbsenceReports error:", error);
    return { reports: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// getAbsenceReport — Single report
// ─────────────────────────────────────────────

export async function getAbsenceReport(id: string) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const report = await db.absenceReport.findUnique({
      where: { id },
      include: {
        child: {
          include: {
            class: true,
            branch: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    if (!report) {
      return { error: "Absence report not found" };
    }

    if (report.child.branch?.organizationId !== orgId) {
      return { error: "Absence report not found" };
    }

    return { report };
  } catch (error) {
    console.error("getAbsenceReport error:", error);
    return { error: "Failed to load absence report" };
  }
}

// ─────────────────────────────────────────────
// createAbsenceReport
// ─────────────────────────────────────────────

export async function createAbsenceReport(formData: FormData) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });
    if (typeof rawData.hospitalized === "string") {
      rawData.hospitalized = rawData.hospitalized === "true";
    }

    const parsed = absenceReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Verify child belongs to this org
    const childOk = await verifyChildAccess(data.childId, ctx.organizationId);
    if (!childOk) return { error: "Invalid child" };

    const report = await db.absenceReport.create({
      data: {
        childId: data.childId,
        date: new Date(data.date),
        reason: data.reason || null,
        absentFrom: data.absentFrom ? new Date(data.absentFrom) : null,
        absentTo: data.absentTo ? new Date(data.absentTo) : null,
        hospitalized: data.hospitalized ?? false,
        hospitalName: data.hospitalized ? (data.hospitalName || null) : null,
        doctorName: data.hospitalized ? (data.doctorName || null) : null,
        status: data.status,
        createdById: ctx.userId,
      },
    });

    revalidatePath("/absent-reports");
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("createAbsenceReport error:", error);
    return { error: "Failed to create absence report" };
  }
}

// ─────────────────────────────────────────────
// updateAbsenceReport
// ─────────────────────────────────────────────

export async function updateAbsenceReport(id: string, formData: FormData) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.absenceReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Absence report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
      return { error: "Absence report not found" };
    }

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });
    if (typeof rawData.hospitalized === "string") {
      rawData.hospitalized = rawData.hospitalized === "true";
    }

    const parsed = absenceReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    const report = await db.absenceReport.update({
      where: { id },
      data: {
        childId: data.childId,
        date: new Date(data.date),
        reason: data.reason || null,
        absentFrom: data.absentFrom ? new Date(data.absentFrom) : null,
        absentTo: data.absentTo ? new Date(data.absentTo) : null,
        hospitalized: data.hospitalized ?? false,
        hospitalName: data.hospitalized ? (data.hospitalName || null) : null,
        doctorName: data.hospitalized ? (data.doctorName || null) : null,
        status: data.status,
      },
    });

    revalidatePath("/absent-reports");
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("updateAbsenceReport error:", error);
    return { error: "Failed to update absence report" };
  }
}

// ─────────────────────────────────────────────
// updateAbsenceReportStatus — Quick status change (approve/reject)
// ─────────────────────────────────────────────

export async function updateAbsenceReportStatus(
  id: string,
  status: "APPROVED" | "REJECTED"
) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.absenceReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Absence report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
      return { error: "Absence report not found" };
    }

    await db.absenceReport.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/absent-reports");
    return { success: true };
  } catch (error) {
    console.error("updateAbsenceReportStatus error:", error);
    return { error: "Failed to update absence report status" };
  }
}

// ─────────────────────────────────────────────
// deleteAbsenceReport
// ─────────────────────────────────────────────

export async function deleteAbsenceReport(id: string) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.absenceReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Absence report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
      return { error: "Absence report not found" };
    }

    await db.absenceReport.delete({ where: { id } });

    revalidatePath("/absent-reports");
    return { success: true };
  } catch (error) {
    console.error("deleteAbsenceReport error:", error);
    return { error: "Failed to delete absence report" };
  }
}

// ─────────────────────────────────────────────
// getPendingAbsenceReports — Filtered to status=PENDING (drafts)
// ─────────────────────────────────────────────

export async function getPendingAbsenceReports(params: Omit<GetAbsenceReportsParams, "status"> = {}) {
  return getAbsenceReports({ ...params, status: "PENDING" });
}
