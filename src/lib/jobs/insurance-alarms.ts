import { db } from "@/lib/db";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const INSURANCE_RECEIPT_SOURCE = "custom_notifications_insurance";

export interface InsuranceGenerationSummary {
  branchesScanned: number;
  formsScanned: number;
  formsMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedNoInsurance: number;
  skippedInvalidExpiry: number;
  skippedOutsideWindow: number;
}

interface LegacyInsuranceRecipient {
  userId: string;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
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

function readBoolean(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["yes", "true", "1", "y"].includes(normalized)) return true;
      if (["no", "false", "0", "n"].includes(normalized)) return false;
    }
  }
  return false;
}

function legacyInsuranceClassAllows(
  legacyClasses: string,
  classLegacyId: number | null,
) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized === String(classLegacyId);
}

function legacySourceMatches(
  recipient: LegacyInsuranceRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForInsuranceCandidate(
  recipients: LegacyInsuranceRecipient[],
  candidate: {
    sourceDatabase: string | null;
    legacyClassId: number | null;
  },
) {
  const selected = new Map<string, LegacyInsuranceRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyInsuranceClassAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
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

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

function legacyDataExpiryDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const direct = data?.insuranceExpiryDate ?? data?.expiryDate ?? data?.ins_expdate;
  if (typeof direct === "string" && direct.trim() !== "") {
    const parsed = parseLegacyDate(direct);
    return parsed ? dateKey(parsed) : direct.trim();
  }
  return null;
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

function emptySummary(): InsuranceGenerationSummary {
  return {
    branchesScanned: 0,
    formsScanned: 0,
    formsMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
    skippedNoInsurance: 0,
    skippedInvalidExpiry: 0,
    skippedOutsideWindow: 0,
  };
}

export async function generateInsuranceAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<InsuranceGenerationSummary> {
  const now = params.now ?? new Date();
  const today = startOfToday(now);

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

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "insurance"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: { in: ["alarm.insurance.enabled", "alarm.insurance.threshold"] },
    },
  });
  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }

  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.insurance.enabled"];
    return enabled === undefined || enabled === "true";
  });
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const maxWindow = Math.max(
    0,
    ...enabledBranchIds.map((id) =>
      parsePositiveInteger(settingsByBranch.get(id)?.["alarm.insurance.threshold"], 7),
    ),
  );
  if (maxWindow === 0) return summary;

  const forms = await db.medicalForm.findMany({
    where: {
      formType: "GENERAL",
      status: { not: "DRAFT" },
      child: {
        isActive: true,
        isDraft: false,
        branchId: { in: enabledBranchIds },
        branch: { organizationId: params.organizationId },
      },
    },
    select: {
      id: true,
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
    orderBy: { updatedAt: "desc" },
  });
  summary.formsScanned = forms.length;

  const candidates = [];
  for (const form of forms) {
    const data = asRecord(form.data);
    const hasInsurance = readBoolean(data, ["hasInsurance", "has_insurance"]);
    if (!hasInsurance) {
      summary.skippedNoInsurance += 1;
      continue;
    }

    const expiryRaw = readString(data, ["insuranceExpiry", "ins_expdate"]);
    const expiryDate = parseLegacyDate(expiryRaw);
    if (!expiryDate) {
      summary.skippedInvalidExpiry += 1;
      continue;
    }

    const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000);
    const threshold = parsePositiveInteger(
      settingsByBranch.get(form.child.branchId)?.["alarm.insurance.threshold"],
      7,
    );
    if (daysUntil < 0 || daysUntil > threshold) {
      summary.skippedOutsideWindow += 1;
      continue;
    }

    const insuranceType = readString(data, ["insuranceType", "insurance"]);
    candidates.push({
      form,
      expiryDate,
      expiryRaw,
      expiryKey: dateKey(expiryDate),
      daysUntil,
      insuranceType,
    });
  }

  summary.formsMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const childIds = candidates.map((candidate) => candidate.form.child.id);
  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "INSURANCE",
      referenceType: "Child",
      referenceId: { in: childIds },
      isActive: true,
    },
    select: { id: true, referenceId: true, dueDate: true, message: true, legacyData: true },
  });

  const existingByExpiryKey = new Map<
    string,
    { id: string; referenceId: string | null; message: string | null; legacyData: unknown }
  >();
  const existingByMessageKey = new Map<
    string,
    { id: string; referenceId: string | null; message: string | null; legacyData: unknown }
  >();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const expiryFromLegacy = legacyDataExpiryDate(alarm.legacyData);
    if (expiryFromLegacy) {
      existingByExpiryKey.set(`${alarm.referenceId}:${expiryFromLegacy}`, alarm);
    }
    if (alarm.dueDate) {
      existingByExpiryKey.set(`${alarm.referenceId}:${dateKey(alarm.dueDate)}`, alarm);
    }
    if (alarm.message) {
      existingByMessageKey.set(
        `${alarm.referenceId}:${normalizeText(alarm.message)}`,
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
          category: "INSURANCE",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: INSURANCE_RECEIPT_SOURCE },
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

  const legacyRecipients: LegacyInsuranceRecipient[] = [];
  for (const row of legacyAuthRows) {
    if (!row.userId) continue;
    legacyRecipients.push({
      userId: row.userId,
      legacyRecipientId: row.legacyUserId ?? row.legacyId,
      legacySourceDatabase: row.sourceDatabase,
      legacyClasses: readString(asRecord(row.legacyData), ["uclasses"]) ?? "0",
    });
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Insurance Expiring";
  const bodyTemplate =
    template?.body ||
    "Insurance for [[child_name]] expires on [[date]]. Please notify [[parent_name]] to renew.";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), ["aid"]) ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const { form, expiryDate, expiryRaw, expiryKey, daysUntil, insuranceType } = candidate;
    const child = form.child;
    const childName = `${child.firstName} ${child.lastName}`;
    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      date: expiryKey,
      expiry_date: expiryKey,
      days_until: daysUntil,
      insurance_type: insuranceType ?? "",
    };
    const message = renderNotificationText(bodyTemplate, variables);
    const expiryDedupeKey = `${child.id}:${expiryKey}`;
    const messageDedupeKey = `${child.id}:${normalizeText(message)}`;
    const existingAlarm =
      existingByExpiryKey.get(expiryDedupeKey) ??
      existingByMessageKey.get(messageDedupeKey);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), ["aid"])
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
        readNumber(existingData, ["aid"]) === null ||
        existingData.sourceDeliveryTable !== INSURANCE_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: INSURANCE_RECEIPT_SOURCE,
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
          type: "INSURANCE",
          referenceId: child.id,
          referenceType: "Child",
          message,
          dueDate: expiryDate,
          branchId: child.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_insurance",
            sourceDeliveryTable: INSURANCE_RECEIPT_SOURCE,
            modernGenerator: "generateInsuranceAlarms",
            legacyMethod: "Data::AlarmsInsurance",
            medicalFormId: form.id,
            childId: child.id,
            legacyChildId,
            classId: child.classId,
            legacyClassId,
            legacyClassAccess: "login_users.uclasses_exact",
            currDate: dateKey(today),
            insuranceExpiryDate: expiryKey,
            rawInsuranceExpiry: expiryRaw,
            insuranceType,
            daysUntil,
            href: "alarmsInsurance.php",
            windowEndDate: dateKey(addDays(today, maxWindow)),
          },
        },
      });
      alarmId = alarm.id;
      existingByExpiryKey.set(expiryDedupeKey, {
        id: alarm.id,
        referenceId: child.id,
        message,
        legacyData: alarm.legacyData,
      });
      existingByMessageKey.set(messageDedupeKey, {
        id: alarm.id,
        referenceId: child.id,
        message,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const recipients = recipientsForInsuranceCandidate(legacyRecipients, {
      sourceDatabase,
      legacyClassId,
    });
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: INSURANCE_RECEIPT_SOURCE,
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
        sourceTable: INSURANCE_RECEIPT_SOURCE,
        category: "insurance",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateInsuranceAlarms",
          legacyMethod: "Data::AlarmsInsurance",
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
        type: "INSURANCE",
        category: "INSURANCE",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
