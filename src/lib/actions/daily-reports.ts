"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { dailyReportSchema } from "@/lib/validations/daily-report";
import type { DailyReportStatus, Prisma } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetDailyReportsParams {
  branchId?: string;
  classId?: string;
  childId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: DailyReportStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────
// getDailyReports — List with filtering & pagination
// ─────────────────────────────────────────────

export async function getDailyReports(params: GetDailyReportsParams = {}) {
  try {
    const {
      branchId,
      classId,
      childId,
      dateFrom,
      dateTo,
      status,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.DailyReportWhereInput = {};

    if (childId) {
      where.childId = childId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.reportDate = {};
      if (dateFrom) {
        where.reportDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.reportDate.lte = new Date(dateTo);
      }
    }

    // Filter by branch or class through child relation
    if (branchId || classId || search) {
      where.child = {};
      if (branchId) {
        where.child.branchId = branchId;
      }
      if (classId) {
        where.child.classId = classId;
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
      db.dailyReport.findMany({
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
              name: true,
              email: true,
            },
          },
        },
        orderBy: { reportDate: "desc" },
        skip,
        take: pageSize,
      }),
      db.dailyReport.count({ where }),
    ]);

    return { reports, total };
  } catch (error) {
    console.error("getDailyReports error:", error);
    return { reports: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// getDailyReport — Single report with all relations
// ─────────────────────────────────────────────

export async function getDailyReport(id: string) {
  try {
    const report = await db.dailyReport.findUnique({
      where: { id },
      include: {
        child: {
          include: {
            class: true,
            branch: true,
          },
        },
        breakfastFood: true,
        lunchFood: true,
        fevers: true,
        milks: true,
      },
    });

    if (!report) {
      return { error: "Daily report not found" };
    }

    return { report };
  } catch (error) {
    console.error("getDailyReport error:", error);
    return { error: "Failed to load daily report" };
  }
}

// ─────────────────────────────────────────────
// createDailyReport — Create with nested fevers/milks
// ─────────────────────────────────────────────

export async function createDailyReport(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Parse form data into a plain object
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    // Handle boolean fields
    for (const boolField of ["isSleep", "diarrhea", "cough", "runnyNose", "vomit"]) {
      rawData[boolField] = rawData[boolField] === "true" || rawData[boolField] === true;
    }

    // Handle numeric fields
    for (const numField of ["urinePotty", "stoolPotty", "urineDiaper", "stoolDiaper"]) {
      rawData[numField] = Number(rawData[numField] ?? 0);
    }

    // Handle nested fever/milk entries from JSON
    if (typeof rawData.feverEntries === "string") {
      rawData.feverEntries = JSON.parse(rawData.feverEntries as string);
    }
    if (typeof rawData.milkEntries === "string") {
      rawData.milkEntries = JSON.parse(rawData.milkEntries as string);
    }

    const parsed = dailyReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Check unique constraint: childId + reportDate
    const existing = await db.dailyReport.findUnique({
      where: {
        childId_reportDate: {
          childId: data.childId,
          reportDate: new Date(data.reportDate),
        },
      },
    });

    if (existing) {
      return { error: "A daily report already exists for this child on this date" };
    }

    const report = await db.dailyReport.create({
      data: {
        childId: data.childId,
        reportDate: new Date(data.reportDate),
        status: (rawData.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT") as DailyReportStatus,
        breakfastFoodId: data.breakfastFoodId || null,
        breakfastPortion: data.breakfastPortion || null,
        breakfastTime: data.breakfastTime ? new Date(`1970-01-01T${data.breakfastTime}`) : null,
        lunchFoodId: data.lunchFoodId || null,
        lunchPortion: data.lunchPortion || null,
        lunchTime: data.lunchTime ? new Date(`1970-01-01T${data.lunchTime}`) : null,
        dessert: data.dessert || null,
        dessertPortion: data.dessertPortion || null,
        dessertTime: data.dessertTime ? new Date(`1970-01-01T${data.dessertTime}`) : null,
        isSleep: data.isSleep,
        sleepFrom: data.sleepFrom ? new Date(`1970-01-01T${data.sleepFrom}`) : null,
        sleepTo: data.sleepTo ? new Date(`1970-01-01T${data.sleepTo}`) : null,
        diarrhea: data.diarrhea,
        urinePotty: data.urinePotty,
        stoolPotty: data.stoolPotty,
        urineDiaper: data.urineDiaper,
        stoolDiaper: data.stoolDiaper,
        mood: data.mood || null,
        cough: data.cough,
        runnyNose: data.runnyNose,
        vomit: data.vomit,
        remarks: data.remarks || null,
        createdById: session.user.id,
        fevers: {
          create: data.feverEntries.map((f) => ({
            temperature: parseFloat(f.temperature),
            time: new Date(`1970-01-01T${f.time}`),
          })),
        },
        milks: {
          create: data.milkEntries.map((m) => ({
            amountCc: parseInt(m.amountCc, 10),
            time: new Date(`1970-01-01T${m.time}`),
          })),
        },
      },
    });

    revalidatePath("/daily-reports");
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("createDailyReport error:", error);
    return { error: "Failed to create daily report" };
  }
}

// ─────────────────────────────────────────────
// updateDailyReport — Update with upsert for fevers/milks
// ─────────────────────────────────────────────

export async function updateDailyReport(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Daily report not found" };
    }

    // Parse form data into a plain object
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    // Handle boolean fields
    for (const boolField of ["isSleep", "diarrhea", "cough", "runnyNose", "vomit"]) {
      rawData[boolField] = rawData[boolField] === "true" || rawData[boolField] === true;
    }

    // Handle numeric fields
    for (const numField of ["urinePotty", "stoolPotty", "urineDiaper", "stoolDiaper"]) {
      rawData[numField] = Number(rawData[numField] ?? 0);
    }

    // Handle nested fever/milk entries from JSON
    if (typeof rawData.feverEntries === "string") {
      rawData.feverEntries = JSON.parse(rawData.feverEntries as string);
    }
    if (typeof rawData.milkEntries === "string") {
      rawData.milkEntries = JSON.parse(rawData.milkEntries as string);
    }

    const parsed = dailyReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Check unique constraint if date/child changed
    if (data.childId !== existing.childId || new Date(data.reportDate).toISOString() !== existing.reportDate.toISOString()) {
      const conflict = await db.dailyReport.findUnique({
        where: {
          childId_reportDate: {
            childId: data.childId,
            reportDate: new Date(data.reportDate),
          },
        },
      });
      if (conflict && conflict.id !== id) {
        return { error: "A daily report already exists for this child on this date" };
      }
    }

    // Delete existing fevers and milks, then re-create
    await db.dailyReportFever.deleteMany({ where: { dailyReportId: id } });
    await db.dailyReportMilk.deleteMany({ where: { dailyReportId: id } });

    const report = await db.dailyReport.update({
      where: { id },
      data: {
        childId: data.childId,
        reportDate: new Date(data.reportDate),
        breakfastFoodId: data.breakfastFoodId || null,
        breakfastPortion: data.breakfastPortion || null,
        breakfastTime: data.breakfastTime ? new Date(`1970-01-01T${data.breakfastTime}`) : null,
        lunchFoodId: data.lunchFoodId || null,
        lunchPortion: data.lunchPortion || null,
        lunchTime: data.lunchTime ? new Date(`1970-01-01T${data.lunchTime}`) : null,
        dessert: data.dessert || null,
        dessertPortion: data.dessertPortion || null,
        dessertTime: data.dessertTime ? new Date(`1970-01-01T${data.dessertTime}`) : null,
        isSleep: data.isSleep,
        sleepFrom: data.sleepFrom ? new Date(`1970-01-01T${data.sleepFrom}`) : null,
        sleepTo: data.sleepTo ? new Date(`1970-01-01T${data.sleepTo}`) : null,
        diarrhea: data.diarrhea,
        urinePotty: data.urinePotty,
        stoolPotty: data.stoolPotty,
        urineDiaper: data.urineDiaper,
        stoolDiaper: data.stoolDiaper,
        mood: data.mood || null,
        cough: data.cough,
        runnyNose: data.runnyNose,
        vomit: data.vomit,
        remarks: data.remarks || null,
        fevers: {
          create: data.feverEntries.map((f) => ({
            temperature: parseFloat(f.temperature),
            time: new Date(`1970-01-01T${f.time}`),
          })),
        },
        milks: {
          create: data.milkEntries.map((m) => ({
            amountCc: parseInt(m.amountCc, 10),
            time: new Date(`1970-01-01T${m.time}`),
          })),
        },
      },
    });

    revalidatePath("/daily-reports");
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("updateDailyReport error:", error);
    return { error: "Failed to update daily report" };
  }
}

// ─────────────────────────────────────────────
// deleteDailyReport
// ─────────────────────────────────────────────

export async function deleteDailyReport(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Daily report not found" };
    }

    await db.dailyReport.delete({ where: { id } });

    revalidatePath("/daily-reports");
    return { success: true };
  } catch (error) {
    console.error("deleteDailyReport error:", error);
    return { error: "Failed to delete daily report" };
  }
}

// ─────────────────────────────────────────────
// getDraftReports — Filtered to status=DRAFT
// ─────────────────────────────────────────────

export async function getDraftReports(params: Omit<GetDailyReportsParams, "status"> = {}) {
  return getDailyReports({ ...params, status: "DRAFT" });
}
