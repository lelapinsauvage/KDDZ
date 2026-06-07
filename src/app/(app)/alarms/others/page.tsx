import {
  getAlarms,
  getOtherAlarmHistory,
  getOtherAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import type {
  StaffReceiptAlarm,
  StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";
import { OtherAlarmsClient } from "./other-alarms-client";

export default async function OtherAlarmsPage() {
  const [
    alarmsResult,
    branchesResult,
    notificationResult,
    historyResult,
  ] = await Promise.all([
    getAlarms({ type: "OTHER", pageSize: "all" }),
    getBranches(),
    getOtherAlarmNotifications({ pageSize: "all" }),
    getOtherAlarmHistory({ pageSize: "all" }),
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
    isActive: a.isActive as boolean,
    branch: (a.branch?.name ?? "—") as string,
  }));

  return (
    <OtherAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
      notificationAlarms={notificationData.alarms ?? []}
      notificationHistory={historyData.history ?? []}
    />
  );
}
