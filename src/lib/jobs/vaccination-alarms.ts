import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const VACCINATION_RECEIPT_SOURCE = "custom_notifications_vaccinations";

export interface VaccinationDueAlarm {
  id: string;
  childId: string;
  sourceDatabase: string | null;
  legacyChildId: number | null;
  childNumber: string | null;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  legacyClassId: number | null;
  className: string | null;
  vaccineName: string;
  vaccineType: string;
  level: number;
  offsetDays: number;
  dueDate: Date;
  daysUntilDue: number;
  message: string;
}

export interface VaccinationGenerationSummary {
  branchesScanned: number;
  childrenScanned: number;
  remindersMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedMissingDob: number;
}

interface LegacyVaccinationRecipient {
  userId: string;
  email: string | null;
  name: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
}

const legacyReminderDays = [1, 3, 7];

const legacyVaccinationSchedule: Array<{
  vaccineName: string;
  doses: Array<{ level: number; offsetDays: number }>;
}> = [
  { vaccineName: "Hepatitis B", doses: [{ level: 0, offsetDays: 0 }] },
  { vaccineName: "IPV", doses: [{ level: 0, offsetDays: 61 }] },
  {
    vaccineName: "OPV",
    doses: [
      { level: 0, offsetDays: 122 },
      { level: 1, offsetDays: 183 },
      { level: 2, offsetDays: 549 },
      { level: 3, offsetDays: 1464 },
      { level: 4, offsetDays: 3660 },
    ],
  },
  {
    vaccineName: "DPT-Hib-HepB",
    doses: [
      { level: 0, offsetDays: 61 },
      { level: 1, offsetDays: 122 },
      { level: 2, offsetDays: 183 },
      { level: 3, offsetDays: 549 },
    ],
  },
  { vaccineName: "Measles", doses: [{ level: 0, offsetDays: 275 }] },
  {
    vaccineName: "MMR",
    doses: [
      { level: 0, offsetDays: 366 },
      { level: 1, offsetDays: 549 },
    ],
  },
  { vaccineName: "DPT", doses: [{ level: 0, offsetDays: 1464 }] },
  { vaccineName: "DT", doses: [{ level: 0, offsetDays: 3660 }] },
];

