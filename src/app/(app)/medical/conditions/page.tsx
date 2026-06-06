import { getBranches } from "@/lib/actions/branches";
import { getMedicalForms } from "@/lib/actions/medical";
import { MedicalConditionsClient, type MedicalConditionRow } from "./medical-conditions-client";

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

export default async function MedicalConditionsPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "CONDITIONS", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedForms: MedicalConditionRow[] = forms.map((form) => {
    const data = (form.data ?? {}) as Record<string, unknown>;
    const assessmentDate =
      dateString(pickString(data, "formdate", "asses_date", "assessmentDate", "diagnosisDate")) ||
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
      assessmentDate,
      generalHealth: pickString(data, "assess", "general_health", "generalHealth", "severity"),
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "-",
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      createdAt: form.createdAt.toISOString(),
    };
  });

  return <MedicalConditionsClient conditions={serializedForms} total={total} branches={branches} />;
}
