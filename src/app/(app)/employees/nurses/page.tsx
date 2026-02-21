import { getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import { EmployeeListingClient } from "@/components/employees/employee-listing-client";

export default async function NursesListingPage() {
  const result = await getEmployees("nurse", { pageSize: 100 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result.data as any;
  const employees = (raw?.employees ?? []).map((e: unknown) =>
    mapEmployee(e, "nurse")
  );

  return <EmployeeListingClient type="nurse" employees={employees} />;
}
