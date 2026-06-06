import {
  getBirthdayAlarmHistory,
  getBirthdayAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import {
  StaffReceiptAlarmsClient,
  type StaffReceiptAlarm,
  type StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";

export default async function BirthdayAlarmsPage() {
  const [alarmsResult, historyResult, branchesResult] = await Promise.all([
    getBirthdayAlarmNotifications({ pageSize: 500 }),
    getBirthdayAlarmHistory({ pageSize: 500 }),
    getBranches(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;
  const rawAlarmData = alarmsResult.success
    ? (alarmsResult.data as { alarms?: StaffReceiptAlarm[] })
    : { alarms: [] };
  const rawHistoryData = historyResult.success
    ? (historyResult.data as { history?: StaffReceiptAlarmHistory[] })
    : { history: [] };

  return (
    <StaffReceiptAlarmsClient
      family="birthday"
      alarms={rawAlarmData.alarms ?? []}
      history={rawHistoryData.history ?? []}
      branches={branches}
    />
  );
}
