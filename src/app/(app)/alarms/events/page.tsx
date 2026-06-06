import { getEvents } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { getAlarms } from "@/lib/actions/alarms";
import { EventAlarmsClient } from "./event-alarms-client";

export default async function EventAlarmsPage() {
  const [eventsResult, branchesResult, alarmsResult] = await Promise.all([
    getEvents({ isActive: true }),
    getBranches(),
    getAlarms({ type: "EVENT", pageSize: 500 }),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvents = (eventsResult.success ? eventsResult.data : []) as Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarmData = (alarmsResult.success ? alarmsResult.data : { alarms: [] }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawAlarmData.alarms ?? []) as Array<any>;

  const serializedAlarms = rawAlarms.map((a) => {
    const legacyData = (a.legacyData ?? {}) as Record<string, unknown>;
    return {
      id: a.id as string,
      title: ((legacyData.title as string | undefined) ?? "Holiday Reminder") as string,
      message: (a.message ?? "") as string,
      date: a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "",
      type: "Holiday Reminder",
      typeColor: "#0B9178",
      source: "Holiday Alarm" as const,
      branchId: (a.branch?.id ?? "") as string,
      branch: (a.branch?.name ?? "All Branches") as string,
    };
  });

  const serializedEvents = rawEvents.map((e) => ({
    id: e.id as string,
    title: e.title as string,
    message: (e.description ?? "") as string,
    date: e.date ? (e.date as Date).toISOString().split("T")[0] : "",
    type: (e.eventType?.name ?? "General") as string,
    typeColor: (e.eventType?.color ?? "#0B9178") as string,
    source: "Scheduled Event" as const,
    branchId: (e.branch?.id ?? "") as string,
    branch: (e.branch?.name ?? "All Branches") as string,
  }));

  return (
    <EventAlarmsClient
      events={[...serializedAlarms, ...serializedEvents]}
      branches={branches}
    />
  );
}
