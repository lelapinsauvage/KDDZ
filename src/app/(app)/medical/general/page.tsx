import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { MedicalGeneralClient } from "./medical-general-client";

export default async function MedicalGeneralPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "GENERAL", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedForms = forms.map((form) => {
    const d = (form.data ?? {}) as Record<string, unknown>;
    return {
      id: form.id,
      childId: form.childId,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      date: form.createdAt.toISOString().split("T")[0],
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "",
      doctor: (d.doctor as string) ?? "",
      bloodType: (d.bloodType as string) ?? "",
      hasAllergies: !!(d.allergies as string),
    };
  });

  return <MedicalGeneralClient forms={serializedForms} total={total} branches={branches} />;
}
