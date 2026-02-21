import { getMedicalForms } from "@/lib/actions/medical";
import { MedicalVisitsClient } from "./medical-visits-client";

export default async function MedicalVisitsPage() {
  const { forms, total } = await getMedicalForms({ formType: "VISITS" });

  const serializedForms = forms.map((form) => {
    const formData = form.data as Record<string, unknown> | null;
    return {
      id: form.id,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      visitDate: (formData?.visitDate as string) ?? form.createdAt.toISOString().split("T")[0],
      doctor: (formData?.doctor as string) ?? "",
      reason: (formData?.reason as string) ?? "",
      followUpDate: (formData?.followUpDate as string) ?? null,
      branchName: form.child.branch?.name ?? "—",
    };
  });

  return <MedicalVisitsClient visits={serializedForms} total={total} />;
}
