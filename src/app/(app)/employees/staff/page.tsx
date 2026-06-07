import { getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import type { EmployeeType } from "@/components/employees/employee-columns";
import { StaffPageClient } from "./staff-page-client";

const EMPLOYEE_TYPES: EmployeeType[] = ["teacher", "nurse", "doctor", "manager"];

export default async function StaffPage() {
  const results = await Promise.all(
    EMPLOYEE_TYPES.map((type) => getEmployees(type, { pageSize: "all" }))
  );

  const allEmployees = EMPLOYEE_TYPES.flatMap((type, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = results[i].data as any;
    return (raw?.employees ?? []).map((e: unknown) => mapEmployee(e, type));
  });

  return <StaffPageClient employees={allEmployees} />;
}
