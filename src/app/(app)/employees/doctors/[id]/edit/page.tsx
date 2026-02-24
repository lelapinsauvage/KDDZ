import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { getBranches } from "@/lib/actions/branches";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";
import { mapEmployeeToForm } from "@/components/employees/map-employee-to-form";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [empResult, branchResult] = await Promise.all([
    getEmployee("doctor", id),
    getBranches(),
  ]);

  if (!empResult.success || !empResult.data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branches = ((branchResult.data as any[]) ?? []).map((b: any) => ({
    id: b.id as string,
    name: b.name as string,
  }));

  return (
    <EmployeeFormClient
      type="doctor"
      branches={branches}
      employee={mapEmployeeToForm(empResult.data)}
    />
  );
}
