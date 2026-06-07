"use server";

import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess, verifyChildAccess } from "@/lib/verify-org-access";
import { revalidatePath } from "next/cache";
import { childFormSchema, childDraftSchema } from "@/lib/validations/child";
import { requireLegacyActionAllowed } from "@/lib/legacy-action-permissions";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

// ── Types ─────────────────────────────────────────

interface GetChildrenParams {
  branchId?: string;
  classId?: string;
  gender?: "MALE" | "FEMALE";
  status?: "ACTIVE" | "DRAFT" | "INACTIVE";
  search?: string;
  childNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number | "all";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

type BulkChildBranchClassResult =
  | { success: true; updatedCount: number }
  | { success: false; error: string };

type ChildAttachmentInput = {
  id?: string;
  title?: string;
  filename: string;
  fileUrl: string;
  type?: string;
};

// ── Helpers ───────────────────────────────────────

const removeAttachmentIdsSchema = z.array(z.string().uuid()).max(50);
const bulkChildIdsSchema = z.array(z.string().min(1)).min(1).max(250);

function parseTimeField(value: string | undefined): Date | null {
  if (!value) return null;
  return new Date(`1970-01-01T${value}`);
}

function parseDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseDateEnd(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function parseJsonPayload<T>(
  value: unknown,
  schema: z.ZodType<T>,
  fallback: T
): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function parseRemoveAttachmentIds(value: unknown): string[] {
  return parseJsonPayload(value, removeAttachmentIdsSchema, []);
}

function childAttachmentCreates(attachments: ChildAttachmentInput[]) {
  return attachments
    .filter((attachment) => !attachment.id && attachment.fileUrl && attachment.filename)
    .map((attachment) => ({
      title: attachment.title || null,
      filename: attachment.filename,
      fileUrl: attachment.fileUrl,
      type: attachment.type || null,
    }));
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
    attachments: parseJsonPayload(raw.attachments, z.array(z.unknown()), []),
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
    childNumber,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    createdFrom,
    createdTo,
    page = 1,
    pageSize = 20,
    sortBy,
    sortOrder = "asc",
  } = params;

  try {
    const { organizationId: orgId } = await requireOrg();

    const where: Prisma.ChildWhereInput = {
      branch: { organizationId: orgId },
    };

    if (branchId) where.branchId = branchId;
    if (classId) where.classId = classId;
    if (gender) where.gender = gender;
    if (childNumber?.trim()) {
      where.childNumber = { contains: childNumber.trim(), mode: "insensitive" };
    }
    if (firstName?.trim()) {
      where.firstName = { contains: firstName.trim(), mode: "insensitive" };
    }
    if (lastName?.trim()) {
      where.lastName = { contains: lastName.trim(), mode: "insensitive" };
    }
    if (dateOfBirth?.trim()) {
      where.dateOfBirth = parseDateStart(dateOfBirth.trim());
    }
    if (nationality?.trim()) {
      where.nationality = { contains: nationality.trim(), mode: "insensitive" };
    }
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = parseDateStart(createdFrom);
      if (createdTo) where.createdAt.lte = parseDateEnd(createdTo);
    }

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
        { childNumber: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { nationality: { contains: search, mode: "insensitive" } },
        { branch: { name: { contains: search, mode: "insensitive" } } },
        { class: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const paginated = pageSize !== "all";
    const numericPageSize = paginated ? Math.max(1, pageSize) : undefined;
    const skip = numericPageSize ? (page - 1) * numericPageSize : undefined;

    const orderBy: Prisma.ChildOrderByWithRelationInput[] = [];
    if (sortBy === "childNumber") {
      orderBy.push({ childNumber: sortOrder });
    } else if (sortBy === "firstName") {
      orderBy.push({ firstName: sortOrder });
    } else if (sortBy === "lastName") {
      orderBy.push({ lastName: sortOrder });
    } else if (sortBy === "branchName") {
      orderBy.push({ branch: { name: sortOrder } });
    } else if (sortBy === "className") {
      orderBy.push({ class: { name: sortOrder } });
    } else if (
      sortBy === "gender" ||
      sortBy === "dateOfBirth" ||
      sortBy === "nationality" ||
      sortBy === "createdAt"
    ) {
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
        ...(skip !== undefined ? { skip } : {}),
        ...(numericPageSize !== undefined ? { take: numericPageSize } : {}),
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
    const { organizationId: orgId } = await requireOrg();

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
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        previousGarderies: {
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!child) return null;
    if (child.branch?.organizationId !== orgId) return null;

    return child;
  } catch (error) {
    console.error("getChild error:", error);
    return null;
  }
}

// ── createChild ───────────────────────────────────

export async function createChild(formData: FormData): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "addChild");
    if (!permission.ok) return { success: false, error: permission.error };

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
    const attachmentCreates = childAttachmentCreates(data.attachments);

    // Verify the target branch belongs to this org
    const branchOk = await verifyBranchAccess(data.branchId, ctx.organizationId);
    if (!branchOk) return { success: false, error: "Invalid branch" };

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

        ...(attachmentCreates.length > 0
          ? {
              attachments: {
                create: attachmentCreates,
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
        changedBy: ctx.userId,
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
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "updateChild");
    if (!permission.ok) return { success: false, error: permission.error };

    // Verify child belongs to this org
    const childOk = await verifyChildAccess(id, ctx.organizationId);
    if (!childOk) return { success: false, error: "Child not found" };
    const raw = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    const parsed = parseParentData(raw);
    const removeAttachmentIds = parseRemoveAttachmentIds(raw.removeAttachmentIds);

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
    const attachmentCreates = childAttachmentCreates(data.attachments);
    const attachmentUpdates = data.attachments.filter(
      (attachment) =>
        attachment.id && !removeAttachmentIds.includes(attachment.id)
    );

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

    if (removeAttachmentIds.length) {
      await db.childAttachment.deleteMany({
        where: {
          childId: id,
          id: { in: removeAttachmentIds },
        },
      });
    }

    for (const attachment of attachmentUpdates) {
      await db.childAttachment.updateMany({
        where: { childId: id, id: attachment.id },
        data: {
          title: attachment.title || null,
          filename: attachment.filename,
          fileUrl: attachment.fileUrl,
          type: attachment.type || null,
        },
      });
    }

    if (attachmentCreates.length > 0) {
      await db.childAttachment.createMany({
        data: attachmentCreates.map((attachment) => ({
          childId: id,
          ...attachment,
        })),
      });
    }

    // Create history snapshot
    await db.childHistory.create({
      data: {
        childId: child.id,
        snapshot: JSON.parse(JSON.stringify(child)),
        changedBy: ctx.userId,
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
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "deleteChild");
    if (!permission.ok) return { success: false, error: permission.error };

    const childOk = await verifyChildAccess(id, ctx.organizationId);
    if (!childOk) return { success: false, error: "Child not found" };

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

// ── toggleChildActive ──────────────────────────────

export async function toggleChildActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "updateChild");
    if (!permission.ok) return { success: false, error: permission.error };

    const childOk = await verifyChildAccess(id, ctx.organizationId);
    if (!childOk) return { success: false, error: "Child not found" };

    await db.child.update({
      where: { id },
      data: {
        isActive,
        isDraft: false,
      },
    });

    revalidatePath("/children");
    revalidatePath(`/children/${id}`);
    revalidatePath(`/children/${id}/dashboard`);

    return { success: true, id };
  } catch (error) {
    console.error("toggleChildActive error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update child status";
    return { success: false, error: message };
  }
}

// ── updateChildClass ─────────────────────────────

export async function updateChildClass(
  id: string,
  classId: string
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const permission = await requireLegacyActionAllowed(ctx, "updateChild");
    if (!permission.ok) return { success: false, error: permission.error };

    const child = await db.child.findFirst({
      where: { id, branch: { organizationId: ctx.organizationId } },
      select: { id: true, branchId: true },
    });
    if (!child) return { success: false, error: "Child not found" };

    const targetClass = await db.class.findFirst({
      where: {
        id: classId,
        branchId: child.branchId,
        isActive: true,
        branch: { organizationId: ctx.organizationId },
      },
      select: { id: true },
    });
    if (!targetClass) {
      return { success: false, error: "Class not found for this branch" };
    }

    const updatedChild = await db.child.update({
      where: { id },
      data: { classId },
    });

    await db.childHistory.create({
      data: {
        childId: updatedChild.id,
        snapshot: JSON.parse(JSON.stringify(updatedChild)),
        changedBy: ctx.userId,
        changeNote: "Child class updated",
      },
    });

    revalidatePath("/children");
    revalidatePath(`/children/${id}`);
    revalidatePath(`/children/${id}/dashboard`);
    revalidatePath(`/branches/${child.branchId}/children`);
    revalidatePath(`/branches/${child.branchId}/dashboard`);

    return { success: true, id };
  } catch (error) {
    console.error("updateChildClass error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update child class";
    return { success: false, error: message };
  }
}

// ── bulkUpdateChildrenBranchClass ─────────────────

export async function bulkUpdateChildrenBranchClass(
  childIds: string[],
  branchId: string,
  classId: string
): Promise<BulkChildBranchClassResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  const parsedChildIds = bulkChildIdsSchema.safeParse(
    Array.from(new Set(childIds.map((id) => id.trim()).filter(Boolean)))
  );
  if (!parsedChildIds.success) {
    return { success: false, error: "Select at least one child" };
  }

  if (!branchId.trim() || !classId.trim()) {
    return { success: false, error: "Branch and class are required" };
  }

  try {
    const permission = await requireLegacyActionAllowed(ctx, "updateChild");
    if (!permission.ok) return { success: false, error: permission.error };

    const targetClass = await db.class.findFirst({
      where: {
        id: classId,
        branchId,
        isActive: true,
        branch: { organizationId: ctx.organizationId },
      },
      select: { id: true, branchId: true },
    });
    if (!targetClass) {
      return { success: false, error: "Class not found for this branch" };
    }

    const children = await db.child.findMany({
      where: {
        id: { in: parsedChildIds.data },
        branch: { organizationId: ctx.organizationId },
      },
      select: { id: true, branchId: true },
    });

    if (children.length !== parsedChildIds.data.length) {
      return { success: false, error: "Some selected children were not found" };
    }

    const oldBranchIds = Array.from(new Set(children.map((child) => child.branchId)));
    const updatedChildren = await db.$transaction(async (tx) => {
      const updated = [];
      for (const child of children) {
        const updatedChild = await tx.child.update({
          where: { id: child.id },
          data: {
            branchId: targetClass.branchId,
            classId: targetClass.id,
          },
        });
        await tx.childHistory.create({
          data: {
            childId: updatedChild.id,
            snapshot: JSON.parse(JSON.stringify(updatedChild)),
            changedBy: ctx.userId,
            changeNote: "Child branch/class updated",
          },
        });
        updated.push(updatedChild);
      }
      return updated;
    });

    revalidatePath("/children");
    revalidatePath("/children/drafts");
    for (const child of updatedChildren) {
      revalidatePath(`/children/${child.id}`);
      revalidatePath(`/children/${child.id}/dashboard`);
    }
    for (const id of new Set([...oldBranchIds, targetClass.branchId])) {
      revalidatePath(`/branches/${id}/children`);
      revalidatePath(`/branches/${id}/dashboard`);
    }

    return { success: true, updatedCount: updatedChildren.length };
  } catch (error) {
    console.error("bulkUpdateChildrenBranchClass error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update selected children";
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
    const { organizationId: orgId } = await requireOrg();

    // Verify child belongs to this org
    const childOk = await verifyChildAccess(childId, orgId);
    if (!childOk) throw new Error("Child not found");

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
        where: { childId, deletedAt: null },
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
