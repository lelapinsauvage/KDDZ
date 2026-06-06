import {
  getContractAlarmHistory,
  getContractAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import {
  StaffReceiptAlarmsClient,
  type StaffReceiptAlarm,
  type StaffReceiptAlarmHistory,
} from "../_components/staff-receipt-alarms-client";

export default async function ContractAlarmsPage() {
  const [alarmsResult, historyResult, branchesResult] = await Promise.all([
    getContractAlarmNotifications({ pageSize: 500 }),
    getContractAlarmHistory({ pageSize: 500 }),
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
      family="contract"
      alarms={rawAlarmData.alarms ?? []}
      history={rawHistoryData.history ?? []}
      branches={branches}
    />
  );
}
