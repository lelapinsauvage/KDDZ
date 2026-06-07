import { db } from "@/lib/db";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const HOLIDAY_RECEIPT_SOURCE = "custom_notifications";

export interface HolidayGenerationSummary {
  branchesScanned: number;
  holidaysScanned: number;
  holidaysMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedMissingMessage: number;
  skippedOutsideWindow: number;
}

interface HolidayCandidate {
  id: string;
  name: string;
  message: string;
  targetDate: Date;
  targetDateKey: string;
  daysBefore: number;
  branchId: string | null;
  branchLegacyId: number | null;
  branchName: string;
  sourceDatabase: string | null;
  repeated: boolean;
  type: string;
}

interface LegacyHolidayRecipient {
  userId: string;
  legacyRecipientId: number;
  legacySourceDatabase: string;
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
  return Math.round((startOfToday(end).getTime() - startOfToday(start).getTime()) / 86_400_000);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function legacyAlarmLevel(legacyData: unknown) {
  const data = asRecord(legacyData);
  const rawLevel = data?.level ?? data?.daysBefore;
  if (typeof rawLevel === "number") return rawLevel;
  if (typeof rawLevel === "string" && rawLevel.trim() !== "") {
    const parsed = Number(rawLevel);
    return Number.isFinite(parsed) ? parsed : null;
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

function legacyTargetDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const rawDate = data?.targetDate ?? data?.holidayDate ?? data?.notificationDate;
  return typeof rawDate === "string" && rawDate.trim() !== ""
    ? rawDate.trim().slice(0, 10)
    : null;
}

function jsonReminderDays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7),
    ),
  ).sort((a, b) => a - b);
}

function emptySummary(): HolidayGenerationSummary {
  return {
    branchesScanned: 0,
    holidaysScanned: 0,
    holidaysMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
    skippedMissingMessage: 0,
    skippedOutsideWindow: 0,
  };
}

function nextHolidayOccurrence(date: Date, repeated: boolean, today: Date) {
  if (!repeated) return startOfToday(date);

  const occurrence = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (occurrence < today) occurrence.setFullYear(today.getFullYear() + 1);
  occurrence.setHours(0, 0, 0, 0);
  return occurrence;
}

function candidateKey(holidayId: string, daysBefore: number, targetDate: Date) {
  return `${holidayId}:${daysBefore}:${dateKey(targetDate)}`;
}

