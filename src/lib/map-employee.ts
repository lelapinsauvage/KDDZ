import type { Employee, EmployeeType } from "@/components/employees/employee-columns";

/**
 * Maps a raw Prisma employee record (with included `branch` relation)
 * to the flat `Employee` shape expected by the data-table columns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEmployee(raw: any, type: EmployeeType): Employee {
  return {
    id: raw.id,
    legacyId: raw.legacyId ?? null,
    branchId: raw.branchId ?? null,
    classId: raw.classId ?? null,
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    imageUrl: raw.imageUrl ?? null,
    email: raw.email ?? "",
    phone: raw.phone ?? raw.mobile ?? "",
    mobile: raw.mobile ?? "",
    dateOfBirth: raw.dateOfBirth
      ? new Date(raw.dateOfBirth).toISOString()
      : "",
    nationality: raw.nationality ?? "",
    gender: raw.gender ?? "",
    branch: raw.branch?.name ?? "—",
    className: raw.class?.name ?? "",
    specialization: raw.specialization ?? undefined,
    hireDate: raw.hireDate
      ? new Date(raw.hireDate).toISOString()
      : new Date().toISOString(),
    createdAt: raw.createdAt
      ? new Date(raw.createdAt).toISOString()
      : "",
    status: raw.isActive === false ? "Inactive" : "Active",
    type,
  };
}
