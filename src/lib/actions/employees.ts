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

interface EmployeeData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  nationality?: string | null;
  dateOfBirth?: Date | string | null;
  hireDate?: Date | string | null;
  branchId: string;
  specialization?: string | null;
  isActive?: boolean;
  // Doctor-specific
  licenseNumber?: string | null;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employees, total] = await Promise.all([
      (model as any).findMany({
        where,
        include: { branch: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employee = await (model as any).findUnique({
      where: { id },
      include: {
        branch: true,
        addresses: true,
        attachments: true,
      },
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

    // Build create payload with common fields
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

    // Type-specific fields
    if (type === "doctor" && data.licenseNumber !== undefined) {
      createData.licenseNumber = data.licenseNumber;
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

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = toDate(data.dateOfBirth) ?? null;
    if (data.hireDate !== undefined) updateData.hireDate = toDate(data.hireDate) ?? null;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Type-specific fields
    if (type === "doctor" && data.licenseNumber !== undefined) {
      updateData.licenseNumber = data.licenseNumber;
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
