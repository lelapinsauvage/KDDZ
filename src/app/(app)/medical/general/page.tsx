import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getSchoolYears } from "@/lib/actions/school-years";
import { MedicalGeneralClient } from "./medical-general-client";

export default async function MedicalGeneralPage() {
  const [{ forms, total }, branchesResult, classesResult, yearsResult] = await Promise.all([
    getMedicalForms({ formType: "GENERAL", pageSize: 500 }),
    getBranches(),
    getClasses(),
    getSchoolYears(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.data ?? []) as Array<{ id: string; name: string; branchId: string }>;
  const schoolYears = (yearsResult.data ?? []) as Array<{ id: string; label: string }>;

  const serializedForms = forms.map((form) => ({
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
    <MedicalGeneralClient
      forms={serializedForms}
      total={total}
      branches={branches}
      classes={classes}
      schoolYears={schoolYears}
    />
  );
}
