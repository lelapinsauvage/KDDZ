import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { MedicalConditionsClient } from "./medical-conditions-client";

export default async function MedicalConditionsPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "CONDITIONS", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedForms = forms.map((form) => {
    const d = (form.data ?? {}) as Record<string, unknown>;
    return {
      id: form.id,
      childId: form.childId,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      conditionType: (d.conditionType as string) ?? "",
      severity: (d.severity as string) ?? "",
      diagnosisDate: (d.diagnosisDate as string) ?? form.createdAt.toISOString().split("T")[0],
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "\u2014",
    };
  });

  return <MedicalConditionsClient conditions={serializedForms} total={total} branches={branches} />;
}
