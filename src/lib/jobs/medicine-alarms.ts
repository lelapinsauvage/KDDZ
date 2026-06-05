import { db } from "@/lib/db";

export interface MedicineGenerationSummary {
  branchesScanned: number;
  entriesMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedExpired: number;
  skippedMissingTime: number;
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
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
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
              firstName: true,
              lastName: true,
              branchId: true,
              classId: true,
              branch: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
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
    select: { referenceId: true, message: true, legacyData: true },
  });

  const existingEntryKeys = new Set<string>();
  const existingMessageKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    const entryId = legacyDataEntryId(alarm.legacyData);
    if (entryId) existingEntryKeys.add(`${entryId}:${todayKey}`);
    if (alarm.referenceId && alarm.message) {
      existingMessageKeys.add(
        `${alarm.referenceId}:${todayKey}:${normalizeText(alarm.message)}`,
      );
    }
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
          category: "MEDICINE",
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
  const subjectTemplate = template?.subject || "Medicine Reminder";
  const bodyTemplate =
    template?.body ||
    "Reminder: [[child_name]] needs [[med_name]] at [[med_time]].";

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

    if (existingEntryKeys.has(entryKey) || existingMessageKeys.has(messageKey)) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "MEDICINE",
        referenceId: child.id,
        referenceType: "Child",
        message,
        dueDate: today,
        branchId: child.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_medicine",
          modernGenerator: "generateMedicineAlarms",
          legacyMethod: "Data::AlarmsMedicine",
          medicalFormEntryId: entry.id,
          medicalFormId: entry.medicalFormId,
          legacyFormData: entry.medicalForm.data,
          childId: child.id,
          classId: child.classId,
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
    existingEntryKeys.add(entryKey);
    existingMessageKeys.add(messageKey);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = Array.from(
      new Set([...(userIdsByBranch.get(child.branchId) ?? []), ...branchAdminIds]),
    );
    if (recipientIds.length === 0) continue;

    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);
    const created = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
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
