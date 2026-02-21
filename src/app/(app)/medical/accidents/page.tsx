import { getMedicalForms } from "@/lib/actions/medical";
import { AccidentReportsClient } from "./accident-reports-client";

export default async function AccidentReportsPage() {
  const { forms, total } = await getMedicalForms({ formType: "ACCIDENTS" });

  const serializedForms = forms.map((form) => {
    const formData = form.data as Record<string, unknown> | null;
    return {
      id: form.id,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      date: form.createdAt.toISOString().split("T")[0],
      description: (formData?.description as string) ?? "",
      severity: (formData?.severity as string) ?? "Minor",
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchName: form.child.branch?.name ?? "—",
    };
  });

  return <AccidentReportsClient reports={serializedForms} total={total} />;
}
