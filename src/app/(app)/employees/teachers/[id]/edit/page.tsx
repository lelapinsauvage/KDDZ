import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";
import { mapEmployeeToForm } from "@/components/employees/map-employee-to-form";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [empResult, branchResult, classResult] = await Promise.all([
    getEmployee("teacher", id),
    getBranches(),
    getClasses(),
  ]);

  if (!empResult.success || !empResult.data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branches = ((branchResult.data as any[]) ?? []).map((b: any) => ({
    id: b.id as string,
    name: b.name as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes = ((classResult.data as any[]) ?? []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
  }));

  return (
    <EmployeeFormClient
      type="teacher"
      branches={branches}
      classes={classes}
      employee={mapEmployeeToForm(empResult.data)}
    />
  );
}
