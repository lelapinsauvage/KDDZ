import { getEvents, getEventTypes } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { EventsClient } from "./events-client";

interface RawEvent {
  id: string;
  title: string;
  description: string | null;
  customSubject: string | null;
  customBody: string | null;
  date: Date;
  endDate: Date | null;
  eventTypeId: string | null;
  eventType: { color: string | null; name: string | null } | null;
  branchId: string | null;
  branch: { name: string } | null;
  notificationBranchIds: unknown;
  notificationDaysBefore: unknown;
  isActive: boolean;
}

interface RawEventType {
  id: string;
  name: string;
  color: string | null;
  defaultSubject: string | null;
  defaultMessage: string | null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item))
    : [];
}

export default async function EventsCalendarPage() {
  const [eventsResult, eventTypesResult, branchesResult] = await Promise.all([
    getEvents(),
    getEventTypes(),
    getBranches(),
  ]);

  const rawEvents = (eventsResult.success ? eventsResult.data : []) as RawEvent[];
  const rawEventTypes = (eventTypesResult.success ? eventTypesResult.data : []) as RawEventType[];
  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  const serializedEvents = rawEvents.map((ev) => ({
    ...(() => {
      const notificationBranchIds = stringArray(ev.notificationBranchIds);
      const notificationDaysBefore = numberArray(ev.notificationDaysBefore);
      const selectedBranchNames = branches
        .filter((branch) => notificationBranchIds.includes(branch.id))
        .map((branch) => branch.name);
      return {
        notificationBranchIds,
        notificationDaysBefore,
        branchName:
          selectedBranchNames.length > 0
            ? selectedBranchNames.join(" & ")
            : ev.branch
              ? (ev.branch.name as string)
              : "All Branches",
      };
    })(),
    id: ev.id as string,
    title: ev.title as string,
    description: (ev.description ?? "") as string,
    customSubject: ((ev.customSubject ?? ev.title) as string),
    customBody: ((ev.customBody ?? ev.description ?? "") as string),
    date: (ev.date as Date).toISOString().split("T")[0],
    endDate: ev.endDate ? (ev.endDate as Date).toISOString().split("T")[0] : null,
    eventTypeId: (ev.eventTypeId ?? null) as string | null,
    eventTypeColor: (ev.eventType?.color ?? "#0B9178") as string,
    eventTypeName: (ev.eventType?.name ?? "No Type") as string,
    branchId: (ev.branchId ?? null) as string | null,
    isActive: ev.isActive as boolean,
  }));

  const serializedEventTypes = rawEventTypes.map((et) => ({
    id: et.id as string,
    name: et.name as string,
    color: (et.color ?? "#0B9178") as string,
    defaultSubject: (et.defaultSubject ?? "") as string,
    defaultMessage: (et.defaultMessage ?? "") as string,
  }));

  return (
    <EventsClient
      events={serializedEvents}
      eventTypes={serializedEventTypes}
      branches={branches}
    />
  );
}
