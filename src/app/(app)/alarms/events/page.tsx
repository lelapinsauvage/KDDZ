import { getEvents } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { EventAlarmsClient } from "./event-alarms-client";

export default async function EventAlarmsPage() {
  const [eventsResult, branchesResult] = await Promise.all([
    getEvents({ isActive: true }),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvents = (eventsResult.success ? eventsResult.data : []) as Array<any>;

  const serializedEvents = rawEvents.map((e) => ({
    id: e.id as string,
    title: e.title as string,
    date: e.date ? (e.date as Date).toISOString().split("T")[0] : "",
    type: (e.eventType?.name ?? "General") as string,
    typeColor: (e.eventType?.color ?? "#0B9178") as string,
    branch: (e.branch?.name ?? "All Branches") as string,
  }));

  return (
    <EventAlarmsClient
      events={serializedEvents}
      branches={branches}
    />
  );
}
