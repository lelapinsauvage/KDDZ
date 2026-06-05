"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";

const optionalImportSchema = z.enum([
  "GF",
  "VF",
  "SF",
  "Tch",
  "nrses",
  "mngrs",
  "drs",
  "hldays",
]);

const newYearSchema = z.object({
  label: z.string().trim().min(3).max(50),
  startDate: z.string().trim().min(8),
  endDate: z.string().trim().min(8),
  optionalImports: z.array(optionalImportSchema).default([]),
  teachers: z
    .array(
      z.object({
        teacherId: z.string().uuid(),
        classId: z.string().uuid(),
      }),
    )
    .max(1000),
  children: z
    .array(
      z.object({
        childId: z.string().uuid(),
        classId: z.string().uuid(),
        childNumber: z.string().trim().max(50).optional(),
      }),
    )
    .min(1)
    .max(5000),
});

type NewYearInput = z.infer<typeof newYearSchema>;

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

function nextLabelFrom(activeLabel: string | null) {
  const match = activeLabel?.match(/(\d{4})\D+(\d{4})/);
  if (match) {
    const start = Number(match[1]) + 1;
    const end = Number(match[2]) + 1;
    return `${start}-${end}`;
  }

  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start + 1}-${start + 2}`;
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function yearRangeFromLabel(label: string) {
  const match = label.match(/(\d{4})\D+(\d{4})/);
  if (!match) return null;
  return {
    startYear: Number(match[1]),
    endYear: Number(match[2]),
  };
}

function suggestedDates(label: string) {
  const range = yearRangeFromLabel(label);
  if (!range) {
    const now = new Date();
    return {
      startDate: dateString(new Date(Date.UTC(now.getFullYear(), 8, 1))),
      endDate: dateString(new Date(Date.UTC(now.getFullYear() + 1, 5, 30))),
    };
  }

  return {
    startDate: `${range.startYear}-09-01`,
    endDate: `${range.endYear}-06-30`,
  };
}

function legacyChildNumber(
  branchPrefix: string | null,
  legacyBranchId: number | null,
  label: string,
  index: number,
) {
  const range = yearRangeFromLabel(label);
  const start = range ? String(range.startYear).slice(-2) : "";
  const end = range ? String(range.endYear).slice(-2) : "";
  const prefix = branchPrefix ?? "";
  const branchCode = legacyBranchId ? String(legacyBranchId) : "";
  return `${prefix}${start}${end}${branchCode}${String(index + 1).padStart(3, "0")}`;
}

export async function getNewYearSetupData() {
  try {
    const { organizationId: orgId } = await requireOrg();

    const [activeYear, years, classes, teachers, children] = await Promise.all([
      db.schoolYear.findFirst({
        where: { organizationId: orgId, isActive: true },
        orderBy: { startDate: "desc" },
      }),
      db.schoolYear.findMany({
        where: { organizationId: orgId },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          label: true,
          startDate: true,
          endDate: true,
          isActive: true,
          _count: { select: { children: true } },
        },
      }),
      db.class.findMany({
        where: { branch: { organizationId: orgId }, isActive: true },
        include: {
          branch: { select: { id: true, name: true, prefix: true, legacyId: true } },
          _count: { select: { children: true, teachers: true } },
        },
        orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
      }),
      db.teacher.findMany({
        where: { branch: { organizationId: orgId }, isActive: true },
        include: {
          branch: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      db.child.findMany({
        where: { branch: { organizationId: orgId }, isActive: true, isDraft: false },
        include: {
          branch: { select: { id: true, name: true, prefix: true, legacyId: true } },
          class: { select: { id: true, name: true } },
          schoolYear: { select: { id: true, label: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

    const suggestedLabel = nextLabelFrom(activeYear?.label ?? null);
    const suggested = suggestedDates(suggestedLabel);
    const classById = new Map(classes.map((cls) => [cls.id, cls]));

    return {
      success: true,
      data: {
        activeYear: activeYear
          ? {
              id: activeYear.id,
              label: activeYear.label,
              startDate: dateString(activeYear.startDate),
              endDate: dateString(activeYear.endDate),
            }
          : null,
        suggestedYear: {
          label: suggestedLabel,
          ...suggested,
        },
        schoolYears: years.map((year) => ({
          id: year.id,
          label: year.label,
          startDate: dateString(year.startDate),
          endDate: dateString(year.endDate),
          isActive: year.isActive,
          childCount: year._count.children,
        })),
        classes: classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          branchId: cls.branchId,
          branchName: cls.branch.name,
          branchPrefix: cls.branch.prefix,
          legacyBranchId: cls.branch.legacyId,
          childCount: cls._count.children,
          teacherCount: cls._count.teachers,
        })),
        teachers: teachers.map((teacher) => ({
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`.trim(),
          branchName: teacher.branch.name,
          currentClassId: teacher.classId,
          currentClassName: teacher.class?.name ?? null,
        })),
        children: children.map((child, index) => {
          const targetClass = child.classId ? classById.get(child.classId) : null;
          return {
            id: child.id,
            name: `${child.firstName} ${child.middleName ?? ""} ${child.lastName}`
              .replace(/\s+/g, " ")
              .trim(),
            branchName: child.branch.name,
            currentClassId: child.classId,
            currentClassName: child.class?.name ?? null,
            currentSchoolYear: child.schoolYear?.label ?? null,
            currentChildNumber: child.childNumber,
            suggestedChildNumber: legacyChildNumber(
              targetClass?.branch.prefix ?? child.branch.prefix,
              targetClass?.branch.legacyId ?? child.branch.legacyId,
              suggestedLabel,
              index,
            ),
          };
        }),
      },
    } satisfies ActionResult;
  } catch (error) {
    console.error("getNewYearSetupData error:", error);
    return { success: false, error: "Failed to load new year setup data" };
  }
}

