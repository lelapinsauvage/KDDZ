import { getMedicalForms } from "@/lib/actions/medical";
import { MedicalConditionsClient } from "./medical-conditions-client";

export default async function MedicalConditionsPage() {
  const { forms, total } = await getMedicalForms({ formType: "CONDITIONS" });

  const serializedForms = forms.map((form) => {
    const formData = form.data as Record<string, unknown> | null;
    return {
      id: form.id,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      condition: (formData?.condition as string) ?? "",
      severity: (formData?.severity as string) ?? "Mild",
      diagnosedDate: (formData?.diagnosedDate as string) ?? form.createdAt.toISOString().split("T")[0],
      currentStatus: (formData?.currentStatus as string) ?? "Active",
      branchName: form.child.branch?.name ?? "—",
    };
  });

  return <MedicalConditionsClient conditions={serializedForms} total={total} />;
}
