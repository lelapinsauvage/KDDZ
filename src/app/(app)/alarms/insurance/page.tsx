import {
  getInsuranceAlarmHistory,
  getInsuranceAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import {
  StaffReceiptAlarmsClient,
  type StaffReceiptAlarm,
  type StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";

export default async function InsuranceAlarmsPage() {
  const [alarmsResult, historyResult, branchesResult] = await Promise.all([
    getInsuranceAlarmNotifications({ pageSize: "all" }),
    getInsuranceAlarmHistory({ pageSize: "all" }),
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
      family="insurance"
      alarms={rawAlarmData.alarms ?? []}
      history={rawHistoryData.history ?? []}
      branches={branches}
    />
  );
}
