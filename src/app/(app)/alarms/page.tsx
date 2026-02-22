import { getAlarmOverviewCounts, type AlarmCountItem } from "@/lib/actions/alarms";
import { AlarmsOverviewClient } from "./alarms-overview-client";

export default async function AlarmsOverviewPage() {
  const result = await getAlarmOverviewCounts();

  const data = result.success
    ? (result.data as { counts: AlarmCountItem[]; totalActive: number })
    : { counts: [], totalActive: 0 };

  return (
    <AlarmsOverviewClient
      counts={data.counts}
      totalActive={data.totalActive}
    />
  );
}