function startOfToday(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
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
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
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

function normalizeVaccineType(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function legacyVaccinationClassAllows(
  legacyClasses: string,
  classLegacyId: number | null,
) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized === String(classLegacyId);
}

function legacySourceMatches(
  recipient: LegacyVaccinationRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForVaccinationCandidate(
  recipients: LegacyVaccinationRecipient[],
  candidate: {
    sourceDatabase: string | null;
    legacyClassId: number | null;
  },
) {
  const selected = new Map<string, LegacyVaccinationRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyVaccinationClassAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

async function storeVaccinationEmailAudit(params: {
  alarmId: string;
  subject: string;
  body: string;
  recipients: LegacyVaccinationRecipient[];
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
    category: "VACCINATIONS",
    metadata: {
      source: "generateVaccinationAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: VACCINATION_RECEIPT_SOURCE,
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

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(3650, Math.floor(parsed)));
}

function reminderDaysForBranch(
  settingsByBranch: Map<string, Record<string, string>>,
  branchId: string,
) {
  const threshold = parsePositiveInteger(
    settingsByBranch.get(branchId)?.["alarm.vaccination.threshold"],
    7,
  );
  if (threshold <= 0) return new Set<number>();

  const days = new Set(legacyReminderDays.filter((day) => day <= threshold));
  days.add(threshold);
  return days;
}

function legacyAlarmKey(legacyData: unknown, referenceId: string | null) {
  if (!referenceId) return null;
  const data = asRecord(legacyData);
  const rawType = data?.type ?? data?.vaccineType ?? data?.vaccineName;
  const rawLevel = data?.level;
  const vaccineType =
    typeof rawType === "string" ? normalizeVaccineType(rawType) : null;
  const level =
    typeof rawLevel === "number"
      ? rawLevel
      : typeof rawLevel === "string" && rawLevel.trim() !== ""
      ? Number(rawLevel)
      : null;

  if (!vaccineType || level === null || !Number.isFinite(level)) return null;
  return `${referenceId}:${vaccineType}:${level}`;
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

function emptySummary(): VaccinationGenerationSummary {
  return {
    branchesScanned: 0,
    childrenScanned: 0,
    remindersMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
    skippedMissingDob: 0,
  };
}

async function getSettingsByBranch(branchIds: string[]) {
  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: { in: ["alarm.vaccination.enabled", "alarm.vaccination.threshold"] },
    },
  });

  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }
  return settingsByBranch;
}

export async function getVaccinationDueAlarmCandidates(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<VaccinationDueAlarm[]> {
  const today = startOfToday(params.now ?? new Date());
  const branchRows = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true },
  });
  const branchIds = branchRows.map((branch) => branch.id);
  if (branchIds.length === 0) return [];

  const settingsByBranch = await getSettingsByBranch(branchIds);
  const children = await db.child.findMany({
    where: {
      isActive: true,
      isDraft: false,
      dateOfBirth: { not: null },
      branchId: { in: branchIds },
      branch: { organizationId: params.organizationId },
    },
    select: {
      id: true,
      sourceDatabase: true,
      legacyId: true,
      childNumber: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      branchId: true,
      classId: true,
      branch: { select: { id: true, name: true, sourceDatabase: true } },
      class: { select: { id: true, name: true, legacyId: true, sourceDatabase: true } },
    },
  });

  const candidates: VaccinationDueAlarm[] = [];
  for (const child of children) {
    const reminderDays = reminderDaysForBranch(settingsByBranch, child.branchId);
    if (reminderDays.size === 0 || !child.dateOfBirth) continue;

    const childName = `${child.firstName} ${child.lastName}`;
    for (const schedule of legacyVaccinationSchedule) {
      const vaccineType = normalizeVaccineType(schedule.vaccineName);
      for (const dose of schedule.doses) {
        const dueDate = addDays(child.dateOfBirth, dose.offsetDays);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / 86_400_000,
        );
        if (!reminderDays.has(daysUntilDue)) continue;

        candidates.push({
          id: `${child.id}:${vaccineType}:${dose.level}`,
          childId: child.id,
          sourceDatabase:
            child.sourceDatabase ?? child.class?.sourceDatabase ?? child.branch.sourceDatabase,
          legacyChildId: child.legacyId ?? null,
          childNumber: child.childNumber,
          childName,
          branchId: child.branchId,
          branchName: child.branch.name,
          classId: child.classId,
          legacyClassId: child.class?.legacyId ?? null,
          className: child.class?.name ?? null,
          vaccineName: schedule.vaccineName,
          vaccineType,
          level: dose.level,
          offsetDays: dose.offsetDays,
          dueDate,
          daysUntilDue,
          message: `${childName} Needs his ${schedule.vaccineName} Vaccination In ${daysUntilDue} Day(s)`,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
    if (a.dueDate.getTime() !== b.dueDate.getTime()) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    return a.childName.localeCompare(b.childName);
  });

  return candidates;
}

export async function generateVaccinationAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
}): Promise<VaccinationGenerationSummary> {
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

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "vaccinations"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

  const settingsByBranch = await getSettingsByBranch(branchIds);
  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.vaccination.enabled"];
    return enabled === undefined || enabled === "true";
  });
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const [candidateRows, childrenWithoutDob] = await Promise.all([
    getVaccinationDueAlarmCandidates({
      organizationId: params.organizationId,
      branchId: params.branchId,
    }),
    db.child.count({
      where: {
        isActive: true,
        isDraft: false,
        dateOfBirth: null,
        branchId: { in: enabledBranchIds },
        branch: { organizationId: params.organizationId },
      },
    }),
  ]);
  summary.skippedMissingDob = childrenWithoutDob;

  const candidates = candidateRows.filter((candidate) =>
    enabledBranchIds.includes(candidate.branchId),
  );
  summary.childrenScanned = new Set(candidates.map((candidate) => candidate.childId)).size;
  summary.remindersMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "VACCINATION",
      referenceType: "Child",
      referenceId: { in: candidates.map((candidate) => candidate.childId) },
      isActive: true,
    },
    select: { id: true, referenceId: true, legacyData: true },
  });
  const existingByKey = new Map<
    string,
    { id: string; referenceId: string | null; legacyData: unknown }
  >();
  for (const alarm of existingAlarms) {
    const key = legacyAlarmKey(alarm.legacyData, alarm.referenceId);
    if (key) existingByKey.set(key, alarm);
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
          category: "VACCINATIONS",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: VACCINATION_RECEIPT_SOURCE },
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

  const legacyRecipients: LegacyVaccinationRecipient[] = [];
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
  const subjectTemplate = template?.subject || "Vaccination Due";
  const bodyTemplate =
    template?.body ||
    "Vaccination [[vaccination_name]] for [[child_name]] is due on [[date]]. Please remind [[parent_name]].";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), "aid") ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const key = `${candidate.childId}:${candidate.vaccineType}:${candidate.level}`;
    const existingAlarm = existingByKey.get(key);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), "aid")
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }

    let alarmId = existingAlarm?.id ?? null;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      if (
        readNumber(existingData, "aid") === null ||
        existingData.sourceDeliveryTable !== VACCINATION_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: VACCINATION_RECEIPT_SOURCE,
              legacyChildId: candidate.legacyChildId,
              legacyClassId: candidate.legacyClassId,
              legacyClassAccess: "login_users.uclasses_exact",
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "VACCINATION",
          referenceId: candidate.childId,
          referenceType: "Child",
          message: candidate.message,
          dueDate: candidate.dueDate,
          branchId: candidate.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_vaccinations",
            sourceDeliveryTable: VACCINATION_RECEIPT_SOURCE,
            modernGenerator: "generateVaccinationAlarms",
            legacyMethod: "Data::AlarmsVaccinations",
            childId: candidate.childId,
            legacyChildId: candidate.legacyChildId,
            classId: candidate.classId,
            legacyClassId: candidate.legacyClassId,
            legacyClassAccess: "login_users.uclasses_exact",
            vaccineName: candidate.vaccineName,
            vaccineType: candidate.vaccineType,
            type: candidate.vaccineType,
            level: candidate.level,
            offsetDays: candidate.offsetDays,
            reminderDaysBefore: candidate.daysUntilDue,
            dueDate: dateKey(candidate.dueDate),
            href: "AlarmsVaccinations.php",
          },
        },
      });
      alarmId = alarm.id;
      existingByKey.set(key, {
        id: alarm.id,
        referenceId: candidate.childId,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const recipients = recipientsForVaccinationCandidate(legacyRecipients, {
      sourceDatabase: candidate.sourceDatabase,
      legacyClassId: candidate.legacyClassId,
    });
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: VACCINATION_RECEIPT_SOURCE,
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
        sourceTable: VACCINATION_RECEIPT_SOURCE,
        category: "vaccinations",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateVaccinationAlarms",
          legacyMethod: "Data::AlarmsVaccinations",
          legacyClassId: candidate.legacyClassId,
          legacyClasses: recipient.legacyClasses,
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    if (!templateEnabled || receiptResult.count === 0) continue;

    const variables = {
      child_name: candidate.childName,
      parent_name: "Parent",
      class_name: candidate.className ?? "",
      branch_name: candidate.branchName,
      date: dateKey(candidate.dueDate),
      vaccination_name: candidate.vaccineName,
      days_until: candidate.daysUntilDue,
      x_days: candidate.daysUntilDue,
    };
    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);
    const created = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title,
        body,
        type: "VACCINATION",
        category: "VACCINATIONS",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;

    await storeVaccinationEmailAudit({
      alarmId,
      subject: title,
      body,
      recipients: newReceiptRecipients,
      legacyNotificationId,
      sourceDatabase: candidate.sourceDatabase,
    });
  }

  return summary;
}
