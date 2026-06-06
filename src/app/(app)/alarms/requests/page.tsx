import {
  getAlarms,
  getRequestAlarmHistory,
  getRequestAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import type {
  StaffReceiptAlarm,
  StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";
import { RequestAlarmsClient } from "./request-alarms-client";

export default async function RequestAlarmsPage() {
  const [
    alarmsResult,
    branchesResult,
    notificationResult,
    historyResult,
  ] = await Promise.all([
    getAlarms({ type: "REQUEST" }),
    getBranches(),
    getRequestAlarmNotifications(),
    getRequestAlarmHistory(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);
  const notificationData = (
    notificationResult.success ? notificationResult.data : { alarms: [] }
  ) as { alarms?: StaffReceiptAlarm[] };
  const historyData = (
    historyResult.success ? historyResult.data : { history: [] }
  ) as { history?: StaffReceiptAlarmHistory[] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = (alarmsResult.success ? (alarmsResult.data as any) : { alarms: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawData.alarms ?? []) as Array<any>;

  const serializedAlarms = rawAlarms.map((a) => ({
    id: a.id as string,
    message: (a.message ?? "—") as string,
    dueDate: a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "",
    branch: (a.branch?.name ?? "—") as string,
    isActive: a.isActive as boolean,
  }));

  return (
    <RequestAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
      notificationAlarms={notificationData.alarms ?? []}
      notificationHistory={historyData.history ?? []}
    />
  );
}
