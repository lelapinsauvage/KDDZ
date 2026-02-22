import { getEvents, getEventTypes } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { EventsClient } from "./events-client";

export default async function EventsCalendarPage() {
  const [eventsResult, eventTypesResult, branchesResult] = await Promise.all([
    getEvents(),
    getEventTypes(),
    getBranches(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvents = (eventsResult.success ? eventsResult.data : []) as Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEventTypes = (eventTypesResult.success ? eventTypesResult.data : []) as Array<any>;
  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  const serializedEvents = rawEvents.map((ev) => ({
    id: ev.id as string,
    title: ev.title as string,
    description: (ev.description ?? "") as string,
    date: (ev.date as Date).toISOString().split("T")[0],
    endDate: ev.endDate ? (ev.endDate as Date).toISOString().split("T")[0] : null,
    eventTypeId: (ev.eventTypeId ?? null) as string | null,
    eventTypeColor: (ev.eventType?.color ?? "#1caf9a") as string,
    eventTypeName: (ev.eventType?.name ?? "—") as string,
    branchId: (ev.branchId ?? null) as string | null,
    branchName: ev.branch ? (ev.branch.name as string) : "All Branches",
    isActive: ev.isActive as boolean,
  }));

  const serializedEventTypes = rawEventTypes.map((et) => ({
    id: et.id as string,
    name: et.name as string,
    color: (et.color ?? "#1caf9a") as string,
  }));

  return (
    <EventsClient
      events={serializedEvents}
      eventTypes={serializedEventTypes}
      branches={branches}
    />
  );
}
