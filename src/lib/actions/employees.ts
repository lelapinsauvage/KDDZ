"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";

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
  id?: string;
  type: "CONTRACT" | "MEDICAL_TEST" | "FIRST_AID" | "CERTIFICATE" | "ATTACHMENT";
  title?: string;
  date?: string;
  expiryDate?: string;
  fileUrl?: string;
}

interface EmployeeData {
  username?: string | null;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
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

function attachmentIncludeForEmployee(type: EmployeeType) {
  if (type === "doctor" || type === "manager") {
    return { where: { isActive: true }, orderBy: { createdAt: "desc" } };
  }
  return { orderBy: { createdAt: "desc" } };
}

function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? new Date(value) : value;
}

function documentsWithContent(documents: DocumentData[] | undefined) {
  return (documents ?? []).filter((document) => document.title || document.fileUrl);
}

function employeeDocumentCreateData(document: DocumentData) {
  return {
    type: document.type,
    title: document.title ?? null,
    fileUrl: document.fileUrl || "pending",
    date: toDate(document.date) ?? null,
    expiryDate: toDate(document.expiryDate) ?? null,
  };
}

function documentRowSource(id: string | undefined): "attachment" | "document" {
  return id?.startsWith("document:") ? "document" : "attachment";
}

function documentRowId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
}

function staffAttachmentDelegate(type: EmployeeType) {
  switch (type) {
    case "teacher":
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: db.teacherAttachment as any,
        ownerField: "teacherId",
        softDelete: false,
      };
    case "nurse":
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: db.nurseAttachment as any,
        ownerField: "nurseId",
        softDelete: false,
      };
    case "doctor":
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: db.doctorAttachment as any,
        ownerField: "doctorId",
        softDelete: true,
      };
    case "manager":
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: db.managerAttachment as any,
        ownerField: "managerId",
        softDelete: true,
      };
  }
}

function staffAttachmentCreateData(type: EmployeeType, document: DocumentData) {
  const title = document.title?.trim() || null;
  const fileUrl = document.fileUrl?.trim() || "pending";
  const data: Record<string, unknown> = {
    filename: title || fileUrl,
    fileUrl,
    type: document.type,
  };
  if (type === "doctor" || type === "manager") {
    data.title = title;
    data.expiryDate = toDate(document.expiryDate) ?? null;
    data.isActive = true;
  }
  return data;
}

function attachmentDocuments(documents: DocumentData[] | undefined) {
  return documentsWithContent(documents).filter(
    (document) => documentRowSource(document.id) === "attachment"
  );
}

function modernDocumentRows(documents: DocumentData[] | undefined) {
  return documentsWithContent(documents).filter(
    (document) => documentRowSource(document.id) === "document"
  );
}

async function syncStaffAttachments(
  type: EmployeeType,
  employeeId: string,
  documents: DocumentData[]
) {
  const submittedDocuments = attachmentDocuments(documents);
  const submittedIds = submittedDocuments
    .map((document) => documentRowId(document.id))
    .filter((id): id is string => Boolean(id));
  const { model, ownerField, softDelete } = staffAttachmentDelegate(type);

  const omittedWhere = {
    [ownerField]: employeeId,
    ...(submittedIds.length ? { id: { notIn: submittedIds } } : {}),
  };

  if (softDelete) {
    await model.updateMany({
      where: {
        ...omittedWhere,
        isActive: true,
      },
      data: { isActive: false },
    });
  } else {
    await model.deleteMany({
      where: {
        ...omittedWhere,
        sourceDatabase: null,
        legacyKey: null,
      },
    });
  }

  for (const document of submittedDocuments) {
    const id = documentRowId(document.id);
    const data = staffAttachmentCreateData(type, document);
    if (id) {
      await model.updateMany({
        where: { id, [ownerField]: employeeId },
        data,
      });
    } else {
      await model.create({
        data: {
          [ownerField]: employeeId,
          ...data,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// getEmployees
// ---------------------------------------------------------------------------

export async function getEmployees(
  type: EmployeeType,
  params: EmployeeListParams = {},
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const { model } = getDelegate(type);
    const {
      branchId,
      search,
      isActive,
      page = 1,
      pageSize = 20,
    } = params;

    // Build where clause — always scope to org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { branch: { organizationId: orgId } };

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
    const { organizationId: orgId } = await requireOrg();
    const { model } = getDelegate(type);

    // Manager model has fewer relations; manager document uploads map to attachments.
    const include: Record<string, unknown> = {
      branch: true,
      addresses: true,
      attachments: attachmentIncludeForEmployee(type),
    };
    if (type !== "manager") {
      include.languages = true;
      include.experiences =
        type === "teacher" ? { where: { isActive: true } } : true;
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

    if (employee.branch.organizationId !== orgId) {
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
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    if (!(await verifyBranchAccess(data.branchId, orgId))) {
      return { success: false, error: "Branch does not belong to your organization" };
    }

    const { model, path } = getDelegate(type);

    // Build create payload — Manager has fewer columns than Teacher/Nurse/Doctor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl ?? null,
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

    // Nested languages and experiences only exist on Teacher/Nurse/Doctor.
    // Staff document uploads map to the legacy-compatible attachment tables.
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

    }

    if (data.documents?.length) {
      const documents = attachmentDocuments(data.documents);
      if (documents.length) {
        createData.attachments = {
          create: documents.map((document) =>
            staffAttachmentCreateData(type, document)
          ),
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
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const { model, path } = getDelegate(type);

    // Verify employee belongs to this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (model as any).findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch.organizationId !== orgId) {
      return { success: false, error: `${type} not found` };
    }
    if (
      data.branchId !== undefined &&
      !(await verifyBranchAccess(data.branchId, orgId))
    ) {
      return { success: false, error: "Branch does not belong to your organization" };
    }

    // Build update payload — only include provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Common fields (exist on all employee models including Manager)
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
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

    // Languages and experiences only exist on Teacher/Nurse/Doctor.
    // Staff document uploads are synced separately into legacy-compatible attachments.
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
          deleteMany: type === "teacher" ? { isActive: true } : {},
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
        const documents = modernDocumentRows(data.documents);
        updateData.documents = {
          deleteMany: {},
          ...(documents.length
            ? {
                create: documents.map(employeeDocumentCreateData),
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

    if (data.documents !== undefined) {
      await syncStaffAttachments(type, id, data.documents);
    }

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
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const { model, path } = getDelegate(type);

    // Verify employee belongs to this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (model as any).findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch.organizationId !== orgId) {
      return { success: false, error: `${type} not found` };
    }

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
