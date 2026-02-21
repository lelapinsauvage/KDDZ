import { getUpcomingAssessments } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { AssessmentsClient, assessmentTypeNames } from "./assessments-client";

export default async function AssessmentAlarmsPage() {
  const [assessmentsResult, branchesResult] = await Promise.all([
    getUpcomingAssessments(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAssessments = (assessmentsResult.success ? assessmentsResult.data : []) as Array<any>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedAssessments = rawAssessments.map((a) => {
    const scheduled = a.scheduledDate ? new Date(a.scheduledDate) : new Date();
    const diffTime = scheduled.getTime() - today.getTime();
    const daysUntil = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: a.id as string,
      assessmentType: (assessmentTypeNames[a.assessmentType as number] ?? `Type ${a.assessmentType}`) as string,
      scheduledDate: a.scheduledDate
        ? (a.scheduledDate as Date).toISOString().split("T")[0]
        : "",
      daysUntil,
      branch: (a.branch?.name ?? "—") as string,
    };
  });

  return (
    <AssessmentsClient
      assessments={serializedAssessments}
      branches={branches}
    />
  );
}
