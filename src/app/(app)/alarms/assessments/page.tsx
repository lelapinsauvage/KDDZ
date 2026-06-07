import {
  getAssessmentAlarmHistory,
  getAssessmentAlarmNotifications,
  getAssessmentDueAlarms,
  getUpcomingAssessments,
  type AssessmentDueAlarm,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import type {
  StaffReceiptAlarm,
  StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";
import { AssessmentsClient } from "./assessments-client";

export default async function AssessmentAlarmsPage() {
  const [
    dueAlarmsResult,
    assessmentsResult,
    branchesResult,
    notificationsResult,
    historyResult,
  ] = await Promise.all([
    getAssessmentDueAlarms(),
    getUpcomingAssessments(),
    getBranches(),
    getAssessmentAlarmNotifications({ pageSize: "all" }),
    getAssessmentAlarmHistory({ pageSize: "all" }),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);
  const notificationsData = (notificationsResult.success
    ? notificationsResult.data
    : null) as { alarms?: StaffReceiptAlarm[] } | null;
  const historyData = (historyResult.success
    ? historyResult.data
    : null) as { history?: StaffReceiptAlarmHistory[] } | null;

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
      notificationAlarms={notificationsData?.alarms ?? []}
      notificationHistory={historyData?.history ?? []}
    />
  );
}
