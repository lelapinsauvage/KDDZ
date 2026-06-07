import { getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import { EmployeeListingClient } from "@/components/employees/employee-listing-client";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

export default async function DoctorsListingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const result = await getEmployees("doctor", { pageSize: "all" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result.data as any;
  const employees = (raw?.employees ?? []).map((e: unknown) =>
    mapEmployee(e, "doctor")
  );

  return (
    <EmployeeListingClient
      type="doctor"
      employees={employees}
      initialSearchQuery={normalizeLegacySearchQuery(q)}
    />
  );
}
