import { db } from "@/lib/db";

export interface HolidayGenerationSummary {
  branchesScanned: number;
  holidaysScanned: number;
  holidaysMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
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
  branchName: string;
  repeated: boolean;
  type: string;
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

function legacyTargetDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const rawDate = data?.targetDate ?? data?.holidayDate ?? data?.notificationDate;
  return typeof rawDate === "string" && rawDate.trim() !== ""
    ? rawDate.trim().slice(0, 10)
    : null;
}

function emptySummary(): HolidayGenerationSummary {
  return {
    branchesScanned: 0,
    holidaysScanned: 0,
    holidaysMatched: 0,
    alarmsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
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
      branch: { select: { id: true, name: true, organizationId: true } },
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
    if (daysUntil !== holiday.daysBefore) {
      summary.skippedOutsideWindow += 1;
      continue;
    }

    candidates.push({
      id: holiday.id,
      name: holiday.notificationTitle || holiday.name,
      message,
      targetDate,
      targetDateKey: dateKey(targetDate),
      daysBefore: holiday.daysBefore,
      branchId: holiday.branchId,
      branchName: holiday.branch?.name ?? "All Branches",
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
    select: { referenceId: true, dueDate: true, legacyData: true },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const level = legacyAlarmLevel(alarm.legacyData);
    const targetDate =
      legacyTargetDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (level !== null && targetDate) {
      existingKeys.add(`${alarm.referenceId}:${level}:${targetDate}`);
    }
  }

  const users = await db.user.findMany({
    where: {
      isActive: true,
      organizationId: params.organizationId,
      OR: [
        { branchId: { in: enabledBranchIds } },
        { branchId: null },
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
    const key = candidateKey(candidate.id, candidate.daysBefore, candidate.targetDate);
    if (existingKeys.has(key)) {
      summary.skippedExisting += 1;
      continue;
    }

    const recipientIds = candidate.branchId
      ? Array.from(new Set([...(userIdsByBranch.get(candidate.branchId) ?? []), ...adminUserIds]))
      : users.map((user) => user.id);

    await db.alarm.create({
      data: {
        type: "EVENT",
        referenceId: candidate.id,
        referenceType: "Holiday",
        message: candidate.message,
        dueDate: candidate.targetDate,
        branchId: candidate.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms",
          sourceHolidayTable: "t_holiday",
          sourceDeliveryTable: "custom_notifications",
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
          recipientCount: recipientIds.length,
          href: "alarms.php",
        },
      },
    });
    existingKeys.add(key);
    summary.alarmsCreated += 1;

    if (recipientIds.length === 0) continue;

    const notificationResult = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
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
