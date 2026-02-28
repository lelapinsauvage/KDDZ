import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { SufferingListClient } from "./suffering-list-client";

const TOTAL_ASSESSMENTS = 13;

export default async function SufferingListPage() {
  const [{ forms, total }, branchesResult] = await Promise.all([
    getMedicalForms({ formType: "CONDITIONS", pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;

  // Filter to only forms with formSubType "SUFFERING"
  const sufferingForms = forms
    .filter((form) => {
      const d = (form.data ?? {}) as Record<string, unknown>;
      return d.formSubType === "SUFFERING";
    })
    .map((form) => {
      const d = (form.data ?? {}) as Record<string, unknown>;
      const assessments = (d.assessments ?? {}) as Record<
        string,
        { status: string; remarks: string }
      >;
      const filledCount = Object.values(assessments).filter(
        (a) => a.status && a.status.length > 0
      ).length;

      return {
        id: form.id,
        childId: form.childId,
        childName: `${form.child.firstName} ${form.child.lastName}`,
        conclusion: (d.conclusion as string) ?? "",
        filledCount,
        totalCount: TOTAL_ASSESSMENTS,
        status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
        createdAt: form.createdAt.toISOString(),
        branchId: form.child.branchId,
        branchName: form.child.branch?.name ?? "\u2014",
      };
    });

  return (
    <SufferingListClient
      forms={sufferingForms}
      total={total}
      branches={branches}
    />
  );
}
