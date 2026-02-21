"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import type {
  MedicalFormType,
  MedicalFormStatus,
  Prisma,
} from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetMedicalFormsParams {
  childId?: string;
  formType?: MedicalFormType;
  status?: MedicalFormStatus;
  branchId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CreateMedicalFormData {
  childId: string;
  formType: MedicalFormType;
  status?: MedicalFormStatus;
  data?: Record<string, unknown>;
  entries?: Array<{ field: string; value?: string }>;
}

interface UpdateMedicalFormData {
  childId?: string;
  formType?: MedicalFormType;
  status?: MedicalFormStatus;
  data?: Record<string, unknown>;
  entries?: Array<{ id?: string; field: string; value?: string }>;
}

interface GetVaccinationsParams {
  childId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CreateVaccinationData {
  childId: string;
  vaccineName: string;
  dateGiven?: string;
  nextDueDate?: string;
  notes?: string;
}

interface UpdateVaccinationData {
  childId?: string;
  vaccineName?: string;
  dateGiven?: string | null;
  nextDueDate?: string | null;
  notes?: string | null;
}

// ─────────────────────────────────────────────
// getMedicalForms — List with filtering
// ─────────────────────────────────────────────

export async function getMedicalForms(params: GetMedicalFormsParams = {}) {
  try {
    const {
      childId,
      formType,
      status,
      branchId,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.MedicalFormWhereInput = {};

    if (childId) {
      where.childId = childId;
    }

    if (formType) {
      where.formType = formType;
    }

    if (status) {
      where.status = status;
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

    const [forms, total] = await Promise.all([
      db.medicalForm.findMany({
        where,
        include: {
          child: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.medicalForm.count({ where }),
    ]);

    return { forms, total };
  } catch (error) {
    console.error("getMedicalForms error:", error);
    return { forms: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// getMedicalForm — Single form with entries
// ─────────────────────────────────────────────

export async function getMedicalForm(id: string) {
  try {
    const form = await db.medicalForm.findUnique({
      where: { id },
      include: {
        child: {
          include: {
            branch: true,
          },
        },
        entries: true,
      },
    });

    if (!form) {
      return { error: "Medical form not found" };
    }

    return { form };
  } catch (error) {
    console.error("getMedicalForm error:", error);
    return { error: "Failed to load medical form" };
  }
}

// ─────────────────────────────────────────────
// createMedicalForm — Create with nested entries
// ─────────────────────────────────────────────

export async function createMedicalForm(input: CreateMedicalFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!input.childId || !input.formType) {
      return { error: "childId and formType are required" };
    }

    const form = await db.medicalForm.create({
      data: {
        childId: input.childId,
        formType: input.formType,
        status: input.status || "DRAFT",
        data: (input.data as InputJsonValue) ?? undefined,
        entries: input.entries?.length
          ? {
              create: input.entries.map((e) => ({
                field: e.field,
                value: e.value ?? null,
              })),
            }
          : undefined,
      },
      include: {
        entries: true,
      },
    });

    revalidatePath("/medical");
    return { success: true, formId: form.id };
  } catch (error) {
    console.error("createMedicalForm error:", error);
    return { error: "Failed to create medical form" };
  }
}

// ─────────────────────────────────────────────
// updateMedicalForm — Update form and sync entries
// ─────────────────────────────────────────────

export async function updateMedicalForm(id: string, input: UpdateMedicalFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.medicalForm.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Medical form not found" };
    }

    // Build update data
    const updateData: Prisma.MedicalFormUpdateInput = {};

    if (input.childId !== undefined) {
      updateData.child = { connect: { id: input.childId } };
    }
    if (input.formType !== undefined) {
      updateData.formType = input.formType;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.data !== undefined) {
      updateData.data = input.data as InputJsonValue;
    }

    // Sync entries: delete all existing and re-create
    if (input.entries !== undefined) {
      await db.medicalFormEntry.deleteMany({ where: { medicalFormId: id } });
      updateData.entries = {
        create: input.entries.map((e) => ({
          field: e.field,
          value: e.value ?? null,
        })),
      };
    }

    const form = await db.medicalForm.update({
      where: { id },
      data: updateData,
      include: {
        entries: true,
      },
    });

    revalidatePath("/medical");
    return { success: true, formId: form.id };
  } catch (error) {
    console.error("updateMedicalForm error:", error);
    return { error: "Failed to update medical form" };
  }
}

// ─────────────────────────────────────────────
// deleteMedicalForm
// ─────────────────────────────────────────────

export async function deleteMedicalForm(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.medicalForm.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Medical form not found" };
    }

    await db.medicalForm.delete({ where: { id } });

    revalidatePath("/medical");
    return { success: true };
  } catch (error) {
    console.error("deleteMedicalForm error:", error);
    return { error: "Failed to delete medical form" };
  }
}

// ─────────────────────────────────────────────
// getVaccinations — List with filtering
// ─────────────────────────────────────────────

export async function getVaccinations(params: GetVaccinationsParams = {}) {
  try {
    const { childId, search, page = 1, pageSize = 20 } = params;

    const where: Prisma.VaccinationWhereInput = {};

    if (childId) {
      where.childId = childId;
    }

    if (search) {
      where.OR = [
        { vaccineName: { contains: search, mode: "insensitive" } },
        {
          child: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [vaccinations, total] = await Promise.all([
      db.vaccination.findMany({
        where,
        include: {
          child: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: { dateGiven: "desc" },
        skip,
        take: pageSize,
      }),
      db.vaccination.count({ where }),
    ]);

    return { vaccinations, total };
  } catch (error) {
    console.error("getVaccinations error:", error);
    return { vaccinations: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// createVaccination
// ─────────────────────────────────────────────

export async function createVaccination(input: CreateVaccinationData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!input.childId || !input.vaccineName) {
      return { error: "childId and vaccineName are required" };
    }

    const vaccination = await db.vaccination.create({
      data: {
        childId: input.childId,
        vaccineName: input.vaccineName,
        dateGiven: input.dateGiven ? new Date(input.dateGiven) : null,
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : null,
        notes: input.notes ?? null,
      },
    });

    revalidatePath("/medical");
    return { success: true, vaccinationId: vaccination.id };
  } catch (error) {
    console.error("createVaccination error:", error);
    return { error: "Failed to create vaccination" };
  }
}

// ─────────────────────────────────────────────
// updateVaccination
// ─────────────────────────────────────────────

export async function updateVaccination(id: string, input: UpdateVaccinationData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.vaccination.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Vaccination not found" };
    }

    const updateData: Prisma.VaccinationUpdateInput = {};

    if (input.childId !== undefined) {
      updateData.child = { connect: { id: input.childId } };
    }
    if (input.vaccineName !== undefined) {
      updateData.vaccineName = input.vaccineName;
    }
    if (input.dateGiven !== undefined) {
      updateData.dateGiven = input.dateGiven ? new Date(input.dateGiven) : null;
    }
    if (input.nextDueDate !== undefined) {
      updateData.nextDueDate = input.nextDueDate ? new Date(input.nextDueDate) : null;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    const vaccination = await db.vaccination.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/medical");
    return { success: true, vaccinationId: vaccination.id };
  } catch (error) {
    console.error("updateVaccination error:", error);
    return { error: "Failed to update vaccination" };
  }
}

// ─────────────────────────────────────────────
// deleteVaccination
// ─────────────────────────────────────────────

export async function deleteVaccination(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.vaccination.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Vaccination not found" };
    }

    await db.vaccination.delete({ where: { id } });

    revalidatePath("/medical");
    return { success: true };
  } catch (error) {
    console.error("deleteVaccination error:", error);
    return { error: "Failed to delete vaccination" };
  }
}
