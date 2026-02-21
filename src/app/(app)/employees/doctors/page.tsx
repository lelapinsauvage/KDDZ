import { getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import { EmployeeListingClient } from "@/components/employees/employee-listing-client";

export default async function DoctorsListingPage() {
  const result = await getEmployees("doctor", { pageSize: 100 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result.data as any;
  const employees = (raw?.employees ?? []).map((e: unknown) =>
    mapEmployee(e, "doctor")
  );

  return <EmployeeListingClient type="doctor" employees={employees} />;
}
