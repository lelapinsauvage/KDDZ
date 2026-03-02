import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { AccidentReportsClient } from "./accident-reports-client";

export default async function AccidentReportsPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "ACCIDENTS", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  const serializedForms = forms.map((form) => {
    const d = (form.data ?? {}) as Record<string, unknown>;
    return {
      id: form.id,
      childId: form.childId,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      firstName: form.child.firstName,
      lastName: form.child.lastName,
      accidentCause: (d.accidentCause as string) ?? (d.cause as string) ?? "",
      date: (d.date as string) ?? form.createdAt.toISOString().split("T")[0],
      time: (d.time as string) ?? "",
      location: (d.location as string) ?? "",
      description: (d.description as string) ?? "",
      injuryType: (d.injuryType as string) ?? "",
      severity: (d.severity as string) ?? "",
      firstAidGiven: (d.firstAidGiven as string) ?? "",
      parentNotified: (d.parentNotified as boolean) ?? false,
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "—",
      className: form.child.class?.name ?? "",
    };
  });

  return <AccidentReportsClient reports={serializedForms} total={total} branches={branches} />;
}
