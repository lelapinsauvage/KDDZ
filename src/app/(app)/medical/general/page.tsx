import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { MedicalGeneralClient } from "./medical-general-client";

export default async function MedicalGeneralPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "GENERAL" }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  const serializedForms = forms.map((form) => ({
    id: form.id,
    childName: `${form.child.firstName} ${form.child.lastName}`,
    date: form.createdAt.toISOString().split("T")[0],
    status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
    branchId: form.child.branchId,
    branchName: form.child.branch?.name ?? "—",
    data: form.data as Record<string, unknown> | null,
  }));

  return (
    <MedicalGeneralClient
      forms={serializedForms}
      total={total}
      branches={branches}
    />
  );
}
