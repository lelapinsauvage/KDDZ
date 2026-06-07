import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getSchoolYears } from "@/lib/actions/school-years";
import { SufferingListClient } from "./suffering-list-client";

export default async function SufferingListPage() {
  const [{ forms }, branchesResult, classesResult, yearsResult] = await Promise.all([
    getMedicalForms({ formType: "CONDITIONS", pageSize: "all" }),
    getBranches(),
    getClasses(),
    getSchoolYears(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.data ?? []) as Array<{ id: string; name: string; branchId: string }>;
  const schoolYears = (yearsResult.data ?? []) as Array<{ id: string; label: string }>;

  // Filter to only forms with formSubType "SUFFERING"
  const sufferingForms = forms
    .filter((form) => {
      const d = (form.data ?? {}) as Record<string, unknown>;
      return d.formSubType === "SUFFERING";
    })
    .map((form) => ({
      id: form.id,
      childId: form.childId,
      firstName: form.child.firstName,
      lastName: form.child.lastName,
      dateOfBirth: form.child.dateOfBirth?.toISOString().split("T")[0] ?? null,
      gender: form.child.gender as string | null,
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "",
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      schoolYearId: form.child.schoolYearId ?? null,
      yearLabel: form.child.schoolYear?.label ?? "",
      createdAt: form.createdAt.toISOString().split("T")[0],
    }));

  return (
    <SufferingListClient
      forms={sufferingForms}
      total={sufferingForms.length}
      branches={branches}
      classes={classes}
      schoolYears={schoolYears}
    />
  );
}
