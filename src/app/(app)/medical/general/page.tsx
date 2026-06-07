import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getSchoolYears } from "@/lib/actions/school-years";
import { MedicalGeneralClient, type GeneralMedicalFormRow } from "./medical-general-client";

function legacyNumber(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export default async function MedicalGeneralPage() {
  const [{ forms, total }, branchesResult, classesResult, yearsResult] = await Promise.all([
    getMedicalForms({ formType: "GENERAL", pageSize: "all" }),
    getBranches(),
    getClasses(),
    getSchoolYears(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.data ?? []) as Array<{ id: string; name: string; branchId: string }>;
  const schoolYears = (yearsResult.data ?? []) as Array<{
    id: string;
    label: string;
    legacyId: number | null;
    legacySid: number | null;
  }>;
  const schoolYearByLegacyId = new Map<number, string>();
  schoolYears.forEach((year) => {
    if (year.legacyId !== null) schoolYearByLegacyId.set(year.legacyId, year.label);
    if (year.legacySid !== null) schoolYearByLegacyId.set(year.legacySid, year.label);
  });

  const serializedForms: GeneralMedicalFormRow[] = forms.map((form) => {
    const data = (form.data ?? {}) as Record<string, unknown>;
    const legacySchoolYearId = legacyNumber(data, "db_id");
    return {
      id: form.id,
      legacyFormId: legacyNumber(data, "_oldId", "form_id", "id"),
      childId: form.childId,
      childNumber: form.child.childNumber ?? form.child.legacyId?.toString() ?? "—",
      photo: form.child.photo ?? null,
      firstName: form.child.firstName,
      lastName: form.child.lastName,
      dateOfBirth: form.child.dateOfBirth?.toISOString().split("T")[0] ?? null,
      gender: form.child.gender as string | null,
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "",
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      schoolYearId: form.child.schoolYearId ?? null,
      yearLabel: legacySchoolYearId !== null
        ? schoolYearByLegacyId.get(legacySchoolYearId) ?? form.child.schoolYear?.label ?? ""
        : form.child.schoolYear?.label ?? "",
      createdAt: form.createdAt.toISOString(),
    };
  });

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
