import { getActionableAlarms } from "@/lib/actions/notification-center";
import {
  getGeneralAlarmHistory,
  getGeneralAlarmNotifications,
} from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import {
  AlarmsPageClient,
} from "./alarms-page-client";
import type {
  StaffReceiptAlarm,
  StaffReceiptAlarmHistory,
} from "./_components/staff-receipt-alarms-client";

export default async function AlarmsOverviewPage() {
  const [
    dashboardData,
    branchesResult,
    notificationResult,
    historyResult,
  ] = await Promise.all([
    getActionableAlarms(),
    getBranches(),
    getGeneralAlarmNotifications(),
    getGeneralAlarmHistory(),
  ]);

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;
  const notificationData = (
    notificationResult.success ? notificationResult.data : { alarms: [] }
  ) as { alarms?: StaffReceiptAlarm[] };
  const historyData = (
    historyResult.success ? historyResult.data : { history: [] }
  ) as { history?: StaffReceiptAlarmHistory[] };

  return (
    <AlarmsPageClient
      dashboardData={dashboardData}
      branches={branches}
      notificationAlarms={notificationData.alarms ?? []}
      notificationHistory={historyData.history ?? []}
    />
  );
}
