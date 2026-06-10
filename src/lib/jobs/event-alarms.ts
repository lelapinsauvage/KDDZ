import { db } from "@/lib/db";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";
import {
  deliverPushNotification,
  pushDeliveryAuditData,
} from "@/lib/push-delivery";

const DEFAULT_REMINDER_DAYS = [1, 3, 7];
const DAY_MS = 86_400_000;
const EVENT_RECEIPT_SOURCE = "custom_notifications_events";
const EVENT_PARENT_RECEIPT_SOURCE = "custom_notifications_events_parents";

export interface EventGenerationSummary {
  branchesScanned: number;
  eventsScanned: number;
  eventsMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  parentRecipientsMatched: number;
  parentReceiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedMissingMessage: number;
  skippedOutsideWindow: number;
  skippedMissingBranches: number;
  skippedNoRecipients: number;
  skippedNoParentRecipients: number;
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
  legacyData: unknown;
}

interface LegacyEventRecipient {
  userId: string;
  legacyRecipientId: number;
  legacySourceDatabase: string;
}

interface LegacyEventParentRecipient {
  childId: string;
  parentUserId: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string | null;
  recipientType: "PARENT_USER" | "CHILD";
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

async function storeEventParentPushAudit(params: {
  alarmId: string;
  parentUserIds: string[];
  title: string;
  body: string;
  eventId: string;
  legacyNotificationId: number;
  sourceDatabase: string | null;
  targetBranchId: string;
  daysBefore: number;
}) {
  const pushDelivery = await deliverPushNotification({
    recipientParentUserIds: params.parentUserIds,
    title: params.title,
    body: params.body,
    category: "EVENT",
    url: "/parent",
    metadata: {
      source: "generateEventAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: EVENT_PARENT_RECEIPT_SOURCE,
      eventId: params.eventId,
      targetBranchId: params.targetBranchId,
      daysBefore: params.daysBefore,
    },
  });

  const alarm = await db.alarm.findUnique({
    where: { id: params.alarmId },
    select: { legacyData: true },
  });
  await db.alarm.update({
    where: { id: params.alarmId },
    data: {
      legacyData: {
        ...(asRecord(alarm?.legacyData) ?? {}),
        parentPushDelivery: pushDeliveryAuditData(pushDelivery),
      },
    },
  });
}

async function storeEventStaffPushAudit(params: {
  alarmId: string;
  recipientUserIds: string[];
  title: string;
  body: string;
  eventId: string;
  legacyNotificationId: number;
  sourceDatabase: string | null;
  targetBranchId: string;
  daysBefore: number;
}) {
  const pushDelivery = await deliverPushNotification({
    recipientUserIds: params.recipientUserIds,
    title: params.title,
    body: params.body,
    category: "EVENT",
    url: "/alarms/events",
    metadata: {
      source: "generateEventAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: EVENT_RECEIPT_SOURCE,
      eventId: params.eventId,
      targetBranchId: params.targetBranchId,
      daysBefore: params.daysBefore,
    },
  });

  const alarm = await db.alarm.findUnique({
    where: { id: params.alarmId },
    select: { legacyData: true },
  });
  await db.alarm.update({
    where: { id: params.alarmId },
    data: {
      legacyData: {
        ...(asRecord(alarm?.legacyData) ?? {}),
        pushDelivery: pushDeliveryAuditData(pushDelivery),
      },
    },
  });
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
    receiptsCreated: 0,
    parentRecipientsMatched: 0,
    parentReceiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
    skippedMissingMessage: 0,
    skippedOutsideWindow: 0,
    skippedMissingBranches: 0,
    skippedNoRecipients: 0,
    skippedNoParentRecipients: 0,
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

function legacySourceMatches(
  recipient: LegacyEventRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForEventCandidate(
  recipients: LegacyEventRecipient[],
  recipientIds: Set<string>,
  sourceDatabase: string | null,
) {
  const selected = new Map<string, LegacyEventRecipient>();
  for (const recipient of recipients) {
    if (!recipientIds.has(recipient.userId)) continue;
    if (!legacySourceMatches(recipient, sourceDatabase)) continue;
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

function parentRecipientsForEventCandidate(
  recipients: LegacyEventParentRecipient[],
  sourceDatabase: string | null,
) {
  const selected = new Map<number, LegacyEventParentRecipient>();
  for (const recipient of recipients) {
    if (sourceDatabase && recipient.legacySourceDatabase !== sourceDatabase) {
      continue;
    }
    if (!selected.has(recipient.legacyRecipientId)) {
      selected.set(recipient.legacyRecipientId, recipient);
    }
  }

  return Array.from(selected.values());
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

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "events"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

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
        legacyData: event.legacyData,
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
      id: true,
      referenceId: true,
      dueDate: true,
      branchId: true,
      legacyData: true,
    },
  });
  const existingByKey = new Map<string, (typeof existingAlarms)[number]>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId || !alarm.branchId) continue;
    const daysBefore = existingDaysBefore(alarm.legacyData);
    const targetDate =
      existingTargetDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (daysBefore !== null && targetDate) {
      existingByKey.set(`${alarm.referenceId}:${daysBefore}:${targetDate}:${alarm.branchId}`, alarm);
    }
  }

