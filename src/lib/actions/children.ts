"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { childFormSchema } from "@/lib/validations/child";
import type { Prisma } from "@/generated/prisma/client";

// ── Types ─────────────────────────────────────────

interface GetChildrenParams {
  branchId?: string;
  classId?: string;
  gender?: "MALE" | "FEMALE";
  status?: "ACTIVE" | "DRAFT" | "INACTIVE";
  search?: string;
  page?: number;
  pageSize?: number;
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ── getChildren ───────────────────────────────────

export async function getChildren(params: GetChildrenParams = {}) {
  const {
    branchId,
    classId,
    gender,
    status,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  try {
    const where: Prisma.ChildWhereInput = {};

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Class filter
    if (classId) {
      where.classId = classId;
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Status filter
    if (status === "ACTIVE") {
      where.isActive = true;
      where.isDraft = false;
    } else if (status === "DRAFT") {
      where.isDraft = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
      where.isDraft = false;
    }

    // Search by firstName + lastName (case insensitive)
    if (search && search.trim() !== "") {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [children, total] = await Promise.all([
      db.child.findMany({
        where,
        include: {
          class: true,
          branch: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
      db.child.count({ where }),
    ]);

    return { children, total };
  } catch (error) {
    console.error("getChildren error:", error);
    return { children: [], total: 0 };
  }
}

// ── getChild ──────────────────────────────────────

export async function getChild(id: string) {
  try {
    const child = await db.child.findUnique({
      where: { id },
      include: {
        parents: true,
        relatives: true,
        class: true,
        branch: true,
        schoolYear: true,
        accountingEntries: {
          orderBy: { date: "desc" },
        },
        addresses: {
          include: { region: true },
        },
      },
    });

    return child;
  } catch (error) {
    console.error("getChild error:", error);
    return null;
  }
}

// ── createChild ───────────────────────────────────

export async function createChild(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Parse FormData into a plain object
    const raw = Object.fromEntries(formData.entries());

    // FormData sends nested objects as JSON strings from the client,
    // so we need to parse those back
    const parsed = {
      ...raw,
      mother: raw.mother ? JSON.parse(raw.mother as string) : undefined,
      father: raw.father ? JSON.parse(raw.father as string) : undefined,
      relatives: raw.relatives
        ? JSON.parse(raw.relatives as string)
        : [],
      accountingEntries: raw.accountingEntries
        ? JSON.parse(raw.accountingEntries as string)
        : [],
      busAttendance: raw.busAttendance === "true",
      isActive: raw.isActive === "true" || raw.isActive === undefined,
      isDraft: raw.isDraft === "true",
      milkPortions: raw.milkPortions ? Number(raw.milkPortions) : 0,
    };

    // Validate
    const validation = childFormSchema.safeParse(parsed);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message ?? "Validation failed",
      };
    }

    const data = validation.data;

    // Build the child create input
    const child = await db.child.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth || null,
        gender: data.gender,
        nationality: data.nationality || null,
        bloodType: data.bloodType || null,
        allergies: data.allergies || null,
        photo: data.photo || null,
        branchId: data.branchId,
        classId: data.classId || null,
        schoolYearId: data.schoolYearId || null,
        isActive: data.isActive,
        isDraft: data.isDraft,
        enrollmentDate: data.enrollmentDate
          ? new Date(data.enrollmentDate)
          : new Date(),
        busAttendance: data.busAttendance,
        diaperType: data.diaperType || null,
        milkType: data.milkType || null,
        milkPortions: data.milkPortions || null,
        sleepFrom: data.sleepFrom
          ? new Date(`1970-01-01T${data.sleepFrom}`)
          : null,
        sleepTo: data.sleepTo
          ? new Date(`1970-01-01T${data.sleepTo}`)
          : null,
        remarks: data.remarks || null,
        language: data.language || null,

        // Nested create for parents
        parents: {
          create: [
            // Mother
            ...(data.mother &&
            (data.mother.firstName || data.mother.lastName)
              ? [
                  {
                    type: "MOTHER" as const,
                    firstName: data.mother.firstName || null,
                    lastName: data.mother.lastName || null,
                    nationality: data.mother.nationality || null,
                    phone: data.mother.phone || null,
                    mobile: data.mother.mobile || null,
                    email: data.mother.email || null,
                  },
                ]
              : []),
            // Father
            ...(data.father &&
            (data.father.firstName || data.father.lastName)
              ? [
                  {
                    type: "FATHER" as const,
                    firstName: data.father.firstName || null,
                    lastName: data.father.lastName || null,
                    nationality: data.father.nationality || null,
                    phone: data.father.phone || null,
                    mobile: data.father.mobile || null,
                    email: data.father.email || null,
                    workplace: data.father.workplace || null,
                    workPhone: data.father.workPhone || null,
                  },
                ]
              : []),
          ],
        },

        // Nested create for relatives
        ...(data.relatives.length > 0
          ? {
              relatives: {
                create: data.relatives.map((r) => ({
                  name: r.name,
                  relation: r.relation || null,
                  phone: r.phone || null,
                  isAuthorized: r.isAuthorized,
                })),
              },
            }
          : {}),

        // Nested create for accounting entries
        ...(data.accountingEntries.length > 0
          ? {
              accountingEntries: {
                create: data.accountingEntries.map((entry) => ({
                  description: entry.description,
                  amount: entry.amount,
                  type: entry.type,
                  date: new Date(),
                })),
              },
            }
          : {}),
      },
    });

    // Create history snapshot
    await db.childHistory.create({
      data: {
        childId: child.id,
        snapshot: JSON.parse(JSON.stringify(child)),
        changedBy: session.user.id,
        changeNote: "Child created",
      },
    });

    revalidatePath("/children");

    return { success: true, id: child.id };
  } catch (error) {
    console.error("createChild error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create child";
    return { success: false, error: message };
  }
}

// ── updateChild ───────────────────────────────────

export async function updateChild(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Parse FormData
    const raw = Object.fromEntries(formData.entries());
    const parsed = {
      ...raw,
      mother: raw.mother ? JSON.parse(raw.mother as string) : undefined,
      father: raw.father ? JSON.parse(raw.father as string) : undefined,
      relatives: raw.relatives
        ? JSON.parse(raw.relatives as string)
        : [],
      accountingEntries: raw.accountingEntries
        ? JSON.parse(raw.accountingEntries as string)
        : [],
      busAttendance: raw.busAttendance === "true",
      isActive: raw.isActive === "true" || raw.isActive === undefined,
      isDraft: raw.isDraft === "true",
      milkPortions: raw.milkPortions ? Number(raw.milkPortions) : 0,
    };

    // Validate
    const validation = childFormSchema.safeParse(parsed);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message ?? "Validation failed",
      };
    }

