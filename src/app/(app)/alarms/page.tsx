import { getActionableAlarms } from "@/lib/actions/notification-center";
import { NotificationCenter } from "@/components/alarms/notification-center";

export default async function AlarmsOverviewPage() {
  const data = await getActionableAlarms();

  return <NotificationCenter data={data} />;
}
