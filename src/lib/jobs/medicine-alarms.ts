import { db } from "@/lib/db";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const MEDICINE_RECEIPT_SOURCE = "custom_notifications_medicine";

export interface MedicineGenerationSummary {
  branchesScanned: number;
  entriesMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedExpired: number;
  skippedMissingTime: number;
}

interface LegacyMedicineRecipient {
  userId: string;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
}

interface ParsedMedicineEntry {
  name: string | null;
  comment: string | null;
  date: string | null;
  time: string | null;
  case: string | null;
  remarks: string | null;
  expiry: string | null;
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

function timeKey(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
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

function legacyMedicineClassAllows(
  legacyClasses: string,
  classLegacyId: number | null,
) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized === String(classLegacyId);
}

function legacySourceMatches(
  recipient: LegacyMedicineRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForMedicineCandidate(
  recipients: LegacyMedicineRecipient[],
  candidate: {
    sourceDatabase: string | null;
    legacyClassId: number | null;
  },
) {
  const selected = new Map<string, LegacyMedicineRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyMedicineClassAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

function parseMedicineEntryValue(value: string | null): ParsedMedicineEntry {
  const parsed: ParsedMedicineEntry = {
    name: null,
    comment: null,
    date: null,
    time: null,
    case: null,
    remarks: null,
    expiry: null,
  };

  if (!value) return parsed;

  for (const part of value.split(";")) {
    const separatorIndex = part.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = part.slice(separatorIndex + 1).trim();
    const cleanValue = rawValue === "" ? null : rawValue;

    if (key === "name") parsed.name = cleanValue;
    if (key === "comment") parsed.comment = cleanValue;
    if (key === "date") parsed.date = cleanValue;
    if (key === "time") parsed.time = cleanValue;
    if (key === "case") parsed.case = cleanValue;
    if (key === "remarks") parsed.remarks = cleanValue;
    if (key === "expiry") parsed.expiry = cleanValue;
  }

  return parsed;
}

function normalizeLegacyTime(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(am|pm))?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseLegacyDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "0000-00-00") return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const legacy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (legacy) {
    const [, day, month, year] = legacy;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function legacyDataEntryId(legacyData: unknown) {
  const data = asRecord(legacyData);
  const entryId = data?.medicalFormEntryId;
  return typeof entryId === "string" && entryId.trim() !== "" ? entryId : null;
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

function emptySummary(): MedicineGenerationSummary {
  return {
    branchesScanned: 0,
    entriesMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
    skippedExpired: 0,
    skippedMissingTime: 0,
  };
}

export async function generateMedicineAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<MedicineGenerationSummary> {
  const now = params.now ?? new Date();
  const today = startOfToday(now);
  const todayKey = dateKey(today);
  const currentTime = timeKey(now);

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

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "medicine"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: "alarm.medicine.enabled",
    },
  });
  const enabledByBranch = new Map(settings.map((setting) => [setting.branchId, setting.value]));
  const enabledBranchIds = branchIds.filter((id) => enabledByBranch.get(id) !== "false");
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const entries = await db.medicalFormEntry.findMany({
    where: {
      medicalForm: {
        is: {
          formType: "GENERAL",
          status: { not: "DRAFT" },
          child: {
            isActive: true,
            isDraft: false,
            branchId: { in: enabledBranchIds },
            branch: { organizationId: params.organizationId },
          },
        },
      },
    },
    select: {
      id: true,
      field: true,
      value: true,
      medicalFormId: true,
      medicalForm: {
        select: {
          data: true,
          child: {
            select: {
              id: true,
              sourceDatabase: true,
              legacyId: true,
              firstName: true,
              lastName: true,
              branchId: true,
              classId: true,
              branch: { select: { id: true, name: true, sourceDatabase: true } },
              class: { select: { id: true, name: true, legacyId: true, sourceDatabase: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const candidates = [];
  for (const entry of entries) {
    const medicine = parseMedicineEntryValue(entry.value);
    const scheduledTime = normalizeLegacyTime(medicine.time);
    if (!scheduledTime) {
      summary.skippedMissingTime += 1;
      continue;
    }
    if (scheduledTime !== currentTime) continue;

    const expiry = parseLegacyDate(medicine.expiry);
    if (expiry && today.getTime() >= expiry.getTime()) {
      summary.skippedExpired += 1;
      continue;
    }

    candidates.push({ entry, medicine, scheduledTime });
  }

  summary.entriesMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "MEDICINE",
      isActive: true,
      dueDate: today,
      branchId: { in: enabledBranchIds },
    },
    select: { id: true, referenceId: true, message: true, legacyData: true },
  });

  const existingByEntryKey = new Map<
    string,
    { id: string; referenceId: string | null; message: string | null; legacyData: unknown }
  >();
  const existingByMessageKey = new Map<
    string,
    { id: string; referenceId: string | null; message: string | null; legacyData: unknown }
  >();
  for (const alarm of existingAlarms) {
    const entryId = legacyDataEntryId(alarm.legacyData);
    if (entryId) existingByEntryKey.set(`${entryId}:${todayKey}`, alarm);
    if (alarm.referenceId && alarm.message) {
      existingByMessageKey.set(
        `${alarm.referenceId}:${todayKey}:${normalizeText(alarm.message)}`,
        alarm,
      );
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
      select: { id: true },
    }),
    db.notificationTemplate.findUnique({
      where: {
        organizationId_category: {
          organizationId: params.organizationId,
          category: "MEDICINE",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: MEDICINE_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
    }),
  ]);

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
          legacyData: true,
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyId: "asc" },
        ],
      })
    : [];

  const legacyRecipients: LegacyMedicineRecipient[] = [];
  for (const row of legacyAuthRows) {
    if (!row.userId) continue;
    legacyRecipients.push({
      userId: row.userId,
      legacyRecipientId: row.legacyUserId ?? row.legacyId,
      legacySourceDatabase: row.sourceDatabase,
      legacyClasses: readString(asRecord(row.legacyData), "uclasses") ?? "0",
    });
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Medicine Reminder";
  const bodyTemplate =
    template?.body ||
    "Reminder: [[child_name]] needs [[med_name]] at [[med_time]].";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), "aid") ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const { entry, medicine, scheduledTime } = candidate;
    const child = entry.medicalForm.child;
    const childName = `${child.firstName} ${child.lastName}`;
    const medicineName = medicine.name || entry.field || "medicine";
    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      med_name: medicineName,
      med_time: scheduledTime,
      date: todayKey,
    };
    const message = renderNotificationText(bodyTemplate, variables);
    const entryKey = `${entry.id}:${todayKey}`;
    const messageKey = `${child.id}:${todayKey}:${normalizeText(message)}`;
    const existingAlarm =
      existingByEntryKey.get(entryKey) ?? existingByMessageKey.get(messageKey);
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
        existingData.sourceDeliveryTable !== MEDICINE_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: MEDICINE_RECEIPT_SOURCE,
              legacyChildId,
              legacyClassId,
              legacyClassAccess: "login_users.uclasses_exact",
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "MEDICINE",
          referenceId: child.id,
          referenceType: "Child",
          message,
          dueDate: today,
          branchId: child.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_medicine",
            sourceDeliveryTable: MEDICINE_RECEIPT_SOURCE,
            modernGenerator: "generateMedicineAlarms",
            legacyMethod: "Data::AlarmsMedicine",
            medicalFormEntryId: entry.id,
            medicalFormId: entry.medicalFormId,
            legacyFormData: entry.medicalForm.data,
            childId: child.id,
            legacyChildId,
            classId: child.classId,
            legacyClassId,
            legacyClassAccess: "login_users.uclasses_exact",
            currDate: todayKey,
            medType: entry.field,
            medName: medicine.name,
            medComment: medicine.comment,
            medDate: medicine.date,
            medTime: scheduledTime,
            medCase: medicine.case,
            remarks: medicine.remarks,
            expiry: medicine.expiry,
            href: "alarmsMedicine.php",
          },
        },
      });
      alarmId = alarm.id;
      existingByEntryKey.set(entryKey, {
        id: alarm.id,
        referenceId: child.id,
        message,
        legacyData: alarm.legacyData,
      });
      existingByMessageKey.set(messageKey, {
        id: alarm.id,
        referenceId: child.id,
        message,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const recipients = recipientsForMedicineCandidate(legacyRecipients, {
      sourceDatabase,
      legacyClassId,
    });
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: MEDICINE_RECEIPT_SOURCE,
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
        sourceTable: MEDICINE_RECEIPT_SOURCE,
        category: "medicine",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateMedicineAlarms",
          legacyMethod: "Data::AlarmsMedicine",
          legacyClassId,
          legacyClasses: recipient.legacyClasses,
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    if (!templateEnabled || receiptResult.count === 0) continue;

    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);
    const created = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title,
        body,
        type: "MEDICINE",
        category: "MEDICINE",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
