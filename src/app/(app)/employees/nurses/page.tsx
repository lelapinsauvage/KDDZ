import { getEmployeePlacementOptions, getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import { EmployeeListingClient } from "@/components/employees/employee-listing-client";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

export default async function NursesListingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const [result, placementOptionsResult] = await Promise.all([
    getEmployees("nurse", { pageSize: "all" }),
    getEmployeePlacementOptions(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result.data as any;
  const employees = (raw?.employees ?? []).map((e: unknown) =>
    mapEmployee(e, "nurse")
  );

  return (
    <EmployeeListingClient
      type="nurse"
      employees={employees}
      initialSearchQuery={normalizeLegacySearchQuery(q)}
      placementOptions={placementOptionsResult.data}
    />
  );
}
