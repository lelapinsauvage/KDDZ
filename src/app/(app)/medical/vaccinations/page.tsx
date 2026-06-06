import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getMedicalForms } from "@/lib/actions/medical";
import { VaccinationsPageClient, type VaccinationFormRow } from "./vaccinations-page-client";

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function pickString(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = stringValue(data[key]);
    if (value) return value;
  }
  return "";
}

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

function dateString(value: string) {
  if (!value) return "";
  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return value;
}

export default async function VaccinationsPage() {
  const [{ forms, total }, branchesResult, classesResult] = await Promise.all([
    getMedicalForms({ formType: "VACCINATIONS", pageSize: 500 }),
    getBranches(),
    getClasses(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.data ?? []) as Array<{ id: string; name: string; branchId: string }>;

  const serializedForms: VaccinationFormRow[] = forms.map((form) => {
    const data = (form.data ?? {}) as Record<string, unknown>;
    const formDate =
      dateString(pickString(data, "datetime", "created_at", "date")) ||
      form.createdAt.toISOString().split("T")[0];

    return {
      id: form.id,
      legacyFormId: legacyNumber(data, "_oldId", "form_id", "id"),
      childId: form.childId,
      childNumber: form.child.childNumber ?? form.child.legacyId?.toString() ?? "-",
      photo: form.child.photo ?? null,
      firstName: form.child.firstName,
      lastName: form.child.lastName,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      dateOfBirth: form.child.dateOfBirth?.toISOString().split("T")[0] ?? null,
      nationality: form.child.nationality ?? "",
      gender: form.child.gender as string | null,
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "-",
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      formDate,
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      createdAt: form.createdAt.toISOString(),
    };
  });

  return (
    <VaccinationsPageClient
      forms={serializedForms}
      total={total}
      branches={branches}
      classes={classes}
    />
  );
}
