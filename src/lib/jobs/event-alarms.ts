import { db } from "@/lib/db";

const DEFAULT_REMINDER_DAYS = [1, 3, 7];
const DAY_MS = 86_400_000;

export interface EventGenerationSummary {
  branchesScanned: number;
  eventsScanned: number;
  eventsMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedMissingMessage: number;
  skippedOutsideWindow: number;
  skippedMissingBranches: number;
  skippedNoRecipients: number;
}

interface EventCandidate {
  eventId: string;
  legacyId: number | null;
  legacyKey: string | null;
  title: string;
  message: string;
  targetDate: Date;
  targetDateKey: string;
  daysBefore: number;
  branchId: string;
  branchName: string;
  eventTypeName: string | null;
  eventTypeId: string | null;
  sourceDatabase: string | null;
}

function startOfToday(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((startOfToday(end).getTime() - startOfToday(start).getTime()) / DAY_MS);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function readNumber(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function jsonStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

function jsonReminderDays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 10),
    ),
  ).sort((a, b) => a - b);
}

function existingDaysBefore(legacyData: unknown) {
  const data = asRecord(legacyData);
  return readNumber(data, ["daysBefore", "level", "mid", "indays"]);
}

function existingTargetDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const raw = readString(data, ["targetDate", "eventDate", "notificationDate"]);
  return raw ? raw.slice(0, 10) : null;
}

function emptySummary(): EventGenerationSummary {
  return {
    branchesScanned: 0,
    eventsScanned: 0,
    eventsMatched: 0,
    alarmsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedMissingMessage: 0,
    skippedOutsideWindow: 0,
    skippedMissingBranches: 0,
    skippedNoRecipients: 0,
  };
}

function candidateKey(candidate: EventCandidate) {
  return [
    candidate.eventId,
    candidate.daysBefore,
    candidate.targetDateKey,
    candidate.branchId,
  ].join(":");
}

