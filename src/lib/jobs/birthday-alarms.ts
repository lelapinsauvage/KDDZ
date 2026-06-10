import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const BIRTHDAY_RECEIPT_SOURCE = "custom_notifications_birthday";

export interface BirthdayGenerationSummary {
  branchesScanned: number;
  childrenMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
}

interface LegacyBirthdayRecipient {
  userId: string;
  email: string | null;
  name: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
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

function readString(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readNumber(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

function legacyBirthdayClassAllows(
  legacyClasses: string,
  classLegacyId: number | null,
) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized === String(classLegacyId);
}

function legacySourceMatches(
  recipient: LegacyBirthdayRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForBirthdayCandidate(
  recipients: LegacyBirthdayRecipient[],
  candidate: {
    sourceDatabase: string | null;
    legacyClassId: number | null;
  },
) {
  const selected = new Map<string, LegacyBirthdayRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyBirthdayClassAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

async function storeBirthdayEmailAudit(params: {
  alarmId: string;
  subject: string;
  body: string;
  recipients: LegacyBirthdayRecipient[];
  legacyNotificationId: number;
  sourceDatabase: string | null;
}) {
  const emailDelivery = await deliverEmail({
    recipients: params.recipients.map((recipient) => ({
      email: recipient.email ?? "",
      name: recipient.name,
    })),
    subject: params.subject,
    body: params.body,
    category: "BIRTHDAY",
    metadata: {
      source: "generateBirthdayAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: BIRTHDAY_RECEIPT_SOURCE,
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
        emailDelivery: emailDeliveryAuditData(emailDelivery),
      },
    },
  });
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
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: branchIds.length - enabledBranchIds.length,
    skippedLegacyNotificationGate: false,
  };

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "birthdays"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

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
      branch: { select: { id: true, name: true, sourceDatabase: true } },
      class: { select: { id: true, name: true, legacyId: true, sourceDatabase: true } },
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
    select: { id: true, referenceId: true, dueDate: true, legacyData: true },
  });
  const existingByKey = new Map<
    string,
    { id: string; referenceId: string | null; dueDate: Date | null; legacyData: unknown }
  >();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const level = legacyAlarmLevel(alarm.legacyData);
    if (level !== null) existingByKey.set(`${alarm.referenceId}:level:${level}`, alarm);
    if (alarm.dueDate) {
      existingByKey.set(`${alarm.referenceId}:date:${dateKey(alarm.dueDate)}`, alarm);
    }
  }

  const [users, template, maxReceipt] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        organizationId: params.organizationId,
        OR: [
          { branchId: { in: enabledBranchIds } },
          { branchId: null },
        ],
      },
      select: { id: true, email: true, name: true },
    }),
    db.notificationTemplate.findUnique({
      where: {
        organizationId_category: {
          organizationId: params.organizationId,
          category: "BIRTHDAY",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: BIRTHDAY_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
    }),
  ]);

  const userIds = users.map((user) => user.id);
  const usersById = new Map(users.map((user) => [user.id, user]));
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
          legacyData: true,
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyId: "asc" },
        ],
      })
    : [];

  const legacyRecipients: LegacyBirthdayRecipient[] = [];
  for (const row of legacyAuthRows) {
    if (!row.userId) continue;
    const user = usersById.get(row.userId);
    legacyRecipients.push({
      userId: row.userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      legacyRecipientId: row.legacyUserId ?? row.legacyId,
      legacySourceDatabase: row.sourceDatabase,
      legacyClasses: readString(asRecord(row.legacyData), "uclasses") ?? "0",
    });
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Happy Birthday!";
  const bodyTemplate =
    template?.body ||
    "Happy Birthday, [[child_name]]! Wishing you a wonderful day from everyone at [[branch_name]].";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), "aid") ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const { child, daysUntil, nextBirthday } = candidate;
    const dedupeByLevel = `${child.id}:level:${daysUntil}`;
    const dedupeByDate = `${child.id}:date:${dateKey(nextBirthday)}`;
    const existingAlarm =
      existingByKey.get(dedupeByLevel) ?? existingByKey.get(dedupeByDate);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), "aid")
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }

    const sourceDatabase =
      child.sourceDatabase ?? child.class?.sourceDatabase ?? child.branch.sourceDatabase;
    const legacyClassId = child.class?.legacyId ?? null;
    const legacyChildId = child.legacyId ?? null;

    let alarmId = existingAlarm?.id ?? null;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      if (
        readNumber(existingData, "aid") === null ||
        existingData.sourceDeliveryTable !== BIRTHDAY_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: BIRTHDAY_RECEIPT_SOURCE,
              legacyChildId,
              legacyClassId,
              legacyClassAccess: "login_users.uclasses_exact",
            },
          },
        });
      }
    }

    const childName = `${child.firstName} ${child.lastName}`;
    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "BIRTHDAY",
          referenceId: child.id,
          referenceType: "Child",
          message: birthdayMessage(childName, daysUntil),
          dueDate: nextBirthday,
          branchId: child.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_birthday",
            sourceDeliveryTable: BIRTHDAY_RECEIPT_SOURCE,
            modernGenerator: "generateBirthdayAlarms",
            legacyMethod: "Data::AlarmsBirthday",
            childId: child.id,
            legacyChildId,
            classId: child.classId,
            legacyClassId,
            legacyClassAccess: "login_users.uclasses_exact",
            level: daysUntil,
            status: 0,
            href: "alarmsBirthday.php",
            targetDate: dateKey(nextBirthday),
          },
        },
      });
      alarmId = alarm.id;
      existingByKey.set(dedupeByLevel, {
        id: alarm.id,
        referenceId: child.id,
        dueDate: nextBirthday,
        legacyData: alarm.legacyData,
      });
      existingByKey.set(dedupeByDate, {
        id: alarm.id,
        referenceId: child.id,
        dueDate: nextBirthday,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const recipients = recipientsForBirthdayCandidate(legacyRecipients, {
      sourceDatabase,
      legacyClassId,
    });
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: BIRTHDAY_RECEIPT_SOURCE,
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
        sourceTable: BIRTHDAY_RECEIPT_SOURCE,
        category: "birthday",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateBirthdayAlarms",
          legacyMethod: "Data::AlarmsBirthday",
          legacyClassId,
          legacyClasses: recipient.legacyClasses,
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    if (!templateEnabled || receiptResult.count === 0) continue;

    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      date: dateKey(nextBirthday),
    };

    const notificationResult = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title: renderNotificationText(subjectTemplate, variables),
        body: renderNotificationText(bodyTemplate, variables),
        type: "BIRTHDAY",
        category: "BIRTHDAY",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;

    await storeBirthdayEmailAudit({
      alarmId,
      subject: renderNotificationText(subjectTemplate, variables),
      body: renderNotificationText(bodyTemplate, variables),
      recipients: newReceiptRecipients,
      legacyNotificationId,
      sourceDatabase,
    });
  }

  return summary;
}