  const [users, maxReceipt, maxEventLegacyId] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        organizationId: params.organizationId,
        OR: [
          { branchId: { in: enabledBranchIds } },
          { branchId: null, role: "ADMIN" },
        ],
      },
      select: { id: true, branchId: true, role: true },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: EVENT_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
    }),
    db.event.aggregate({
      where: {
        legacyId: { not: null },
        OR: [
          { organizationId: params.organizationId },
          { branch: { organizationId: params.organizationId } },
          { organizationId: null, branchId: null },
        ],
      },
      _max: { legacyId: true },
    }),
  ]);

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

  const userIds = users.map((user) => user.id);
  const legacyAuthRows = userIds.length
    ? await db.legacyAuthRecord.findMany({
        where: {
          legacyTable: "login_users",
          userId: { in: userIds },
          isDisabled: { not: true },
        },
        select: {
          sourceDatabase: true,
          userId: true,
          legacyId: true,
          legacyUserId: true,
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyId: "asc" },
        ],
      })
    : [];
  const legacyRecipients: LegacyEventRecipient[] = legacyAuthRows.flatMap((row) =>
    row.userId
      ? [{
          userId: row.userId,
          legacyRecipientId: row.legacyUserId ?? row.legacyId,
          legacySourceDatabase: row.sourceDatabase,
        }]
      : [],
  );
  const candidateBranchIds = [...new Set(candidates.map((candidate) => candidate.branchId))];
  const children = await db.child.findMany({
    where: {
      branchId: { in: candidateBranchIds },
      isActive: true,
      isDraft: false,
      legacyId: { not: null },
    },
    select: {
      id: true,
      branchId: true,
      legacyId: true,
      sourceDatabase: true,
      parentUsers: {
        where: { isActive: true },
        select: { id: true, sourceDatabase: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  const parentRecipientsByBranch = new Map<string, LegacyEventParentRecipient[]>();
  for (const child of children) {
    if (child.legacyId === null) continue;
    const parentUser = child.parentUsers[0] ?? null;
    const recipients = parentRecipientsByBranch.get(child.branchId) ?? [];
    recipients.push({
      childId: child.id,
      parentUserId: parentUser?.id ?? null,
      legacyRecipientId: child.legacyId,
      legacySourceDatabase: child.sourceDatabase ?? parentUser?.sourceDatabase ?? null,
      recipientType: parentUser ? "PARENT_USER" : "CHILD",
    });
    parentRecipientsByBranch.set(child.branchId, recipients);
  }
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), ["legacyEventId", "aid"]) ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(
      maxReceipt._max.legacyNotificationId ?? 0,
      maxEventLegacyId._max.legacyId ?? 0,
      maxExistingAlarmLegacyId,
    ) + 1;
  const assignedEventLegacyIds = new Map<string, number>();

  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    const existingAlarm = existingByKey.get(key);
    const recipientIds = new Set([
      ...(userIdsByBranch.get(candidate.branchId) ?? []),
      ...adminUserIds,
    ]);
    const recipients = recipientsForEventCandidate(
      legacyRecipients,
      recipientIds,
      candidate.sourceDatabase,
    );

    const alreadyAssignedEventLegacyId = assignedEventLegacyIds.has(candidate.eventId);
    let legacyNotificationId =
      candidate.legacyId ??
      assignedEventLegacyIds.get(candidate.eventId) ??
      (existingAlarm
        ? readNumber(asRecord(existingAlarm.legacyData), ["legacyEventId", "aid"])
        : null);
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }
    if (candidate.legacyId === null && !alreadyAssignedEventLegacyId) {
      assignedEventLegacyIds.set(candidate.eventId, legacyNotificationId);
      await db.event.update({
        where: { id: candidate.eventId },
        data: {
          legacyId: legacyNotificationId,
          legacyData: {
            ...(asRecord(candidate.legacyData) ?? {}),
            generatedLegacyId: legacyNotificationId,
            sourceDeliveryTable: EVENT_RECEIPT_SOURCE,
            parentDeliveryTable: EVENT_PARENT_RECEIPT_SOURCE,
          },
        },
      });
    }

    let alarmId = existingAlarm?.id ?? null;
    let shouldAttemptStaffPushAudit = !existingAlarm;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      const needsStaffPushAudit = !asRecord(existingData.pushDelivery);
      shouldAttemptStaffPushAudit = needsStaffPushAudit;
      if (
        readNumber(existingData, ["legacyEventId", "aid"]) === null ||
        existingData.sourceDeliveryTable !== EVENT_RECEIPT_SOURCE ||
        needsStaffPushAudit
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              legacyEventId: legacyNotificationId,
              sourceDeliveryTable: EVENT_RECEIPT_SOURCE,
              parentDeliveryTable: EVENT_PARENT_RECEIPT_SOURCE,
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "EVENT",
          referenceId: candidate.eventId,
          referenceType: "Event",
          message: candidate.message,
          dueDate: candidate.targetDate,
          branchId: candidate.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_events",
            sourceDeliveryTable: EVENT_RECEIPT_SOURCE,
            parentDeliveryTable: EVENT_PARENT_RECEIPT_SOURCE,
            modernGenerator: "generateEventAlarms",
            legacyMethod: "Data::saveNewEvents",
            legacyFollowupMethod: "Data::addToEvents",
            eventId: candidate.eventId,
            legacyEventId: legacyNotificationId,
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
      alarmId = alarm.id;
      existingByKey.set(key, {
        id: alarm.id,
        referenceId: candidate.eventId,
        dueDate: candidate.targetDate,
        branchId: candidate.branchId,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    if (recipientIds.size === 0) {
      summary.skippedNoRecipients += 1;
    } else if (alarmId && recipients.length > 0) {
      const existingReceipts = await db.notificationReceipt.findMany({
        where: {
          sourceTable: EVENT_RECEIPT_SOURCE,
          legacyNotificationId,
          recipientType: "USER",
          legacyRecipientId: {
            in: recipients.map((recipient) => recipient.legacyRecipientId),
          },
        },
        select: { legacyRecipientId: true },
      });
      const existingReceiptIds = new Set(
        existingReceipts.map((receipt) => receipt.legacyRecipientId),
      );
      const newReceiptRecipients = recipients.filter(
        (recipient) => !existingReceiptIds.has(recipient.legacyRecipientId),
      );

      if (newReceiptRecipients.length === 0) {
        if (shouldAttemptStaffPushAudit) {
          await storeEventStaffPushAudit({
            alarmId,
            recipientUserIds: recipients.map((recipient) => recipient.userId),
            title: candidate.title,
            body: candidate.message,
            eventId: candidate.eventId,
            legacyNotificationId,
            sourceDatabase: candidate.sourceDatabase,
            targetBranchId: candidate.branchId,
            daysBefore: candidate.daysBefore,
          });
        }
      } else {
        const receiptResult = await db.notificationReceipt.createMany({
          data: newReceiptRecipients.map((recipient) => ({
            sourceTable: EVENT_RECEIPT_SOURCE,
            category: "events",
            legacyNotificationId,
            legacyRecipientId: recipient.legacyRecipientId,
            recipientType: "USER",
            recipientId: recipient.userId,
            alarmId,
            isRead: false,
            metadata: {
              modernGenerator: "generateEventAlarms",
              legacyMethod: "Data::saveNewEvents",
              legacyFollowupMethod: "Data::addToEvents",
              modernTargetType: "Event",
              modernTargetId: candidate.eventId,
              sourceDatabase: candidate.sourceDatabase,
              targetBranchId: candidate.branchId,
              daysBefore: candidate.daysBefore,
              submit_time: new Date().toISOString(),
              ntype: 0,
            },
          })),
          skipDuplicates: true,
        });
        summary.receiptsCreated += receiptResult.count;

        const created = await db.notification.createMany({
          data: newReceiptRecipients.map((recipient) => ({
            userId: recipient.userId,
            title: candidate.title,
            body: candidate.message,
            type: "EVENT",
            category: "EVENT",
            isRead: false,
          })),
        });
        summary.notificationsCreated += created.count;

        if (shouldAttemptStaffPushAudit) {
          await storeEventStaffPushAudit({
            alarmId,
            recipientUserIds: newReceiptRecipients.map((recipient) => recipient.userId),
            title: candidate.title,
            body: candidate.message,
            eventId: candidate.eventId,
            legacyNotificationId,
            sourceDatabase: candidate.sourceDatabase,
            targetBranchId: candidate.branchId,
            daysBefore: candidate.daysBefore,
          });
        }
      }
    }

    if (!alarmId) continue;

    const parentRecipients = parentRecipientsForEventCandidate(
      parentRecipientsByBranch.get(candidate.branchId) ?? [],
      candidate.sourceDatabase,
    );
    summary.parentRecipientsMatched += parentRecipients.length;
    if (parentRecipients.length === 0) {
      summary.skippedNoParentRecipients += 1;
      continue;
    }

    const existingParentReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: EVENT_PARENT_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: {
          in: parentRecipients.map((recipient) => recipient.legacyRecipientId),
        },
      },
      select: { legacyRecipientId: true },
    });
    const existingParentReceiptIds = new Set(
      existingParentReceipts.map((receipt) => receipt.legacyRecipientId),
    );
    const newParentReceiptRecipients = parentRecipients.filter(
      (recipient) => !existingParentReceiptIds.has(recipient.legacyRecipientId),
    );

    if (newParentReceiptRecipients.length === 0) continue;

    const parentReceiptResult = await db.notificationReceipt.createMany({
      data: newParentReceiptRecipients.map((recipient) => ({
        sourceTable: EVENT_PARENT_RECEIPT_SOURCE,
        category: "events_parents",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: recipient.recipientType,
        recipientId: recipient.parentUserId ?? recipient.childId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateEventAlarms",
          legacyMethod: "Data::saveNewEvents",
          legacyFollowupMethod: "Data::addToEvents",
          modernTargetType: "Event",
          modernTargetId: candidate.eventId,
          sourceDatabase: candidate.sourceDatabase,
          targetBranchId: candidate.branchId,
          daysBefore: candidate.daysBefore,
          eventDate: candidate.targetDateKey,
          legacyChildId: recipient.legacyRecipientId,
          parentUserId: recipient.parentUserId,
          submit_time: new Date().toISOString(),
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.parentReceiptsCreated += parentReceiptResult.count;

    const parentUserIds = newParentReceiptRecipients
      .map((recipient) => recipient.parentUserId)
      .filter((id): id is string => Boolean(id));
    if (parentReceiptResult.count > 0 && parentUserIds.length > 0) {
      await storeEventParentPushAudit({
        alarmId,
        parentUserIds,
        title: candidate.title,
        body: candidate.message,
        eventId: candidate.eventId,
        legacyNotificationId,
        sourceDatabase: candidate.sourceDatabase,
        targetBranchId: candidate.branchId,
        daysBefore: candidate.daysBefore,
      });
    }
  }

  return summary;
}