export async function createNewAcademicYear(
  input: NewYearInput,
): Promise<ActionResult<{ schoolYearId: string; childrenUpdated: number; teachersUpdated: number }>> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  const parsed = newYearSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid new year data" };
  }

  const data = parsed.data;
  if (data.optionalImports.includes("Tch") && data.teachers.length === 0) {
    return { success: false, error: "Select at least one teacher to carry forward" };
  }

  let startDate: Date;
  let endDate: Date;
  try {
    startDate = parseDateOnly(data.startDate);
    endDate = parseDateOnly(data.endDate);
  } catch {
    return { success: false, error: "Invalid school year dates" };
  }

  if (endDate <= startDate) {
    return { success: false, error: "End date must be after start date" };
  }

  try {
    const existing = await db.schoolYear.findFirst({
      where: { organizationId: ctx.organizationId, label: data.label },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: "A school year with this label already exists" };
    }

    const classIds = [
      ...new Set([
        ...data.teachers.map((teacher) => teacher.classId),
        ...data.children.map((child) => child.classId),
      ]),
    ];
    const [classes, teachers, children] = await Promise.all([
      db.class.findMany({
        where: { id: { in: classIds }, branch: { organizationId: ctx.organizationId } },
        select: { id: true },
      }),
      db.teacher.findMany({
        where: {
          id: { in: data.teachers.map((teacher) => teacher.teacherId) },
          branch: { organizationId: ctx.organizationId },
        },
        select: { id: true },
      }),
      db.child.findMany({
        where: {
          id: { in: data.children.map((child) => child.childId) },
          branch: { organizationId: ctx.organizationId },
        },
      }),
    ]);

    const validClassIds = new Set(classes.map((cls) => cls.id));
    if (validClassIds.size !== classIds.length) {
      return { success: false, error: "One or more selected classes are not available" };
    }

    if (teachers.length !== data.teachers.length) {
      return { success: false, error: "One or more selected teachers are not available" };
    }

    if (children.length !== data.children.length) {
      return { success: false, error: "One or more selected children are not available" };
    }

    const childrenById = new Map(children.map((child) => [child.id, child]));

    const schoolYear = await db.$transaction(async (tx) => {
      await tx.schoolYear.updateMany({
        where: { organizationId: ctx.organizationId, isActive: true },
        data: { isActive: false },
      });

      const created = await tx.schoolYear.create({
        data: {
          label: data.label,
          startDate,
          endDate,
          isActive: true,
          organizationId: ctx.organizationId,
          legacyData: {
            restoredFrom: "newyear.php",
            optionalImports: data.optionalImports,
            mandatoryImports: ["cls", "brs", "chls", "prts"],
            teacherAssignments: data.teachers,
            childAssignments: data.children,
          },
        },
      });

      for (const teacher of data.teachers) {
        await tx.teacher.update({
          where: { id: teacher.teacherId },
          data: { classId: teacher.classId },
        });
      }

      for (const childAssignment of data.children) {
        const currentChild = childrenById.get(childAssignment.childId);
        if (!currentChild) continue;

        await tx.childHistory.create({
          data: {
            childId: currentChild.id,
            snapshot: JSON.parse(JSON.stringify(currentChild)),
            changedBy: ctx.userId,
            changeNote: `New academic year ${data.label}`,
          },
        });

        await tx.child.update({
          where: { id: childAssignment.childId },
          data: {
            schoolYearId: created.id,
            classId: childAssignment.classId,
            childNumber: childAssignment.childNumber || null,
          },
        });
      }

      return created;
    });

    revalidatePath("/settings/new-year");
    revalidatePath("/children");
    revalidatePath("/employees/teachers");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        schoolYearId: schoolYear.id,
        childrenUpdated: data.children.length,
        teachersUpdated: data.teachers.length,
      },
    };
  } catch (error) {
    console.error("createNewAcademicYear error:", error);
    return { success: false, error: "Failed to create new academic year" };
  }
}
