"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
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

const attachmentPayloadSchema = z
  .array(
    z.object({
      filename: z.string().min(1).max(240),
      fileUrl: z.string().min(1).max(2048),
    }),
  )
  .max(20);

const removeAttachmentIdsSchema = z.array(z.string().uuid()).max(50);

function parseJsonPayload<T>(
  value: unknown,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function jsonRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...value };
}

function optionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function loadAbsenceFormContext(
  organizationId: string,
  childId: string,
  teacherId: string | null,
) {
  const [child, teacher] = await Promise.all([
    db.child.findUnique({
      where: { id: childId },
      include: {
        branch: true,
        class: true,
      },
    }),
    teacherId
      ? db.teacher.findFirst({
          where: {
            id: teacherId,
            branch: { organizationId },
          },
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!child || child.branch?.organizationId !== organizationId) {
    return { error: "Invalid child" as const };
  }
  if (teacherId && !teacher) {
    return { error: "Invalid teacher" as const };
  }

  return { child, teacher };
}

function buildAbsenceLegacyData(params: {
  existing?: Prisma.JsonValue | null;
  data: z.infer<typeof absenceReportSchema>;
  child: {
    id: string;
    legacyId: number | null;
    classId: string | null;
    class: { legacyId: number | null } | null;
  };
  teacher: { id: string; legacyId: number | null; firstName: string; lastName: string } | null;
}) {
  const existing = jsonRecord(params.existing);
  const teacherLegacyId = params.teacher?.legacyId ?? null;
  const childLegacyId = params.child.legacyId ?? null;
  const classLegacyId = params.child.class?.legacyId ?? null;
  const isDraft = params.data.status === "PENDING" ? 1 : 0;
  const attendHos = params.data.hospitalizedChoice || (params.data.hospitalized ? "Yes" : "No");

  return {
    ...existing,
    child_id: childLegacyId ?? existing.child_id ?? params.child.id,
    class_id: classLegacyId ?? existing.class_id ?? params.data.classId ?? params.child.classId ?? "",
    teacher_id: teacherLegacyId ?? existing.teacher_id ?? params.data.teacherId ?? "",
    teacher_name: params.teacher ? `${params.teacher.firstName} ${params.teacher.lastName}` : existing.teacher_name ?? "",
    reportdate: params.data.date,
    ab_reason: params.data.reason ?? "",
    ab_from: params.data.absentFrom ?? "",
    ab_to: params.data.absentTo ?? "",
    attend_hos: attendHos,
    hos_name: params.data.hospitalized ? params.data.hospitalName ?? "" : "",
    dr_name: params.data.hospitalized ? params.data.doctorName ?? "" : "",
    is_rep_draft: isDraft,
    active: existing.active ?? 1,
    modernChildId: params.child.id,
    modernClassId: params.data.classId || params.child.classId || null,
    modernTeacherId: params.teacher?.id ?? null,
  };
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
    const attachments = parseJsonPayload(
      rawData.attachments,
      attachmentPayloadSchema,
      [],
    );
    const teacherId = optionalString(data.teacherId);

    const context = await loadAbsenceFormContext(ctx.organizationId, data.childId, teacherId);
    if ("error" in context) return { error: context.error };

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
        legacyData: buildAbsenceLegacyData({
          data,
          child: context.child,
          teacher: context.teacher,
        }),
        createdById: ctx.userId,
        attachments: attachments.length
          ? {
              create: attachments.map((attachment) => ({
                filename: attachment.filename,
                fileUrl: attachment.fileUrl,
              })),
            }
          : undefined,
      },
    });

    revalidatePath("/absent-reports");
    revalidatePath("/absent-reports/drafts");
    revalidatePath(`/children/${data.childId}/absence`);
    revalidatePath(`/absent-reports/${report.id}`);
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
    const attachments = parseJsonPayload(
      rawData.attachments,
      attachmentPayloadSchema,
      [],
    );
    const removeAttachmentIds = parseJsonPayload(
      rawData.removeAttachmentIds,
      removeAttachmentIdsSchema,
      [],
    );
    const teacherId = optionalString(data.teacherId);

    const context = await loadAbsenceFormContext(ctx.organizationId, data.childId, teacherId);
    if ("error" in context) return { error: context.error };

    const report = await db.$transaction(async (tx) => {
      const updatedReport = await tx.absenceReport.update({
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
          legacyData: buildAbsenceLegacyData({
            existing: existing.legacyData,
            data,
            child: context.child,
            teacher: context.teacher,
          }),
        },
      });

      if (removeAttachmentIds.length) {
        await tx.absenceAttachment.deleteMany({
          where: {
            absenceReportId: id,
            id: { in: removeAttachmentIds },
          },
        });
      }

      if (attachments.length) {
        await tx.absenceAttachment.createMany({
          data: attachments.map((attachment) => ({
            absenceReportId: id,
            filename: attachment.filename,
            fileUrl: attachment.fileUrl,
          })),
        });
      }

      return updatedReport;
    });

    revalidatePath("/absent-reports");
    revalidatePath("/absent-reports/drafts");
    revalidatePath(`/children/${data.childId}/absence`);
    revalidatePath(`/absent-reports/${id}`);
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
    revalidatePath("/absent-reports/drafts");
    revalidatePath(`/children/${existing.childId}/absence`);
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
    revalidatePath("/absent-reports/drafts");
    revalidatePath(`/children/${existing.childId}/absence`);
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
