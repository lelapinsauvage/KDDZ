import {
  getMedicalAlarmHistory,
  getMedicalAlarmNotifications,
} from "@/lib/actions/alarms";
import { MedicalAlarmsClient } from "./medical-alarms-client";

type MedicalAlarmRow = {
  id: string;
  receiptId: string;
  legacyId: number;
  details: string;
  datetime: string;
  dueDate: string | null;
  branchId: string | null;
  branch: string;
  status: "Viewed" | "New";
  isRead: boolean;
  legacyType: string | null;
  legacyStatus: string;
  legacyHref: string | null;
  actionHref: string;
  searchText: string;
};

type MedicalHistoryRow = {
  id: string;
  legacyId: number;
  type: string;
  content: string;
  time: string;
  to: string;
  seen: "Yes" | "No";
  branch: string;
  legacyStatus: string;
  searchText: string;
};

export default async function MedicalAlarmsPage() {
  const [alarmsResult, historyResult] = await Promise.all([
    getMedicalAlarmNotifications({ pageSize: "all" }),
    getMedicalAlarmHistory({ pageSize: "all" }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarmData = (alarmsResult.success ? (alarmsResult.data as any) : { alarms: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHistoryData = (historyResult.success ? (historyResult.data as any) : { history: [] });

  const alarms = (rawAlarmData.alarms ?? []) as MedicalAlarmRow[];

  const history = (rawHistoryData.history ?? []) as MedicalHistoryRow[];

  return (
    <MedicalAlarmsClient
      alarms={alarms}
      history={history}
    />
  );
}
