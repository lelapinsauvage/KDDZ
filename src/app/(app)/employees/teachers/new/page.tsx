import { redirect } from "next/navigation";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";
import { getLegacyTeacherActionPermissions } from "@/lib/legacy-teacher-action-permissions";
import { requireOrg } from "@/lib/require-org";

export default async function NewTeacherPage() {
  const ctx = await requireOrg();
  const permissions = await getLegacyTeacherActionPermissions(ctx);
  if (!permissions.canAddTeacher) {
    redirect("/forbidden.php");
  }

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