export async function generateEventAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<EventGenerationSummary> {
  const today = startOfToday(params.now ?? new Date());

  const branches = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true, name: true },
  });
  const branchIds = branches.map((branch) => branch.id);
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  const summary = emptySummary();
  summary.branchesScanned = branchIds.length;

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: "alarm.event.enabled",
    },
  });
  const enabledByBranch = new Map(settings.map((setting) => [setting.branchId, setting.value]));
  const enabledBranchIds = branchIds.filter((id) => enabledByBranch.get(id) !== "false");
  const enabledBranchSet = new Set(enabledBranchIds);
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const events = await db.event.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId: params.organizationId },
        { branch: { organizationId: params.organizationId } },
        { organizationId: null, branchId: null },
      ],
    },
    include: {
      branch: { select: { id: true, name: true, organizationId: true } },
      eventType: {
        select: {
          id: true,
          name: true,
          defaultSubject: true,
          defaultMessage: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const scopedEvents = events.filter((event) => {
    const notificationBranchIds = jsonStringArray(event.notificationBranchIds);
    if (!params.branchId) return true;
    return (
      event.branchId === params.branchId ||
      notificationBranchIds.includes(params.branchId) ||
      (!event.branchId && notificationBranchIds.length === 0)
    );
  });
  summary.eventsScanned = scopedEvents.length;

  const candidates: EventCandidate[] = [];
  for (const event of scopedEvents) {
    const title = (
      event.customSubject ||
      event.eventType?.defaultSubject ||
      event.title ||
      ""
    ).trim();
    const message = (
      event.customBody ||
      event.description ||
      event.eventType?.defaultMessage ||
      title
    ).trim();
    if (!title && !message) {
      summary.skippedMissingMessage += 1;
      continue;
    }

    const reminderDays = event.notificationDaysBefore === null
      ? DEFAULT_REMINDER_DAYS
      : jsonReminderDays(event.notificationDaysBefore);
    const targetDate = startOfToday(event.date);
    const daysUntil = daysBetween(today, targetDate);
    if (!reminderDays.includes(daysUntil)) {
      summary.skippedOutsideWindow += 1;
      continue;
    }

    const configuredBranchIds = jsonStringArray(event.notificationBranchIds);
    const fallbackBranchIds = event.branchId ? [event.branchId] : enabledBranchIds;
    const targetBranchIds = (configuredBranchIds.length ? configuredBranchIds : fallbackBranchIds)
      .filter((id) => enabledBranchSet.has(id));

    if (targetBranchIds.length === 0) {
      summary.skippedMissingBranches += 1;
      continue;
    }

    for (const targetBranchId of targetBranchIds) {
      const branch = branchById.get(targetBranchId);
      if (!branch) {
        summary.skippedMissingBranches += 1;
        continue;
      }

      candidates.push({
        eventId: event.id,
        legacyId: event.legacyId,
        legacyKey: event.legacyKey,
        title: title || event.title,
        message: message || title || event.title,
        targetDate,
        targetDateKey: dateKey(targetDate),
        daysBefore: daysUntil,
        branchId: branch.id,
        branchName: branch.name,
        eventTypeName: event.eventType?.name ?? null,
        eventTypeId: event.eventType?.id ?? null,
        sourceDatabase: event.sourceDatabase,
      });
    }
  }

  summary.eventsMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "EVENT",
      referenceType: "Event",
      referenceId: { in: candidates.map((candidate) => candidate.eventId) },
      isActive: true,
    },
    select: {
      referenceId: true,
      dueDate: true,
      branchId: true,
      legacyData: true,
    },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId || !alarm.branchId) continue;
    const daysBefore = existingDaysBefore(alarm.legacyData);
    const targetDate =
      existingTargetDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (daysBefore !== null && targetDate) {
      existingKeys.add(`${alarm.referenceId}:${daysBefore}:${targetDate}:${alarm.branchId}`);
    }
  }

  const users = await db.user.findMany({
    where: {
      isActive: true,
      organizationId: params.organizationId,
      OR: [
        { branchId: { in: enabledBranchIds } },
        { branchId: null, role: "ADMIN" },
      ],
    },
    select: { id: true, branchId: true, role: true },
  });

  const adminUserIds = users
    .filter((user) => user.branchId === null && user.role === "ADMIN")
    .map((user) => user.id);
  const userIdsByBranch = new Map<string, string[]>();
  for (const user of users) {
    if (!user.branchId) continue;
    const branchUsers = userIdsByBranch.get(user.branchId) ?? [];
    branchUsers.push(user.id);
    userIdsByBranch.set(user.branchId, branchUsers);
  }

  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    if (existingKeys.has(key)) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "EVENT",
        referenceId: candidate.eventId,
        referenceType: "Event",
        message: candidate.message,
        dueDate: candidate.targetDate,
        branchId: candidate.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_events",
          sourceDeliveryTable: "custom_notifications_events",
          parentDeliveryTable: "custom_notifications_events_parents",
          modernGenerator: "generateEventAlarms",
          legacyMethod: "Data::saveNewEvents",
          eventId: candidate.eventId,
          legacyEventId: candidate.legacyId,
          legacyKey: candidate.legacyKey,
          sourceDatabase: candidate.sourceDatabase,
          eventTypeId: candidate.eventTypeId,
          eventTypeName: candidate.eventTypeName,
          title: candidate.title,
          customSubject: candidate.title,
          customBody: candidate.message,
          daysBefore: candidate.daysBefore,
          level: candidate.daysBefore,
          targetDate: candidate.targetDateKey,
          eventDate: candidate.targetDateKey,
          branchId: candidate.branchId,
          targetBranchId: candidate.branchId,
          branchName: candidate.branchName,
          href: "alarmsEvents.php",
        },
      },
    });
    existingKeys.add(key);
    summary.alarmsCreated += 1;

    const recipientIds = new Set([
      ...(userIdsByBranch.get(candidate.branchId) ?? []),
      ...adminUserIds,
    ]);
    if (recipientIds.size === 0) {
      summary.skippedNoRecipients += 1;
      continue;
    }

    const created = await db.notification.createMany({
      data: Array.from(recipientIds).map((userId) => ({
        userId,
        title: candidate.title,
        body: candidate.message,
        type: "EVENT",
        category: "EVENT",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
