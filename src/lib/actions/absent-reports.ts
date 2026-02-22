"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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

    const where: Prisma.AbsenceReportWhereInput = {};

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
      where.child = {};
      if (branchId) {
        where.child.branchId = branchId;
      }
      if (search) {
        where.child.OR = [
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    const parsed = absenceReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    const report = await db.absenceReport.create({
      data: {
        childId: data.childId,
        date: new Date(data.date),
        reason: data.reason || null,
        status: data.status,
        createdById: session.user.id,
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.absenceReport.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Absence report not found" };
    }

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

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
// deleteAbsenceReport
// ─────────────────────────────────────────────

export async function deleteAbsenceReport(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.absenceReport.findUnique({ where: { id } });
    if (!existing) {
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
