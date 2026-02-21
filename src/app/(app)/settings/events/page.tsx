import { getEventTypes } from "@/lib/actions/settings";
import { EventsClient } from "./events-client";

export default async function EventTypesPage() {
  const result = await getEventTypes();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEventTypes = (result.success ? result.data : []) as Array<any>;

  const serializedEventTypes = rawEventTypes.map((et) => ({
    id: et.id as string,
    name: et.name as string,
    color: (et.color ?? "#1caf9a") as string,
    eventCount: (et._count?.events ?? 0) as number,
  }));

  return <EventsClient eventTypes={serializedEventTypes} />;
}
