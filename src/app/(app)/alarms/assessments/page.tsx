import {
  getAssessmentDueAlarms,
  getUpcomingAssessments,
  type AssessmentDueAlarm,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import { AssessmentsClient } from "./assessments-client";

export default async function AssessmentAlarmsPage() {
  const [dueAlarmsResult, assessmentsResult, branchesResult] = await Promise.all([
    getAssessmentDueAlarms(),
    getUpcomingAssessments(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  const rawDueAlarms = (dueAlarmsResult.success
    ? dueAlarmsResult.data ?? []
    : []) as AssessmentDueAlarm[];

  const rawAssessments = (assessmentsResult.success
    ? assessmentsResult.data ?? []
    : []) as Array<{
    id: string;
    assessmentType: number;
    scheduledDate: Date;
    branch?: { id: string; name: string } | null;
  }>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueAlarms = rawDueAlarms.map((alarm) => ({
    ...alarm,
    classId: alarm.classId ?? "",
    className: alarm.className ?? "Unassigned",
    dueDate: alarm.dueDate.toISOString().split("T")[0],
  }));

  const scheduledAssessments = rawAssessments.map((a) => {
    const scheduled = a.scheduledDate ? new Date(a.scheduledDate) : new Date();
    const diffTime = scheduled.getTime() - today.getTime();
    const daysUntil = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: a.id as string,
      assessmentType: a.assessmentType as number,
      assessmentTypeName:
        ASSESSMENT_TYPE_NAMES[a.assessmentType as number] ?? `Type ${a.assessmentType}`,
      scheduledDate: a.scheduledDate
        ? (a.scheduledDate as Date).toISOString().split("T")[0]
        : "",
      daysUntil,
      branchId: (a.branch?.id ?? "") as string,
      branchName: (a.branch?.name ?? "-") as string,
    };
  });

  return (
    <AssessmentsClient
      dueAlarms={dueAlarms}
      scheduledAssessments={scheduledAssessments}
      branches={branches}
    />
  );
}