function legacySourceMatches(
  recipient: LegacyHolidayRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForHolidayCandidate(
  recipients: LegacyHolidayRecipient[],
  recipientIds: Set<string>,
  sourceDatabase: string | null,
) {
  const selected = new Map<string, LegacyHolidayRecipient>();
  for (const recipient of recipients) {
    if (!recipientIds.has(recipient.userId)) continue;
    if (!legacySourceMatches(recipient, sourceDatabase)) continue;
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

export async function generateHolidayAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<HolidayGenerationSummary> {
  const today = startOfToday(params.now ?? new Date());

  const branchRows = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true },
  });
  const branchIds = branchRows.map((branch) => branch.id);

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
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const holidays = await db.holiday.findMany({
    where: {
      isActive: true,
      OR: [
        { branchId: { in: enabledBranchIds } },
        { branchId: null },
      ],
      ...(params.branchId ? { OR: [{ branchId: params.branchId }, { branchId: null }] } : {}),
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          organizationId: true,
          sourceDatabase: true,
          legacyId: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const scopedHolidays = holidays.filter(
    (holiday) => !holiday.branch || holiday.branch.organizationId === params.organizationId,
  );
  summary.holidaysScanned = scopedHolidays.length;

  const candidates: HolidayCandidate[] = [];
  for (const holiday of scopedHolidays) {
    const message = (holiday.notificationMessage || holiday.description || "").trim();
    if (!message) {
      summary.skippedMissingMessage += 1;
      continue;
    }

    const targetDate = nextHolidayOccurrence(holiday.date, holiday.repeated, today);
    const daysUntil = daysBetween(today, targetDate);
    const reminderDays = jsonReminderDays(holiday.notificationDaysBefore);
    const configuredDays = reminderDays.length
      ? reminderDays
      : holiday.daysBefore > 0
        ? [holiday.daysBefore]
        : [];
    if (!configuredDays.includes(daysUntil)) {
      summary.skippedOutsideWindow += 1;
      continue;
    }

    candidates.push({
      id: holiday.id,
      name: holiday.notificationTitle || holiday.name,
      message,
      targetDate,
      targetDateKey: dateKey(targetDate),
      daysBefore: daysUntil,
      branchId: holiday.branchId,
      branchLegacyId: holiday.branch?.legacyId ?? null,
      branchName: holiday.branch?.name ?? "All Branches",
      sourceDatabase: holiday.branch?.sourceDatabase ?? null,
      repeated: holiday.repeated,
      type: holiday.type,
    });
  }

  summary.holidaysMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "EVENT",
      referenceType: "Holiday",
      referenceId: { in: candidates.map((candidate) => candidate.id) },
      isActive: true,
    },
    select: { id: true, referenceId: true, dueDate: true, legacyData: true },
  });
  const existingByKey = new Map<string, (typeof existingAlarms)[number]>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const level = legacyAlarmLevel(alarm.legacyData);
    const targetDate =
      legacyTargetDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (level !== null && targetDate) {
      existingByKey.set(`${alarm.referenceId}:${level}:${targetDate}`, alarm);
    }
  }

  const [users, maxReceipt] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        organizationId: params.organizationId,
        OR: [
          { branchId: { in: enabledBranchIds } },
          { branchId: null },
        ],
      },
      select: { id: true, branchId: true, role: true },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: HOLIDAY_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
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
  const legacyRecipients: LegacyHolidayRecipient[] = legacyAuthRows.flatMap((row) =>
    row.userId
      ? [{
          userId: row.userId,
          legacyRecipientId: row.legacyUserId ?? row.legacyId,
          legacySourceDatabase: row.sourceDatabase,
        }]
      : [],
  );
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), ["aid"]) ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const key = candidateKey(candidate.id, candidate.daysBefore, candidate.targetDate);
    const existingAlarm = existingByKey.get(key);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), ["aid"])
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }

    const recipientIds = candidate.branchId
      ? new Set([...(userIdsByBranch.get(candidate.branchId) ?? []), ...adminUserIds])
      : new Set(users.map((user) => user.id));
    const recipients = recipientsForHolidayCandidate(
      legacyRecipients,
      recipientIds,
      candidate.sourceDatabase,
    );

    let alarmId = existingAlarm?.id ?? null;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      if (
        readNumber(existingData, ["aid"]) === null ||
        existingData.sourceDeliveryTable !== HOLIDAY_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: HOLIDAY_RECEIPT_SOURCE,
              sourceDatabase: candidate.sourceDatabase,
              legacyBranchId: candidate.branchLegacyId,
              recipientCount: recipientIds.size,
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "EVENT",
          referenceId: candidate.id,
          referenceType: "Holiday",
          message: candidate.message,
          dueDate: candidate.targetDate,
          branchId: candidate.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms",
            sourceHolidayTable: "t_holiday",
            sourceDeliveryTable: HOLIDAY_RECEIPT_SOURCE,
            modernGenerator: "generateHolidayAlarms",
            legacyMethod: "Data::AlarmsHoliday",
            holidayId: candidate.id,
            title: candidate.name,
            holidayType: candidate.type,
            repeated: candidate.repeated,
            level: candidate.daysBefore,
            daysBefore: candidate.daysBefore,
            targetDate: candidate.targetDateKey,
            branchName: candidate.branchName,
            sourceDatabase: candidate.sourceDatabase,
            legacyBranchId: candidate.branchLegacyId,
            recipientCount: recipientIds.size,
            href: "alarms.php",
          },
        },
      });
      alarmId = alarm.id;
      existingByKey.set(key, {
        id: alarm.id,
        referenceId: candidate.id,
        dueDate: candidate.targetDate,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: HOLIDAY_RECEIPT_SOURCE,
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
    if (newReceiptRecipients.length === 0) continue;

    const receiptResult = await db.notificationReceipt.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        sourceTable: HOLIDAY_RECEIPT_SOURCE,
        category: "general",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateHolidayAlarms",
          legacyMethod: "Data::AlarmsHoliday",
          holidayId: candidate.id,
          targetDate: candidate.targetDateKey,
          daysBefore: candidate.daysBefore,
          sourceDatabase: candidate.sourceDatabase,
          legacyBranchId: candidate.branchLegacyId,
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    const notificationResult = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title: candidate.name,
        body: candidate.message,
        type: "EVENT",
        category: "HOLIDAY",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;
  }

  return summary;
}
