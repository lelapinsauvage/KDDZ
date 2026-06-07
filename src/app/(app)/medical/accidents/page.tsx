import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { AccidentReportsClient, type AccidentReportRow } from "./accident-reports-client";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

function legacyString(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return value.toString();
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

export default async function AccidentReportsPage({ searchParams }: PageProps) {
  const [{ branch: requestedBranchId }, branchesResult] = await Promise.all([
    searchParams,
    getBranches(),
  ]);
  const branches = (branchesResult.data ?? []) as Array<{ id: string; name: string }>;
  const scopedBranch = branches.find((branch) => branch.id === requestedBranchId);
  const { forms, total } = await getMedicalForms({
    formType: "ACCIDENTS",
    pageSize: "all",
    branchId: scopedBranch?.id,
  });

  const serializedForms: AccidentReportRow[] = forms.map((form) => {
    const d = (form.data ?? {}) as Record<string, unknown>;
    return {
      id: form.id,
      legacyFormId: legacyNumber(d, "_oldId", "form_id", "id"),
      childId: form.childId,
      childNumber: form.child.childNumber ?? form.child.legacyId?.toString() ?? "—",
      photo: form.child.photo ?? null,
      childName: `${form.child.firstName} ${form.child.lastName}`,
      firstName: form.child.firstName,
      lastName: form.child.lastName,
      cause: legacyString(d, "cause", "accidentCause"),
      status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "—",
      className: form.child.class?.name ?? "",
      place: legacyString(d, "place", "location"),
      firstAid: legacyString(d, "firstaid", "firstAid", "firstAidGiven"),
      createdAt: form.createdAt.toISOString(),
    };
  });

  return (
    <AccidentReportsClient
      reports={serializedForms}
      total={total}
      branches={branches}
      initialBranchId={scopedBranch?.id}
      branchScoped={Boolean(scopedBranch)}
    />
  );
}
