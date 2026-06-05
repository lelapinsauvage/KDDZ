import { db } from "@/lib/db";

export interface BirthdayGenerationSummary {
  branchesScanned: number;
  childrenMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function legacyAlarmLevel(legacyData: unknown): number | null {
  const data = asRecord(legacyData);
  const rawLevel = data?.level;
  if (typeof rawLevel === "number") return rawLevel;
  if (typeof rawLevel === "string" && rawLevel.trim() !== "") {
    const parsed = Number(rawLevel);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function birthdayMessage(childName: string, daysUntil: number) {
  if (daysUntil === 0) return `${childName} Birthday Today`;
  if (daysUntil === 1) return `${childName} Birthday Tomorrow`;
  return `${childName} Birthday in ${daysUntil} Days`;
}

function renderNotificationText(
  text: string,
  variables: Record<string, string | number | null | undefined>,
) {
  return text.replace(
    /(\[\[([a-zA-Z0-9_]+)\]\]|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g,
    (
      match,
      _token,
      squareKey: string | undefined,
      braceKey: string | undefined,
    ) => {
      const key = squareKey ?? braceKey;
      const value = key ? variables[key] : undefined;
      return value === null || typeof value === "undefined" ? match : String(value);
    },
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

export async function generateBirthdayAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
}): Promise<BirthdayGenerationSummary> {
  const branchRows = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true },
  });
  const branchIds = branchRows.map((branch) => branch.id);
  const today = startOfToday();

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: { in: ["alarm.birthday.enabled", "alarm.birthday.threshold"] },
    },
  });
  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }

  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.birthday.enabled"];
    return enabled === undefined || enabled === "true";
  });

  const summary: BirthdayGenerationSummary = {
    branchesScanned: branchIds.length,
    childrenMatched: 0,
    alarmsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: branchIds.length - enabledBranchIds.length,
  };

  if (enabledBranchIds.length === 0) return summary;

  const maxWindow = Math.max(
    0,
    ...enabledBranchIds.map((id) =>
      parsePositiveInteger(settingsByBranch.get(id)?.["alarm.birthday.threshold"], 7),
    ),
  );
  if (maxWindow === 0) return summary;

  const children = await db.child.findMany({
    where: {
      isActive: true,
      isDraft: false,
      dateOfBirth: { not: null },
      branchId: { in: enabledBranchIds },
    },
    include: {
      branch: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
  });

  const candidates = children
    .map((child) => {
      const dob = child.dateOfBirth!;
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil(
        (nextBirthday.getTime() - today.getTime()) / 86_400_000,
      );
      const threshold = parsePositiveInteger(
        settingsByBranch.get(child.branchId)?.["alarm.birthday.threshold"],
        7,
      );
      return { child, nextBirthday, daysUntil, threshold };
    })
    .filter((candidate) => candidate.daysUntil < candidate.threshold);

  summary.childrenMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const childIds = candidates.map((candidate) => candidate.child.id);
  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "BIRTHDAY",
      referenceType: "Child",
      referenceId: { in: childIds },
      isActive: true,
    },
    select: { referenceId: true, dueDate: true, legacyData: true },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const level = legacyAlarmLevel(alarm.legacyData);
    if (level !== null) existingKeys.add(`${alarm.referenceId}:${level}`);
    if (alarm.dueDate) existingKeys.add(`${alarm.referenceId}:${dateKey(alarm.dueDate)}`);
  }

  const [users, template] = await Promise.all([
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
    db.notificationTemplate.findUnique({
      where: {
        organizationId_category: {
          organizationId: params.organizationId,
          category: "BIRTHDAY",
        },
      },
    }),
  ]);

  const branchAdminIds = users
    .filter((user) => user.branchId === null && user.role === "ADMIN")
    .map((user) => user.id);
  const userIdsByBranch = new Map<string, string[]>();
  for (const user of users) {
    if (!user.branchId) continue;
    const branchUsers = userIdsByBranch.get(user.branchId) ?? [];
    branchUsers.push(user.id);
    userIdsByBranch.set(user.branchId, branchUsers);
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Happy Birthday!";
  const bodyTemplate =
    template?.body ||
    "Happy Birthday, [[child_name]]! Wishing you a wonderful day from everyone at [[branch_name]].";

  for (const candidate of candidates) {
    const { child, daysUntil, nextBirthday } = candidate;
    const dedupeByLevel = `${child.id}:${daysUntil}`;
    const dedupeByDate = `${child.id}:${dateKey(nextBirthday)}`;
    if (existingKeys.has(dedupeByLevel) || existingKeys.has(dedupeByDate)) {
      summary.skippedExisting += 1;
      continue;
    }

    const childName = `${child.firstName} ${child.lastName}`;
    await db.alarm.create({
      data: {
        type: "BIRTHDAY",
        referenceId: child.id,
        referenceType: "Child",
        message: birthdayMessage(childName, daysUntil),
        dueDate: nextBirthday,
        branchId: child.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_birthday",
          modernGenerator: "generateBirthdayAlarms",
          legacyMethod: "Data::AlarmsBirthday",
          childId: child.id,
          classId: child.classId,
          level: daysUntil,
          href: "alarmsBirthday.php",
          targetDate: dateKey(nextBirthday),
        },
      },
    });
    existingKeys.add(dedupeByLevel);
    existingKeys.add(dedupeByDate);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = Array.from(
      new Set([...(userIdsByBranch.get(child.branchId) ?? []), ...branchAdminIds]),
    );
    if (recipientIds.length === 0) continue;

    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      date: dateKey(nextBirthday),
    };

    const notificationResult = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        title: renderNotificationText(subjectTemplate, variables),
        body: renderNotificationText(bodyTemplate, variables),
        type: "BIRTHDAY",
        category: "BIRTHDAY",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;
  }

  return summary;
}
