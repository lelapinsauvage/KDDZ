import { getEmployeePlacementOptions, getEmployees } from "@/lib/actions/employees";
import { mapEmployee } from "@/lib/map-employee";
import { EmployeeListingClient } from "@/components/employees/employee-listing-client";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";
import { getLegacyTeacherActionPermissions } from "@/lib/legacy-teacher-action-permissions";
import { requireOrg } from "@/lib/require-org";

export default async function TeachersListingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const ctx = await requireOrg();
  const [result, actionPermissions, placementOptionsResult] = await Promise.all([
    getEmployees("teacher", { pageSize: "all" }),
    getLegacyTeacherActionPermissions(ctx),
    getEmployeePlacementOptions(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result.data as any;
  const employees = (raw?.employees ?? []).map((e: unknown) =>
    mapEmployee(e, "teacher")
  );

  return (
    <EmployeeListingClient
      type="teacher"
      employees={employees}
      initialSearchQuery={normalizeLegacySearchQuery(q)}
      actionPermissions={actionPermissions}
      placementOptions={placementOptionsResult.data}
    />
  );
}
