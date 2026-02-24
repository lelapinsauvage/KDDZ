import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";

export default async function NewTeacherPage() {
  const [branchResult, classResult] = await Promise.all([
    getBranches(),
    getClasses(),
  ]);

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

  return <EmployeeFormClient type="teacher" branches={branches} classes={classes} />;
}