    const data = validation.data;

    // Verify child exists
    const existing = await db.child.findUnique({
      where: { id },
      include: { parents: true },
    });
    if (!existing) {
      return { success: false, error: "Child not found" };
    }

    // Find existing parent records for upsert
    const existingMother = existing.parents.find((p) => p.type === "MOTHER");
    const existingFather = existing.parents.find((p) => p.type === "FATHER");

    // Update child record
    const child = await db.child.update({
      where: { id },
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth || null,
        gender: data.gender,
        nationality: data.nationality || null,
        bloodType: data.bloodType || null,
        allergies: data.allergies || null,
        photo: data.photo || null,
        branchId: data.branchId,
        classId: data.classId || null,
        schoolYearId: data.schoolYearId || null,
        isActive: data.isActive,
        isDraft: data.isDraft,
        enrollmentDate: data.enrollmentDate
          ? new Date(data.enrollmentDate)
          : undefined,
        busAttendance: data.busAttendance,
        diaperType: data.diaperType || null,
        milkType: data.milkType || null,
        milkPortions: data.milkPortions || null,
        sleepFrom: data.sleepFrom
          ? new Date(`1970-01-01T${data.sleepFrom}`)
          : null,
        sleepTo: data.sleepTo
          ? new Date(`1970-01-01T${data.sleepTo}`)
          : null,
        remarks: data.remarks || null,
        language: data.language || null,
      },
    });

    // Upsert mother
    if (data.mother && (data.mother.firstName || data.mother.lastName)) {
      if (existingMother) {
        await db.parent.update({
          where: { id: existingMother.id },
          data: {
            firstName: data.mother.firstName || null,
            lastName: data.mother.lastName || null,
            nationality: data.mother.nationality || null,
            phone: data.mother.phone || null,
            mobile: data.mother.mobile || null,
            email: data.mother.email || null,
          },
        });
      } else {
        await db.parent.create({
          data: {
            childId: id,
            type: "MOTHER",
            firstName: data.mother.firstName || null,
            lastName: data.mother.lastName || null,
            nationality: data.mother.nationality || null,
            phone: data.mother.phone || null,
            mobile: data.mother.mobile || null,
            email: data.mother.email || null,
          },
        });
      }
    }

    // Upsert father
    if (data.father && (data.father.firstName || data.father.lastName)) {
      if (existingFather) {
        await db.parent.update({
          where: { id: existingFather.id },
          data: {
            firstName: data.father.firstName || null,
            lastName: data.father.lastName || null,
            nationality: data.father.nationality || null,
            phone: data.father.phone || null,
            mobile: data.father.mobile || null,
            email: data.father.email || null,
            workplace: data.father.workplace || null,
            workPhone: data.father.workPhone || null,
          },
        });
      } else {
        await db.parent.create({
          data: {
            childId: id,
            type: "FATHER",
            firstName: data.father.firstName || null,
            lastName: data.father.lastName || null,
            nationality: data.father.nationality || null,
            phone: data.father.phone || null,
            mobile: data.father.mobile || null,
            email: data.father.email || null,
            workplace: data.father.workplace || null,
            workPhone: data.father.workPhone || null,
          },
        });
      }
    }

    // Sync relatives: delete all then recreate
    await db.relative.deleteMany({ where: { childId: id } });
    if (data.relatives.length > 0) {
      await db.relative.createMany({
        data: data.relatives.map((r) => ({
          childId: id,
          name: r.name,
          relation: r.relation || null,
          phone: r.phone || null,
          isAuthorized: r.isAuthorized,
        })),
      });
    }

    // Sync accounting entries: delete all then recreate
    await db.accountingEntry.deleteMany({ where: { childId: id } });
    if (data.accountingEntries.length > 0) {
      await db.accountingEntry.createMany({
        data: data.accountingEntries.map((entry) => ({
          childId: id,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
          date: new Date(),
        })),
      });
    }

    // Create history snapshot
    await db.childHistory.create({
      data: {
        childId: child.id,
        snapshot: JSON.parse(JSON.stringify(child)),
        changedBy: session.user.id,
        changeNote: "Child updated",
      },
    });

    revalidatePath("/children");
    revalidatePath(`/children/${id}`);

    return { success: true, id: child.id };
  } catch (error) {
    console.error("updateChild error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update child";
    return { success: false, error: message };
  }
}

// ── deleteChild ───────────────────────────────────

export async function deleteChild(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Soft delete: set isActive=false, isDraft=false
    await db.child.update({
      where: { id },
      data: {
        isActive: false,
        isDraft: false,
      },
    });

    revalidatePath("/children");

    return { success: true, id };
  } catch (error) {
    console.error("deleteChild error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete child";
    return { success: false, error: message };
  }
}

// ── getDrafts ─────────────────────────────────────

export async function getDrafts(params: Omit<GetChildrenParams, "status"> = {}) {
  return getChildren({ ...params, status: "DRAFT" });
}
