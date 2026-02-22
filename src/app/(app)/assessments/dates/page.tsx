import { getAssessmentDates } from "@/lib/actions/assessments";
import { getBranches } from "@/lib/actions/branches";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import AssessmentDatesClient from "./dates-client";

export default async function AssessmentDatesPage() {
  const [{ dates }, branchesResult] = await Promise.all([
    getAssessmentDates({ pageSize: 200 }),
    getBranches(),
  ]);

  const branchesData = Array.isArray(branchesResult.data)
    ? branchesResult.data
    : [];
  const branches = branchesData.map(
    (b: { id: string; name: string }) => ({
      id: b.id,
      name: b.name,
    })
  );

  const serializedDates = dates.map((d) => ({
    id: d.id,
    assessmentType: d.assessmentType,
    assessmentTypeName:
      ASSESSMENT_TYPE_NAMES[d.assessmentType] ?? `Type ${d.assessmentType}`,
    branchId: d.branchId,
    branchName: d.branch.name,
    scheduledDate: d.scheduledDate.toISOString().split("T")[0],
  }));

  return (
    <AssessmentDatesClient dates={serializedDates} branches={branches} />
  );
}
