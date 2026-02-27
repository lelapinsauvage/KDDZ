"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmployeeType = "teacher" | "nurse" | "doctor" | "manager";

interface EmployeeListParams {
  branchId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface AddressData {
  governorate?: string;
  district?: string;
  region?: string;
  city?: string;
  street?: string;
  building?: string;
}

interface LanguageData {
  language: "ENGLISH" | "FRENCH" | "ARABIC";
  canRead: string;
  canWrite: string;
  canSpeak: string;
}

interface ExperienceData {
  type: "WORK" | "STAGE" | "WORKSHOP";
  company?: string;
  position?: string;
  fromDate?: string;
  toDate?: string;
  description?: string;
}

interface DocumentData {
  type: "CONTRACT" | "MEDICAL_TEST" | "CERTIFICATE" | "ATTACHMENT";
  title?: string;
  date?: string;
  expiryDate?: string;
  fileUrl?: string;
}

interface EmployeeData {
  username?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  mobile?: string | null;
  nationality?: string | null;
  dateOfBirth?: Date | string | null;
  placeOfBirth?: string | null;
  registerNumber?: string | null;
  maritalStatus?: string | null;
  numberOfChildren?: number | null;
  gender?: string | null;
  medicalCase?: boolean | null;
  medicalCaseDescription?: string | null;
  cnss?: string | null;
  cnssNo?: string | null;
  secondaryDegree?: string | null;
  secondaryDegreeYear?: string | null;
  universityDegree?: string | null;
  universityDegreeYear?: string | null;
  hireDate?: Date | string | null;
  branchId: string;
  classId?: string | null;
  specialization?: string | null;
  isActive?: boolean;
  remarks?: string | null;
  // Doctor-specific
  licenseNumber?: string | null;
  // Nested
  address?: AddressData;
  languages?: LanguageData[];
  experiences?: ExperienceData[];
  documents?: DocumentData[];
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map EmployeeType to the prisma delegate and list path. */
function getDelegate(type: EmployeeType) {
  switch (type) {
    case "teacher":
      return { model: db.teacher, path: "/employees/teachers" };
    case "nurse":
      return { model: db.nurse, path: "/employees/nurses" };
    case "doctor":
      return { model: db.doctor, path: "/employees/doctors" };
    case "manager":
      return { model: db.manager, path: "/employees/managers" };
    default:
      throw new Error(`Unknown employee type: ${type}`);
  }
}

function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? new Date(value) : value;
}

// ---------------------------------------------------------------------------
// getEmployees
// ---------------------------------------------------------------------------

export async function getEmployees(
  type: EmployeeType,
  params: EmployeeListParams = {},
): Promise<ActionResult> {
  try {
    const { model } = getDelegate(type);
    const {
      branchId,
      search,
      isActive,
      page = 1,
      pageSize = 20,
    } = params;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [employees, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (model as any).findMany({
        where,
        include: { branch: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (model as any).count({ where }),
    ]);

    return {
      success: true,
      data: {
        employees,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch ${type}s:`, error);
    return { success: false, error: `Failed to fetch ${type}s` };
  }
}

// ---------------------------------------------------------------------------
// getEmployee
// ---------------------------------------------------------------------------

export async function getEmployee(
  type: EmployeeType,
  id: string,
): Promise<ActionResult> {
  try {
    const { model } = getDelegate(type);

    // Manager model has fewer relations — no languages, experiences, documents
    const include: Record<string, boolean> = {
      branch: true,
      addresses: true,
      attachments: true,
    };
    if (type !== "manager") {
      include.languages = true;
      include.experiences = true;
      include.documents = true;
    }
    if (type === "teacher") {
      include.class = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employee = await (model as any).findUnique({
      where: { id },
      include,
    });

    if (!employee) {
      return { success: false, error: `${type} not found` };
    }

    return { success: true, data: employee };
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error);
    return { success: false, error: `Failed to fetch ${type}` };
  }
}

// ---------------------------------------------------------------------------
// createEmployee
// ---------------------------------------------------------------------------

export async function createEmployee(
  type: EmployeeType,
  data: EmployeeData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { model, path } = getDelegate(type);

    // Build create payload — Manager has fewer columns than Teacher/Nurse/Doctor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      mobile: data.mobile ?? null,
      nationality: data.nationality ?? null,
      dateOfBirth: toDate(data.dateOfBirth) ?? null,
      hireDate: toDate(data.hireDate) ?? null,
      branchId: data.branchId,
      specialization: data.specialization ?? null,
      isActive: data.isActive ?? true,
    };

    // Extended fields — only on Teacher/Nurse/Doctor (not Manager)
    if (type !== "manager") {
      createData.username = data.username ?? null;
      createData.telephone = data.telephone ?? null;
      createData.placeOfBirth = data.placeOfBirth ?? null;
      createData.registerNumber = data.registerNumber ?? null;
      createData.maritalStatus = data.maritalStatus || null;
      createData.numberOfChildren = data.numberOfChildren ?? null;
      createData.gender = data.gender || null;
      createData.medicalCase = data.medicalCase ?? false;
      createData.medicalCaseDescription = data.medicalCaseDescription ?? null;
      createData.cnss = data.cnss ?? null;
      createData.cnssNo = data.cnssNo ?? null;
      createData.secondaryDegree = data.secondaryDegree ?? null;
      createData.secondaryDegreeYear = data.secondaryDegreeYear ?? null;
      createData.universityDegree = data.universityDegree ?? null;
      createData.universityDegreeYear = data.universityDegreeYear ?? null;
      createData.remarks = data.remarks ?? null;
    }

    // Type-specific fields
    if (type === "doctor" && data.licenseNumber !== undefined) {
      createData.licenseNumber = data.licenseNumber;
    }
    if (type === "teacher" && data.classId) {
      createData.classId = data.classId;
    }

    // Nested address — ManagerAddress has fewer fields (street, city, region only)
    if (data.address) {
      const a = data.address;
      if (type === "manager") {
        const hasAddress = a.region || a.city || a.street;
        if (hasAddress) {
          createData.addresses = {
            create: [{
              street: a.street ?? null,
              city: a.city ?? null,
              region: a.region ?? null,
            }],
          };
        }
      } else {
        const hasAddress = a.governorate || a.district || a.region || a.city || a.street || a.building;
        if (hasAddress) {
          createData.addresses = {
            create: [{
              governorate: a.governorate ?? null,
              district: a.district ?? null,
              region: a.region ?? null,
              city: a.city ?? null,
              street: a.street ?? null,
              building: a.building ?? null,
            }],
          };
        }
      }
    }

    // Nested languages, experiences, documents — only on Teacher/Nurse/Doctor
    if (type !== "manager") {
      if (data.languages?.length) {
        createData.languages = {
          create: data.languages.map((l) => ({
            language: l.language,
            canRead: l.canRead || "NONE",
            canWrite: l.canWrite || "NONE",
            canSpeak: l.canSpeak || "NONE",
          })),
        };
      }

      if (data.experiences?.length) {
        createData.experiences = {
          create: data.experiences.map((e) => ({
            type: e.type,
            company: e.company ?? null,
            position: e.position ?? null,
            fromDate: toDate(e.fromDate) ?? null,
            toDate: toDate(e.toDate) ?? null,
            description: e.description ?? null,
          })),
        };
      }

      if (data.documents?.length) {
        createData.documents = {
          create: data.documents
            .filter((d) => d.title || d.fileUrl)
            .map((d) => ({
              type: d.type,
              title: d.title ?? null,
              fileUrl: d.fileUrl || "pending",
              date: toDate(d.date) ?? null,
              expiryDate: toDate(d.expiryDate) ?? null,
            })),
        };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employee = await (model as any).create({ data: createData });

    revalidatePath(path);

    return { success: true, data: employee };
  } catch (error) {
    console.error(`Failed to create ${type}:`, error);
    return { success: false, error: `Failed to create ${type}` };
  }
}

// ---------------------------------------------------------------------------
// updateEmployee
// ---------------------------------------------------------------------------

export async function updateEmployee(
  type: EmployeeType,
  id: string,
  data: Partial<EmployeeData>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { model, path } = getDelegate(type);
    // Build update payload — only include provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Common fields (exist on all employee models including Manager)
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.mobile !== undefined) updateData.mobile = data.mobile || null;
    if (data.nationality !== undefined) updateData.nationality = data.nationality || null;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = toDate(data.dateOfBirth) ?? null;
    if (data.hireDate !== undefined) updateData.hireDate = toDate(data.hireDate) ?? null;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.specialization !== undefined) updateData.specialization = data.specialization || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Extended fields — only on Teacher/Nurse/Doctor (not Manager)
    if (type !== "manager") {
      if (data.username !== undefined) updateData.username = data.username || null;
      if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
      if (data.placeOfBirth !== undefined) updateData.placeOfBirth = data.placeOfBirth || null;
      if (data.registerNumber !== undefined) updateData.registerNumber = data.registerNumber || null;
      if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus || null;
      if (data.numberOfChildren !== undefined) updateData.numberOfChildren = data.numberOfChildren ?? null;
      if (data.gender !== undefined) updateData.gender = data.gender || null;
      if (data.medicalCase !== undefined) updateData.medicalCase = data.medicalCase ?? false;
      if (data.medicalCaseDescription !== undefined) updateData.medicalCaseDescription = data.medicalCaseDescription || null;
      if (data.cnss !== undefined) updateData.cnss = data.cnss || null;
      if (data.cnssNo !== undefined) updateData.cnssNo = data.cnssNo || null;
      if (data.secondaryDegree !== undefined) updateData.secondaryDegree = data.secondaryDegree || null;
      if (data.secondaryDegreeYear !== undefined) updateData.secondaryDegreeYear = data.secondaryDegreeYear || null;
      if (data.universityDegree !== undefined) updateData.universityDegree = data.universityDegree || null;
      if (data.universityDegreeYear !== undefined) updateData.universityDegreeYear = data.universityDegreeYear || null;
      if (data.remarks !== undefined) updateData.remarks = data.remarks || null;
    }

    // Type-specific fields
    if (type === "doctor" && data.licenseNumber !== undefined) {
      updateData.licenseNumber = data.licenseNumber;
    }
    if (type === "teacher" && data.classId !== undefined) {
      updateData.classId = data.classId || null;
    }

    // Address: delete all + recreate — ManagerAddress has fewer fields
    if (data.address) {
      const a = data.address;
      if (type === "manager") {
        const hasAddress = a.region || a.city || a.street;
        updateData.addresses = {
          deleteMany: {},
          ...(hasAddress
            ? {
                create: [{
                  street: a.street ?? null,
                  city: a.city ?? null,
                  region: a.region ?? null,
                }],
              }
            : {}),
        };
      } else {
        const hasAddress = a.governorate || a.district || a.region || a.city || a.street || a.building;
        updateData.addresses = {
          deleteMany: {},
          ...(hasAddress
            ? {
                create: [{
                  governorate: a.governorate ?? null,
                  district: a.district ?? null,
                  region: a.region ?? null,
                  city: a.city ?? null,
                  street: a.street ?? null,
                  building: a.building ?? null,
                }],
              }
            : {}),
        };
      }
    }

    // Languages, experiences, documents — only on Teacher/Nurse/Doctor
    if (type !== "manager") {
      if (data.languages !== undefined) {
        updateData.languages = {
          deleteMany: {},
          ...(data.languages.length
            ? {
                create: data.languages.map((l) => ({
                  language: l.language,
                  canRead: l.canRead || "NONE",
                  canWrite: l.canWrite || "NONE",
                  canSpeak: l.canSpeak || "NONE",
                })),
              }
            : {}),
        };
      }

      if (data.experiences !== undefined) {
        updateData.experiences = {
          deleteMany: {},
          ...(data.experiences.length
            ? {
                create: data.experiences.map((e) => ({
                  type: e.type,
                  company: e.company ?? null,
                  position: e.position ?? null,
                  fromDate: toDate(e.fromDate) ?? null,
                  toDate: toDate(e.toDate) ?? null,
                  description: e.description ?? null,
                })),
              }
            : {}),
        };
      }

      if (data.documents !== undefined) {
        updateData.documents = {
          deleteMany: {},
          ...(data.documents.length
            ? {
                create: data.documents
                  .filter((d) => d.title || d.fileUrl)
                  .map((d) => ({
                    type: d.type,
                    title: d.title ?? null,
                    fileUrl: d.fileUrl || "pending",
                    date: toDate(d.date) ?? null,
                    expiryDate: toDate(d.expiryDate) ?? null,
                  })),
              }
            : {}),
        };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employee = await (model as any).update({
      where: { id },
      data: updateData,
    });

    revalidatePath(path);

    return { success: true, data: employee };
  } catch (error) {
    console.error(`Failed to update ${type}:`, error);
    return { success: false, error: `Failed to update ${type}` };
  }
}

// ---------------------------------------------------------------------------
// deleteEmployee (soft delete)
// ---------------------------------------------------------------------------

export async function deleteEmployee(
  type: EmployeeType,
  id: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { model, path } = getDelegate(type);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (model as any).update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath(path);

    return { success: true };
  } catch (error) {
    console.error(`Failed to delete ${type}:`, error);
    return { success: false, error: `Failed to delete ${type}` };
  }
}
