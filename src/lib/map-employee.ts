import type { Employee, EmployeeType } from "@/components/employees/employee-columns";

/**
 * Maps a raw Prisma employee record (with included `branch` relation)
 * to the flat `Employee` shape expected by the data-table columns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEmployee(raw: any, type: EmployeeType): Employee {
  return {
    id: raw.id,
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? raw.mobile ?? "",
    branch: raw.branch?.name ?? "—",
    specialization: raw.specialization ?? undefined,
    hireDate: raw.hireDate
      ? new Date(raw.hireDate).toISOString()
      : new Date().toISOString(),
    status: raw.isActive === false ? "Inactive" : "Active",
    type,
  };
}
