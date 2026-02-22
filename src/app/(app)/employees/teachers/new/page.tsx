import { getBranches } from "@/lib/actions/branches";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";

export default async function NewTeacherPage() {
  const branchResult = await getBranches();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branches = ((branchResult.data as any[]) ?? []).map((b: any) => ({
    id: b.id as string,
    name: b.name as string,
  }));

  return <EmployeeFormClient type="teacher" branches={branches} />;
}
