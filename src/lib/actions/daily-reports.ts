"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
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

const removeAttachmentIdsSchema = z.array(z.string().uuid()).max(50);

function parseRemoveAttachmentIds(value: unknown): string[] {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }
  try {
    const parsed = removeAttachmentIdsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function parseJsonArrayField(rawData: Record<string, unknown>, field: string) {
  if (typeof rawData[field] !== "string") {
    return;
  }
  try {
    rawData[field] = JSON.parse(rawData[field] as string);
  } catch {
    rawData[field] = [];
  }
}

function parseDailyReportBooleans(rawData: Record<string, unknown>) {
  for (const boolField of [
    "isSleep",
    "diarrhea",
    "cough",
    "runnyNose",
    "vomit",
    "applyFoodForAll",
    "clothesPants",
    "clothesSweater",
    "clothesTshirt",
    "clothesUnderwear",
    "clothesSocks",
    "hospitalAttend",
  ]) {
    rawData[boolField] =
      rawData[boolField] === "true" || rawData[boolField] === true;
  }
}

function dailyAttachmentCreates(
  attachments: Array<{ title?: string; fileName?: string; fileUrl?: string }>,
) {
  return attachments
    .filter((attachment) => attachment.fileUrl)
    .map((attachment) => ({
      filename:
        attachment.title?.trim() ||
        attachment.fileName?.trim() ||
        "attachment",
      fileUrl: attachment.fileUrl!,
    }));
}

// ─────────────────────────────────────────────
// getDailyReports — List with filtering & pagination
// ─────────────────────────────────────────────

export async function getDailyReports(params: GetDailyReportsParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

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

    const where: Prisma.DailyReportWhereInput = {
      child: { branch: { organizationId: orgId } },
    };

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
      const childWhere = where.child as Prisma.ChildWhereInput;
      if (branchId) {
        childWhere.branchId = branchId;
      }
      if (classId) {
        childWhere.classId = classId;
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
    const { organizationId: orgId } = await requireOrg();

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
        attachments: true,
      },
    });

    if (!report) {
      return { error: "Daily report not found" };
    }

    if (report.child.branch?.organizationId !== orgId) {
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
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    // Parse form data into a plain object
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    parseDailyReportBooleans(rawData);

    // Handle numeric fields
    for (const numField of ["urinePotty", "stoolPotty", "urineDiaper", "stoolDiaper"]) {
      rawData[numField] = Number(rawData[numField] ?? 0);
    }

    // Handle nested entries from JSON
    parseJsonArrayField(rawData, "feverEntries");
    parseJsonArrayField(rawData, "milkEntries");
    parseJsonArrayField(rawData, "attachments");

    const parsed = dailyReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;
    const attachmentCreates = dailyAttachmentCreates(data.attachments);

    // Verify child belongs to this org
    const childOk = await verifyChildAccess(data.childId, ctx.organizationId);
    if (!childOk) return { error: "Invalid child" };

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
        checkInTime: data.checkInTime ? new Date(`1970-01-01T${data.checkInTime}`) : null,
        checkOutTime: data.checkOutTime ? new Date(`1970-01-01T${data.checkOutTime}`) : null,
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
        sleepQuality: data.sleepQuality || null,
        activities: data.activities || null,
        medicine: data.medicine || null,
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
        createdById: ctx.userId,
        fevers: {
          create: data.feverEntries.map((f) => ({
            temperature: parseFloat(f.temperature),
            time: new Date(`1970-01-01T${f.time}`),
          })),
        },
        milks: {
          create: data.milkEntries.map((m) => ({
            milkType: m.milkType || null,
            amountCc: parseInt(m.amountCc, 10),
            scoops: m.scoops ? parseInt(m.scoops, 10) : null,
            time: new Date(`1970-01-01T${m.time}`),
          })),
        },
        attachments: attachmentCreates.length
          ? { create: attachmentCreates }
          : undefined,
      },
    });

    revalidatePath("/daily-reports");
    revalidatePath(`/daily-reports/${report.id}`);
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
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.dailyReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Daily report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
      return { error: "Daily report not found" };
    }

    // Parse form data into a plain object
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      rawData[key] = value;
    });

    parseDailyReportBooleans(rawData);

    // Handle numeric fields
    for (const numField of ["urinePotty", "stoolPotty", "urineDiaper", "stoolDiaper"]) {
      rawData[numField] = Number(rawData[numField] ?? 0);
    }

    // Handle nested entries from JSON
    parseJsonArrayField(rawData, "feverEntries");
    parseJsonArrayField(rawData, "milkEntries");
    parseJsonArrayField(rawData, "attachments");

    const parsed = dailyReportSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: "Validation failed", issues: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;
    const attachmentCreates = dailyAttachmentCreates(data.attachments);
    const removeAttachmentIds = parseRemoveAttachmentIds(
      rawData.removeAttachmentIds,
    );

    const childOk = await verifyChildAccess(data.childId, ctx.organizationId);
    if (!childOk) return { error: "Invalid child" };

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
    if (removeAttachmentIds.length) {
      await db.dailyReportAttachment.deleteMany({
        where: {
          dailyReportId: id,
          id: { in: removeAttachmentIds },
        },
      });
    }

    const report = await db.dailyReport.update({
      where: { id },
      data: {
        childId: data.childId,
        reportDate: new Date(data.reportDate),
        checkInTime: data.checkInTime ? new Date(`1970-01-01T${data.checkInTime}`) : null,
        checkOutTime: data.checkOutTime ? new Date(`1970-01-01T${data.checkOutTime}`) : null,
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
        sleepQuality: data.sleepQuality || null,
        activities: data.activities || null,
        medicine: data.medicine || null,
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
            milkType: m.milkType || null,
            amountCc: parseInt(m.amountCc, 10),
            scoops: m.scoops ? parseInt(m.scoops, 10) : null,
            time: new Date(`1970-01-01T${m.time}`),
          })),
        },
        attachments: attachmentCreates.length
          ? { create: attachmentCreates }
          : undefined,
      },
    });

    revalidatePath("/daily-reports");
    revalidatePath(`/daily-reports/${id}`);
    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("updateDailyReport error:", error);
    return { error: "Failed to update daily report" };
  }
}

// ─────────────────────────────────────────────
// submitDailyReport — Quick status change from DRAFT to SUBMITTED
// ─────────────────────────────────────────────

export async function submitDailyReport(id: string) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.dailyReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Daily report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
      return { error: "Daily report not found" };
    }

    if (existing.status !== "DRAFT") {
      return { error: "Only draft reports can be submitted" };
    }

    await db.dailyReport.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    revalidatePath("/daily-reports");
    return { success: true };
  } catch (error) {
    console.error("submitDailyReport error:", error);
    return { error: "Failed to submit daily report" };
  }
}

// ─────────────────────────────────────────────
// deleteDailyReport
// ─────────────────────────────────────────────

export async function deleteDailyReport(id: string) {
  const result = await requireOrgSafe();
  if (!result.ok) return { error: result.error };
  const { ctx } = result;

  try {
    const existing = await db.dailyReport.findUnique({
      where: { id },
      include: { child: { include: { branch: true } } },
    });
    if (!existing) {
      return { error: "Daily report not found" };
    }
    if (existing.child.branch?.organizationId !== ctx.organizationId) {
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
