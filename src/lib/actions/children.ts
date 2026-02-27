"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { childFormSchema, childDraftSchema } from "@/lib/validations/child";
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
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ── Helpers ───────────────────────────────────────

function parseTimeField(value: string | undefined): Date | null {
  if (!value) return null;
  return new Date(`1970-01-01T${value}`);
}

function parseParentData(raw: Record<string, unknown>) {
  return {
    ...raw,
    mother: raw.mother ? JSON.parse(raw.mother as string) : undefined,
    father: raw.father ? JSON.parse(raw.father as string) : undefined,
    addresses: raw.addresses ? JSON.parse(raw.addresses as string) : [],
    siblings: raw.siblings ? JSON.parse(raw.siblings as string) : [],
    relatives: raw.relatives ? JSON.parse(raw.relatives as string) : [],
    accountingEntries: raw.accountingEntries
      ? JSON.parse(raw.accountingEntries as string)
      : [],
    busAttendance: (raw.busAttendance as string) || "false",
    isActive: raw.isActive === "true" || raw.isActive === undefined,
    isDraft: raw.isDraft === "true",
    lunchIncluded: raw.lunchIncluded === "true" || raw.lunchIncluded === undefined,
    previousGarderie: raw.previousGarderie === "true",
    milkPortions: raw.milkPortions ? Number(raw.milkPortions) : 0,
    milkScoop: raw.milkScoop ? Number(raw.milkScoop) : 0,
    garderieFees: raw.garderieFees ? Number(raw.garderieFees) : 0,
    extraFees: raw.extraFees ? Number(raw.extraFees) : 0,
    busFees: raw.busFees ? Number(raw.busFees) : 0,
    apronFees: raw.apronFees ? Number(raw.apronFees) : 0,
    registrationFees: raw.registrationFees ? Number(raw.registrationFees) : 0,
    activitiesFees: raw.activitiesFees ? Number(raw.activitiesFees) : 0,
    discount: raw.discount ? Number(raw.discount) : 0,
    tva: raw.tva ? Number(raw.tva) : 0,
  };
}

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
    sortBy,
    sortOrder = "asc",
  } = params;

  try {
    const where: Prisma.ChildWhereInput = {};

    if (branchId) where.branchId = branchId;
    if (classId) where.classId = classId;
    if (gender) where.gender = gender;

    if (status === "ACTIVE") {
      where.isActive = true;
      where.isDraft = false;
    } else if (status === "DRAFT") {
      where.isDraft = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
      where.isDraft = false;
    }

    if (search && search.trim() !== "") {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const orderBy: Prisma.ChildOrderByWithRelationInput[] = [];
    if (sortBy === "fullName") {
      orderBy.push({ lastName: sortOrder }, { firstName: sortOrder });
    } else if (sortBy === "branchName") {
      orderBy.push({ branch: { name: sortOrder } });
    } else if (sortBy === "className") {
      orderBy.push({ class: { name: sortOrder } });
    } else if (sortBy === "gender" || sortBy === "dateOfBirth") {
      orderBy.push({ [sortBy]: sortOrder });
    } else {
      orderBy.push({ lastName: "asc" }, { firstName: "asc" });
    }

    const [children, total] = await Promise.all([
      db.child.findMany({
        where,
        include: {
          class: true,
          branch: true,
        },
        orderBy,
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
        siblings: true,
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
    const raw = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    const parsed = parseParentData(raw);

    const schema = parsed.isDraft ? childDraftSchema : childFormSchema;
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message ?? "Validation failed",
      };
    }

    const data = validation.data;

    const child = await db.child.create({
      data: {
        firstName: data.firstName,
        firstNameAr: data.firstNameAr || null,
        middleName: data.middleName || null,
        lastName: data.lastName,
        lastNameAr: data.lastNameAr || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth || null,
        gender: data.gender,
        nationality: data.nationality || null,
        religion: data.religion || null,
        idNumber: data.idNumber || null,
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
        milkScoop: data.milkScoop || null,
        milkTime1: parseTimeField(data.milkTime1),
        milkTime2: parseTimeField(data.milkTime2),
        milkTime3: parseTimeField(data.milkTime3),
        lunchIncluded: data.lunchIncluded,
        sleepFrom: parseTimeField(data.sleepFrom),
        sleepTo: parseTimeField(data.sleepTo),
        remarks: data.remarks || null,
        language: data.language || null,
        previousGarderie: data.previousGarderie,
        previousGarderieName: data.previousGarderieName || null,
        childNumber: data.childNumber || null,

        // Financial
        garderieFees: data.garderieFees || null,
        extraFees: data.extraFees || null,
        busFees: data.busFees || null,
        apronFees: data.apronFees || null,
        registrationFees: data.registrationFees || null,
        activitiesFees: data.activitiesFees || null,
        discount: data.discount || null,
        tva: data.tva || null,
        financialRemarks: data.financialRemarks || null,

        // Nested create for parents
        parents: {
          create: [
            ...(data.mother && (data.mother.firstName || data.mother.lastName)
              ? [
                  {
                    type: "MOTHER" as const,
                    firstName: data.mother.firstName || null,
                    lastName: data.mother.lastName || null,
                    nationality: data.mother.nationality || null,
                    phone: data.mother.phone || null,
                    mobile: data.mother.mobile || null,
                    email: data.mother.email || null,
                    profession: data.mother.profession || null,
                    workplace: data.mother.workplace || null,
                    workPhone: data.mother.workPhone || null,
                    maritalStatus: data.mother.maritalStatus || null,
                    divorceSituation: data.mother.divorceSituation || null,
                    medicalCase: data.mother.medicalCase || null,
                    canPickUp: data.mother.canPickUp,
                    idNumber: data.mother.idNumber || null,
                  },
                ]
              : []),
            ...(data.father && (data.father.firstName || data.father.lastName)
              ? [
                  {
                    type: "FATHER" as const,
                    firstName: data.father.firstName || null,
                    lastName: data.father.lastName || null,
                    nationality: data.father.nationality || null,
                    phone: data.father.phone || null,
                    mobile: data.father.mobile || null,
                    email: data.father.email || null,
                    profession: data.father.profession || null,
                    workplace: data.father.workplace || null,
                    workPhone: data.father.workPhone || null,
                    maritalStatus: data.father.maritalStatus || null,
                    divorceSituation: data.father.divorceSituation || null,
                    medicalCase: data.father.medicalCase || null,
                    canPickUp: data.father.canPickUp,
                    idNumber: data.father.idNumber || null,
                  },
                ]
              : []),
          ],
        },

        // Nested create for addresses
        ...(data.addresses.length > 0
          ? {
              addresses: {
                create: data.addresses.map((a) => ({
                  addressType: a.addressType || null,
                  country: a.country || null,
                  street: a.street || null,
                  building: a.building || null,
                  floor: a.floor || null,
                  city: a.city || null,
                  telephone: a.telephone || null,
                })),
              },
            }
          : {}),

        // Nested create for siblings
        ...(data.siblings.length > 0
          ? {
              siblings: {
                create: data.siblings.map((s) => ({
                  relation: s.relation || null,
                  firstName: s.firstName || null,
                  dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
                  medicalCase: s.medicalCase || null,
                  canPickUp: s.canPickUp,
                })),
              },
            }
          : {}),

        // Nested create for relatives
        ...(data.relatives.length > 0
          ? {
              relatives: {
                create: data.relatives.map((r) => ({
                  name: r.name,
                  lastName: r.lastName || null,
                  relation: r.relation || null,
                  phone: r.phone || null,
                  mobile: r.mobile || null,
                  isAuthorized: r.isAuthorized,
                  isEmergencyContact: r.isEmergencyContact,
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
    const raw = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    const parsed = parseParentData(raw);

    const schema = parsed.isDraft ? childDraftSchema : childFormSchema;
    const validation = schema.safeParse(parsed);
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

    const existingMother = existing.parents.find((p) => p.type === "MOTHER");
    const existingFather = existing.parents.find((p) => p.type === "FATHER");

    // Update child record
    const child = await db.child.update({
      where: { id },
      data: {
        firstName: data.firstName,
        firstNameAr: data.firstNameAr || null,
        middleName: data.middleName || null,
        lastName: data.lastName,
        lastNameAr: data.lastNameAr || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth || null,
        gender: data.gender,
        nationality: data.nationality || null,
        religion: data.religion || null,
        idNumber: data.idNumber || null,
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
        milkScoop: data.milkScoop || null,
        milkTime1: parseTimeField(data.milkTime1),
        milkTime2: parseTimeField(data.milkTime2),
        milkTime3: parseTimeField(data.milkTime3),
        lunchIncluded: data.lunchIncluded,
        sleepFrom: parseTimeField(data.sleepFrom),
        sleepTo: parseTimeField(data.sleepTo),
        remarks: data.remarks || null,
        language: data.language || null,
        previousGarderie: data.previousGarderie,
        previousGarderieName: data.previousGarderieName || null,
        childNumber: data.childNumber || null,

        // Financial
        garderieFees: data.garderieFees || null,
        extraFees: data.extraFees || null,
        busFees: data.busFees || null,
        apronFees: data.apronFees || null,
        registrationFees: data.registrationFees || null,
        activitiesFees: data.activitiesFees || null,
        discount: data.discount || null,
        tva: data.tva || null,
        financialRemarks: data.financialRemarks || null,
      },
    });

    // Helper to build parent data
    function buildParentData(guardian: typeof data.mother) {
      return {
        firstName: guardian.firstName || null,
        lastName: guardian.lastName || null,
        nationality: guardian.nationality || null,
        phone: guardian.phone || null,
        mobile: guardian.mobile || null,
        email: guardian.email || null,
        profession: guardian.profession || null,
        workplace: guardian.workplace || null,
        workPhone: guardian.workPhone || null,
        maritalStatus: guardian.maritalStatus || null,
        divorceSituation: guardian.divorceSituation || null,
        medicalCase: guardian.medicalCase || null,
        canPickUp: guardian.canPickUp,
        idNumber: guardian.idNumber || null,
      };
    }

    // Upsert mother
    if (data.mother && (data.mother.firstName || data.mother.lastName)) {
      const motherData = buildParentData(data.mother);
      if (existingMother) {
        await db.parent.update({
          where: { id: existingMother.id },
          data: motherData,
        });
      } else {
        await db.parent.create({
          data: { childId: id, type: "MOTHER", ...motherData },
        });
      }
    }

    // Upsert father
    if (data.father && (data.father.firstName || data.father.lastName)) {
      const fatherData = buildParentData(data.father);
      if (existingFather) {
        await db.parent.update({
          where: { id: existingFather.id },
          data: fatherData,
        });
      } else {
        await db.parent.create({
          data: { childId: id, type: "FATHER", ...fatherData },
        });
      }
    }

    // Sync addresses: delete all then recreate
    await db.childAddress.deleteMany({ where: { childId: id } });
    if (data.addresses.length > 0) {
      await db.childAddress.createMany({
        data: data.addresses.map((a) => ({
          childId: id,
          addressType: a.addressType || null,
          country: a.country || null,
          street: a.street || null,
          building: a.building || null,
          floor: a.floor || null,
          city: a.city || null,
          telephone: a.telephone || null,
        })),
      });
    }

    // Sync siblings: delete all then recreate
    await db.childSibling.deleteMany({ where: { childId: id } });
    if (data.siblings.length > 0) {
      await db.childSibling.createMany({
        data: data.siblings.map((s) => ({
          childId: id,
          relation: s.relation || null,
          firstName: s.firstName || null,
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
          medicalCase: s.medicalCase || null,
          canPickUp: s.canPickUp,
        })),
      });
    }

    // Sync relatives: delete all then recreate
    await db.relative.deleteMany({ where: { childId: id } });
    if (data.relatives.length > 0) {
      await db.relative.createMany({
        data: data.relatives.map((r) => ({
          childId: id,
          name: r.name,
          lastName: r.lastName || null,
          relation: r.relation || null,
          phone: r.phone || null,
          mobile: r.mobile || null,
          isAuthorized: r.isAuthorized,
          isEmergencyContact: r.isEmergencyContact,
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

// ── getChildDashboardStats ────────────────────────
// Aggregated counts for the child dashboard overview

export async function getChildDashboardStats(childId: string) {
  try {
    const [
      incomingCalls,
      outgoingCalls,
      accidentReports,
      totalPayments,
      totalAttendance,
      totalAbsence,
      totalDailyReports,
      totalAbsenceReports,
      assessments,
    ] = await Promise.all([
      db.callLog.count({ where: { childId, direction: "INCOMING" } }),
      db.callLog.count({ where: { childId, direction: "OUTGOING" } }),
      db.medicalForm.count({ where: { childId, formType: "ACCIDENTS" } }),
      db.payment.aggregate({
        where: { childId },
        _sum: { amount: true },
      }),
      db.dailyReport.count({
        where: { childId, status: "SUBMITTED" },
      }),
      db.absenceReport.count({ where: { childId } }),
      db.dailyReport.count({ where: { childId } }),
      db.absenceReport.count({ where: { childId } }),
      db.assessment.findMany({
        where: { childId },
        select: {
          id: true,
          assessmentType: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      incomingCalls,
      outgoingCalls,
      accidentReports,
      totalPayments: totalPayments._sum.amount
        ? Number(totalPayments._sum.amount)
        : 0,
      totalAttendance,
      totalAbsence,
      totalDailyReports,
      totalAbsenceReports,
      assessments,
    };
  } catch (error) {
    console.error("getChildDashboardStats error:", error);
    return {
      incomingCalls: 0,
      outgoingCalls: 0,
      accidentReports: 0,
      totalPayments: 0,
      totalAttendance: 0,
      totalAbsence: 0,
      totalDailyReports: 0,
      totalAbsenceReports: 0,
      assessments: [],
    };
  }
}
