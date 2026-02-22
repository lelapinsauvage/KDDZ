import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { MedicalVisitsClient } from "./medical-visits-client";

export default async function MedicalVisitsPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "VISITS", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedForms = forms.map((form) => {
    const d = (form.data ?? {}) as Record<string, unknown>;
    return {
      id: form.id,
      childId: form.childId,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      visitDate: (d.visitDate as string) ?? form.createdAt.toISOString().split("T")[0],
      doctor: (d.doctor as string) ?? "",
      reason: (d.reason as string) ?? "",
      followUpDate: (d.followUpDate as string) ?? null,
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "\u2014",
    };
  });

  return <MedicalVisitsClient visits={serializedForms} total={total} branches={branches} />;
}
