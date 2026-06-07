import { getEvents } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import {
  getAlarms,
  getEventAlarmHistory,
  getEventAlarmNotifications,
} from "@/lib/actions/alarms";
import { EventAlarmsClient } from "./event-alarms-client";

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

export default async function EventAlarmsPage() {
  const [
    eventsResult,
    branchesResult,
    alarmsResult,
    notificationResult,
    historyResult,
  ] = await Promise.all([
    getEvents({ isActive: true }),
    getBranches(),
    getAlarms({ type: "EVENT", pageSize: "all" }),
    getEventAlarmNotifications({ pageSize: "all" }),
    getEventAlarmHistory({ pageSize: "all" }),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvents = (eventsResult.success ? eventsResult.data : []) as Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarmData = (alarmsResult.success ? alarmsResult.data : { alarms: [] }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawAlarmData.alarms ?? []) as Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationData = (notificationResult.success ? notificationResult.data : {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyData = (historyResult.success ? historyResult.data : {}) as any;

  const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]));

  const serializedAlarms = rawAlarms.map((a) => {
    const legacyData = (a.legacyData ?? {}) as Record<string, unknown>;
    const isEventAlarm =
      a.referenceType === "Event" ||
      legacyData.sourceTable === "t_events" ||
      legacyData.modernGenerator === "generateEventAlarms";
    const branchId =
      ((a.branch?.id ?? legacyData.targetBranchId ?? legacyData.branchId ?? "") as string);
    return {
      id: a.id as string,
      title: ((legacyData.title as string | undefined) ??
        (isEventAlarm ? "Event Reminder" : "Holiday Reminder")) as string,
      message: (a.message ?? "") as string,
      date: a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "",
      type: isEventAlarm ? "Event Reminder" : "Holiday Reminder",
      typeColor: isEventAlarm ? "#2563EB" : "#0B9178",
      source: isEventAlarm ? ("Event Alarm" as const) : ("Holiday Alarm" as const),
      branchId,
      branchIds: branchId ? [branchId] : [],
      branch: ((a.branch?.name ?? legacyData.branchName) as string | undefined) ?? "All Branches",
    };
  });

  const serializedEvents = rawEvents.map((e) => {
    const branchIds = stringArray(e.notificationBranchIds);
    const branchNames = branchIds
      .map((id) => branchNameById.get(id))
      .filter((name): name is string => Boolean(name));
    return {
      id: e.id as string,
      title: (e.customSubject ?? e.title) as string,
      message: (e.customBody ?? e.description ?? "") as string,
      date: e.date ? (e.date as Date).toISOString().split("T")[0] : "",
      type: (e.eventType?.name ?? "General") as string,
      typeColor: (e.eventType?.color ?? "#0B9178") as string,
      source: "Scheduled Event" as const,
      branchId: (branchIds.length === 1 ? branchIds[0] : e.branch?.id ?? "") as string,
      branchIds: branchIds.length ? branchIds : e.branch?.id ? [e.branch.id as string] : [],
      branch: branchNames.length
        ? branchNames.join(" & ")
        : ((e.branch?.name ?? "All Branches") as string),
    };
  });

  return (
    <EventAlarmsClient
      events={[...serializedAlarms, ...serializedEvents]}
      branches={branches}
      notificationAlarms={notificationData.alarms ?? []}
      notificationHistory={historyData.history ?? []}
    />
  );
}
