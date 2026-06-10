import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import {
  deliverPushNotification,
  pushDeliveryAuditData,
} from "@/lib/push-delivery";

const LEGACY_REMINDER_DAYS = [1, 3, 7];
const DAY_MS = 86_400_000;
const CONTRACT_RECEIPT_SOURCE = "custom_notifications_contracts";

type StaffKind = "Teacher" | "Manager" | "Doctor" | "Nurse";

interface StaffOwner {
  id: string;
  legacyId: number | null;
  firstName: string;
  lastName: string;
  branchId: string;
  branchLegacyId: number | null;
  branchName: string;
  sourceDatabase: string | null;
  userId: string | null;
}

interface ContractCandidate {
  sourceTable: string;
  sourceStaffTable: string;
  legacyMethod: string;
  staffKind: StaffKind;
  staff: StaffOwner;
  documentId: string;
  legacyDocumentId: number | null;
  legacyPersonId: number | null;
  documentType: string;
  documentTitle: string | null;
  expiryDate: Date;
  expiryKey: string;
  signedDaysUntilExpiry: number;
  legacyDayDifference: number;
  message: string;
}

interface ExistingContractAlarm {
  id: string;
  referenceId: string | null;
  referenceType: string | null;
  dueDate: Date | null;
  message: string | null;
  legacyData: unknown;
}

interface LegacyContractRecipient {
  userId: string;
  email: string | null;
  name: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacySites: string;
  legacyClasses: string;
}

export interface ContractGenerationSummary {
  branchesScanned: number;
  documentsScanned: number;
  documentsMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedMissingExpiry: number;
  skippedOutsideWindow: number;
  skippedNoRecipients: number;
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

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dayDiff(start: Date, end: Date) {
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

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function documentTypeLabel(value: string | null | undefined, fallback: string | null | undefined) {
  const direct = value?.trim();
  if (direct) return direct;
  const title = fallback?.trim();
  return title || "Document";
}

function legacyName(firstName: string, lastName: string) {
  const formatPart = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };
  return [formatPart(firstName), formatPart(lastName)].filter(Boolean).join(" ");
}

function legacyMessage(candidate: {
  staffKind: StaffKind;
  documentType: string;
  fullName: string;
  expiryKey: string;
  legacyDayDifference: number;
}) {
  const subject =
    candidate.staffKind === "Teacher"
      ? `"${candidate.documentType}" Document For ${candidate.fullName}`
      : `"${candidate.documentType}" For ${candidate.fullName}`;
  return `${subject} Will Expire On ${candidate.expiryKey} (${candidate.legacyDayDifference} Day(s))`;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

function reminderDaysForBranch(settings: Record<string, string> | undefined) {
  const threshold = parsePositiveInteger(settings?.["alarm.contract.threshold"], 7);
  return LEGACY_REMINDER_DAYS.filter((day) => day <= threshold);
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

function chooseLegacySettingValue(
  rows: Array<{
    sourceDatabase: string;
    settingKey: string;
    settingValue: string | null;
  }>,
  key: string,
) {
  const candidates = rows.filter(
    (row) => row.settingKey === key && row.settingValue?.trim(),
  );
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) =>
      row.sourceDatabase.toLowerCase().includes("users29sept"),
    ) ??
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    candidates[0]
  ).settingValue;
}

function emptySummary(): ContractGenerationSummary {
  return {
    branchesScanned: 0,
    documentsScanned: 0,
    documentsMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedMissingExpiry: 0,
    skippedOutsideWindow: 0,
    skippedNoRecipients: 0,
  };
}

function expiryFromMessage(message: string | null | undefined) {
  if (!message) return null;
  const match = message.match(/Will Expire On\s+(\d{4}-\d{1,2}-\d{1,2})/i);
  if (!match) return null;
  const [, raw] = match;
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return null;
  return dateKey(new Date(year, month - 1, day));
}

function expiryFromLegacyData(legacyData: unknown) {
  const data = asRecord(legacyData);
  const raw = readString(data, ["expiryDate", "expirydate", "targetDate", "exp_date"]);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!iso) return raw.slice(0, 10);
  const [, year, month, day] = iso;
  return dateKey(new Date(Number(year), Number(month) - 1, Number(day)));
}

function modernKey(
  staffKind: string,
  staffId: string,
  documentType: string,
  days: number,
  expiryKey: string,
) {
  return [
    "modern",
    staffKind,
    staffId,
    normalizeKey(documentType),
    days,
    expiryKey,
  ].join(":");
}

function legacyKey(
  sourceStaffTable: string,
  legacyPersonId: number,
  documentType: string,
  days: number,
  expiryKey: string,
) {
  return [
    "legacy",
    sourceStaffTable,
    legacyPersonId,
    normalizeKey(documentType),
    days,
    expiryKey,
  ].join(":");
}

function looseLegacyKey(
  sourceStaffTable: string,
  legacyPersonId: number,
  documentType: string,
  days: number,
) {
  return [
    "legacy",
    sourceStaffTable,
    legacyPersonId,
    normalizeKey(documentType),
    days,
  ].join(":");
}

function addExistingKeys(params: {
  existingKeys: Set<string>;
  looseExistingKeys: Set<string>;
  existingByKey?: Map<string, ExistingContractAlarm>;
  looseExistingByKey?: Map<string, ExistingContractAlarm>;
  alarm: ExistingContractAlarm;
}) {
  const data = asRecord(params.alarm.legacyData);
  const type = readString(data, ["type", "documentType"]);
  const days = readNumber(data, ["mid", "daysBefore", "indays", "legacyDayDifference"]);
  const expiry =
    expiryFromLegacyData(params.alarm.legacyData) ??
    expiryFromMessage(params.alarm.message) ??
    (params.alarm.dueDate ? dateKey(params.alarm.dueDate) : null);

  if (params.alarm.referenceId && params.alarm.referenceType && type && days !== null && expiry) {
    const key = modernKey(
      params.alarm.referenceType,
      params.alarm.referenceId,
      type,
      days,
      expiry,
    );
    params.existingKeys.add(key);
    params.existingByKey?.set(key, params.alarm);
  }

  const legacyPersonId = readNumber(data, ["legacyPersonId", "person_id"]);
  const sourceStaffTable = readString(data, ["sourceStaffTable", "level"]);
  if (legacyPersonId !== null && sourceStaffTable && type && days !== null) {
    if (expiry) {
      const key = legacyKey(sourceStaffTable, legacyPersonId, type, days, expiry);
      params.existingKeys.add(key);
      params.existingByKey?.set(key, params.alarm);
    } else {
      const key = looseLegacyKey(sourceStaffTable, legacyPersonId, type, days);
      params.looseExistingKeys.add(key);
      params.looseExistingByKey?.set(key, params.alarm);
    }
  }
}

function existingAlarmForCandidate(
  candidate: ContractCandidate,
  existingByKey: Map<string, ExistingContractAlarm>,
  looseExistingByKey: Map<string, ExistingContractAlarm>,
) {
  const modern = modernKey(
    candidate.staffKind,
    candidate.staff.id,
    candidate.documentType,
    candidate.legacyDayDifference,
    candidate.expiryKey,
  );
  const modernExisting = existingByKey.get(modern);
  if (modernExisting) return modernExisting;

  if (!candidate.legacyPersonId) return null;
  const exactLegacy = legacyKey(
    candidate.sourceStaffTable,
    candidate.legacyPersonId,
    candidate.documentType,
    candidate.legacyDayDifference,
    candidate.expiryKey,
  );
  const exactLegacyExisting = existingByKey.get(exactLegacy);
  if (exactLegacyExisting) return exactLegacyExisting;

  return looseExistingByKey.get(
    looseLegacyKey(
      candidate.sourceStaffTable,
      candidate.legacyPersonId,
      candidate.documentType,
      candidate.legacyDayDifference,
    ),
  ) ?? null;
}

function rememberCandidate(candidate: ContractCandidate, existingKeys: Set<string>) {
  existingKeys.add(
    modernKey(
      candidate.staffKind,
      candidate.staff.id,
      candidate.documentType,
      candidate.legacyDayDifference,
      candidate.expiryKey,
    ),
  );
  if (candidate.legacyPersonId) {
    existingKeys.add(
      legacyKey(
        candidate.sourceStaffTable,
        candidate.legacyPersonId,
        candidate.documentType,
        candidate.legacyDayDifference,
        candidate.expiryKey,
      ),
    );
  }
}

function rememberExistingAlarmForCandidate(
  candidate: ContractCandidate,
  existingByKey: Map<string, ExistingContractAlarm>,
  alarm: ExistingContractAlarm,
) {
  existingByKey.set(
    modernKey(
      candidate.staffKind,
      candidate.staff.id,
      candidate.documentType,
      candidate.legacyDayDifference,
      candidate.expiryKey,
    ),
    alarm,
  );
  if (candidate.legacyPersonId) {
    existingByKey.set(
      legacyKey(
        candidate.sourceStaffTable,
        candidate.legacyPersonId,
        candidate.documentType,
        candidate.legacyDayDifference,
        candidate.expiryKey,
      ),
      alarm,
    );
  }
}

function legacyContractUserAllows(
  recipient: LegacyContractRecipient,
  candidate: ContractCandidate,
  directLegacyUserId: number | null,
) {
  if (directLegacyUserId !== null && recipient.legacyRecipientId === directLegacyUserId) {
    return true;
  }

  if (recipient.legacyClasses.trim() !== "0") return false;
  if (recipient.legacySites.trim() === "0") return true;
  if (candidate.staff.branchLegacyId === null) return false;
  return recipient.legacySites.trim() === String(candidate.staff.branchLegacyId);
}

function recipientsForContractCandidate(
  recipients: LegacyContractRecipient[],
  recipientIds: Set<string>,
  candidate: ContractCandidate,
  directLegacyUserId: number | null,
) {
  const selected = new Map<string, LegacyContractRecipient>();
  for (const recipient of recipients) {
    if (!recipientIds.has(recipient.userId)) continue;
    if (
      candidate.staff.sourceDatabase &&
      recipient.legacySourceDatabase !== candidate.staff.sourceDatabase
    ) {
      continue;
    }
    if (!legacyContractUserAllows(recipient, candidate, directLegacyUserId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

async function storeContractEmailAudit(params: {
  alarmId: string;
  subject: string;
  body: string;
  recipients: LegacyContractRecipient[];
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
    category: "CONTRACT",
    metadata: {
      source: "generateContractAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: CONTRACT_RECEIPT_SOURCE,
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

async function storeContractPushAudit(params: {
  alarmId: string;
  recipientUserIds: string[];
  title: string;
  body: string;
  legacyNotificationId: number;
  candidate: ContractCandidate;
}) {
  const pushDelivery = await deliverPushNotification({
    recipientUserIds: params.recipientUserIds,
    title: params.title,
    body: params.body,
    category: "CONTRACT",
    url: "/alarms/contracts",
    metadata: {
      source: "generateContractAlarms",
      legacyNotificationId: params.legacyNotificationId,
      legacyDeliveryTable: CONTRACT_RECEIPT_SOURCE,
      legacyMethod: params.candidate.legacyMethod,
      legacyRecipientRule: "getUserAndBoss",
      sourceDatabase: params.candidate.staff.sourceDatabase,
      sourceDocumentTable: params.candidate.sourceTable,
      sourceStaffTable: params.candidate.sourceStaffTable,
      documentId: params.candidate.documentId,
      legacyDocumentId: params.candidate.legacyDocumentId,
      legacyPersonId: params.candidate.legacyPersonId,
      documentType: params.candidate.documentType,
      expiryDate: params.candidate.expiryKey,
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

function toCandidate(params: {
  sourceTable: string;
  sourceStaffTable: string;
  legacyMethod: string;
  staffKind: StaffKind;
  staff: StaffOwner;
  documentId: string;
  legacyDocumentId: number | null;
  documentType: string;
  documentTitle: string | null;
  expiryDate: Date;
  today: Date;
}): ContractCandidate {
  const expiryKey = dateKey(params.expiryDate);
  const expiryDate = dateFromKey(expiryKey);
  const signedDaysUntilExpiry = dayDiff(params.today, params.expiryDate);
  const legacyDayDifference = Math.abs(signedDaysUntilExpiry);
  const fullName = legacyName(params.staff.firstName, params.staff.lastName);
  const message = legacyMessage({
    staffKind: params.staffKind,
    documentType: params.documentType,
    fullName,
    expiryKey,
    legacyDayDifference,
  });

  return {
    sourceTable: params.sourceTable,
    sourceStaffTable: params.sourceStaffTable,
    legacyMethod: params.legacyMethod,
    staffKind: params.staffKind,
    staff: params.staff,
    documentId: params.documentId,
    legacyDocumentId: params.legacyDocumentId,
    legacyPersonId: params.staff.legacyId,
    documentType: params.documentType,
    documentTitle: params.documentTitle,
    expiryDate,
    expiryKey,
    signedDaysUntilExpiry,
    legacyDayDifference,
    message,
  };
}

export async function generateContractAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<ContractGenerationSummary> {
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
      key: { in: ["alarm.contract.enabled", "alarm.contract.threshold"] },
    },
  });
  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }

  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.contract.enabled"];
    return enabled === undefined || enabled === "true";
  });
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const staffBranchWhere = {
    isActive: true,
    branchId: { in: enabledBranchIds },
    branch: { organizationId: params.organizationId },
  };

  const [
    teacherAttachments,
    teacherDocuments,
    nurseAttachments,
    nurseDocuments,
    doctorAttachments,
    doctorDocuments,
    managerAttachments,
  ] = await Promise.all([
    db.teacherAttachment.findMany({
      where: { teacher: staffBranchWhere },
      select: {
        id: true,
        legacyId: true,
        type: true,
        filename: true,
        expiryDate: true,
        teacher: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            userId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.teacherDocument.findMany({
      where: { teacher: staffBranchWhere },
      select: {
        id: true,
        type: true,
        title: true,
        expiryDate: true,
        teacher: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            userId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.nurseAttachment.findMany({
      where: { nurse: staffBranchWhere },
      select: {
        id: true,
        legacyId: true,
        type: true,
        filename: true,
        expiryDate: true,
        nurse: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            userId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.nurseDocument.findMany({
      where: { nurse: staffBranchWhere },
      select: {
        id: true,
        type: true,
        title: true,
        expiryDate: true,
        nurse: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            userId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.doctorAttachment.findMany({
      where: { isActive: true, doctor: staffBranchWhere },
      select: {
        id: true,
        legacyId: true,
        type: true,
        title: true,
        filename: true,
        expiryDate: true,
        doctor: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.doctorDocument.findMany({
      where: { doctor: staffBranchWhere },
      select: {
        id: true,
        type: true,
        title: true,
        expiryDate: true,
        doctor: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
    db.managerAttachment.findMany({
      where: { isActive: true, manager: staffBranchWhere },
      select: {
        id: true,
        legacyId: true,
        type: true,
        title: true,
        filename: true,
        expiryDate: true,
        manager: {
          select: {
            id: true,
            legacyId: true,
            firstName: true,
            lastName: true,
            branchId: true,
            userId: true,
            branch: { select: { name: true, legacyId: true, sourceDatabase: true } },
          },
        },
      },
    }),
  ]);

  const candidates: ContractCandidate[] = [];
  const addCandidate = (candidate: ContractCandidate) => {
    const branchDays = reminderDaysForBranch(settingsByBranch.get(candidate.staff.branchId));
    if (!branchDays.includes(candidate.legacyDayDifference)) {
      summary.skippedOutsideWindow += 1;
      return;
    }
    candidates.push(candidate);
  };

  for (const row of teacherAttachments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "t_teacher_attachments",
        sourceStaffTable: "t_teacher",
        legacyMethod: "Data::AlarmsTeachersContracts",
        staffKind: "Teacher",
        staff: {
          ...row.teacher,
          branchLegacyId: row.teacher.branch.legacyId,
          branchName: row.teacher.branch.name,
          sourceDatabase: row.teacher.branch.sourceDatabase,
          userId: row.teacher.userId,
        },
        documentId: row.id,
        legacyDocumentId: row.legacyId,
        documentType: documentTypeLabel(row.type, row.filename),
        documentTitle: row.filename,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of teacherDocuments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "teacher_documents",
        sourceStaffTable: "t_teacher",
        legacyMethod: "Data::AlarmsTeachersContracts",
        staffKind: "Teacher",
        staff: {
          ...row.teacher,
          branchLegacyId: row.teacher.branch.legacyId,
          branchName: row.teacher.branch.name,
          sourceDatabase: row.teacher.branch.sourceDatabase,
          userId: row.teacher.userId,
        },
        documentId: row.id,
        legacyDocumentId: null,
        documentType: documentTypeLabel(row.type, row.title),
        documentTitle: row.title,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of nurseAttachments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "t_nurse_attachments",
        sourceStaffTable: "t_nurse",
        legacyMethod: "Data::AlarmsNurseContracts",
        staffKind: "Nurse",
        staff: {
          ...row.nurse,
          branchLegacyId: row.nurse.branch.legacyId,
          branchName: row.nurse.branch.name,
          sourceDatabase: row.nurse.branch.sourceDatabase,
          userId: null,
        },
        documentId: row.id,
        legacyDocumentId: row.legacyId,
        documentType: documentTypeLabel(row.type, row.filename),
        documentTitle: row.filename,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of nurseDocuments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "nurse_documents",
        sourceStaffTable: "t_nurse",
        legacyMethod: "Data::AlarmsNurseContracts",
        staffKind: "Nurse",
        staff: {
          ...row.nurse,
          branchLegacyId: row.nurse.branch.legacyId,
          branchName: row.nurse.branch.name,
          sourceDatabase: row.nurse.branch.sourceDatabase,
          userId: null,
        },
        documentId: row.id,
        legacyDocumentId: null,
        documentType: documentTypeLabel(row.type, row.title),
        documentTitle: row.title,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of doctorAttachments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "t_garderie_doctor_attachments",
        sourceStaffTable: "t_garderie_doctor",
        legacyMethod: "Data::AlarmsDoctorsContracts",
        staffKind: "Doctor",
        staff: {
          ...row.doctor,
          branchLegacyId: row.doctor.branch.legacyId,
          branchName: row.doctor.branch.name,
          sourceDatabase: row.doctor.branch.sourceDatabase,
          userId: null,
        },
        documentId: row.id,
        legacyDocumentId: row.legacyId,
        documentType: documentTypeLabel(row.type, row.title ?? row.filename),
        documentTitle: row.title ?? row.filename,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of doctorDocuments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "doctor_documents",
        sourceStaffTable: "t_garderie_doctor",
        legacyMethod: "Data::AlarmsDoctorsContracts",
        staffKind: "Doctor",
        staff: {
          ...row.doctor,
          branchLegacyId: row.doctor.branch.legacyId,
          branchName: row.doctor.branch.name,
          sourceDatabase: row.doctor.branch.sourceDatabase,
          userId: null,
        },
        documentId: row.id,
        legacyDocumentId: null,
        documentType: documentTypeLabel(row.type, row.title),
        documentTitle: row.title,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  for (const row of managerAttachments) {
    summary.documentsScanned += 1;
    if (!row.expiryDate) {
      summary.skippedMissingExpiry += 1;
      continue;
    }
    addCandidate(
      toCandidate({
        sourceTable: "t_manager_attachments",
        sourceStaffTable: "t_manager",
        legacyMethod: "Data::AlarmsManagersContracts",
        staffKind: "Manager",
        staff: {
          ...row.manager,
          branchLegacyId: row.manager.branch.legacyId,
          branchName: row.manager.branch.name,
          sourceDatabase: row.manager.branch.sourceDatabase,
          userId: row.manager.userId,
        },
        documentId: row.id,
        legacyDocumentId: row.legacyId,
        documentType: documentTypeLabel(row.type, row.title ?? row.filename),
        documentTitle: row.title ?? row.filename,
        expiryDate: row.expiryDate,
        today,
      }),
    );
  }

  summary.documentsMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "CONTRACT",
      isActive: true,
      branchId: { in: enabledBranchIds },
    },
    select: {
      id: true,
      referenceId: true,
      referenceType: true,
      dueDate: true,
      message: true,
      legacyData: true,
    },
  });
  const existingKeys = new Set<string>();
  const looseExistingKeys = new Set<string>();
  const existingByKey = new Map<string, ExistingContractAlarm>();
  const looseExistingByKey = new Map<string, ExistingContractAlarm>();
  for (const alarm of existingAlarms) {
    addExistingKeys({
      existingKeys,
      looseExistingKeys,
      existingByKey,
      looseExistingByKey,
      alarm,
    });
  }

  const directUserIds = Array.from(
    new Set(candidates.map((candidate) => candidate.staff.userId).filter(Boolean) as string[]),
  );

  const [users, templates, legacyTemplateRows, maxReceipt] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        organizationId: params.organizationId,
        OR: [
          { branchId: { in: enabledBranchIds } },
          { branchId: null, role: "ADMIN" },
          ...(directUserIds.length ? [{ id: { in: directUserIds } }] : []),
        ],
      },
      select: { id: true, branchId: true, role: true, email: true, name: true },
    }),
    db.notificationTemplate.findMany({
      where: {
        organizationId: params.organizationId,
        category: { in: ["CONTRACT", "EXPIRATION"] },
      },
    }),
    db.legacySetting.findMany({
      where: {
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: { in: ["email-expiring-subj", "email-expiring-msg"] },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: CONTRACT_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
    }),
  ]);
  const template =
    templates.find((row) => row.category === "CONTRACT") ??
    templates.find((row) => row.category === "EXPIRATION") ??
    null;

  const adminUserIds = users
    .filter((user) => user.branchId === null && user.role === "ADMIN")
    .map((user) => user.id);
  const userIdsByBranch = new Map<string, string[]>();
  const allowedUserIds = new Set(users.map((user) => user.id));
  for (const user of users) {
    if (!user.branchId) continue;
    const branchUsers = userIdsByBranch.get(user.branchId) ?? [];
    branchUsers.push(user.id);
    userIdsByBranch.set(user.branchId, branchUsers);
  }

  const userIds = users.map((user) => user.id);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const legacyAuthRows = userIds.length
    ? await db.legacyAuthRecord.findMany({
        where: {
          legacyTable: "login_users",
          userId: { in: userIds },
          OR: [{ isDisabled: false }, { isDisabled: null }],
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
  const legacyRecipients: LegacyContractRecipient[] = legacyAuthRows.flatMap((row) => {
    if (!row.userId) return [];
    const data = asRecord(row.legacyData);
    const user = usersById.get(row.userId);
    return [{
      userId: row.userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      legacyRecipientId: row.legacyUserId ?? row.legacyId,
      legacySourceDatabase: row.sourceDatabase,
      legacySites: readString(data, ["usites"]) ?? "0",
      legacyClasses: readString(data, ["uclasses"]) ?? "0",
    }];
  });
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), ["aid"]) ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate =
    template?.subject ||
    chooseLegacySettingValue(legacyTemplateRows, "email-expiring-subj") ||
    "Expiring Documents";
  const bodyTemplate =
    template?.body ||
    chooseLegacySettingValue(legacyTemplateRows, "email-expiring-msg") ||
    "[[message]]";

  for (const candidate of candidates) {
    const existingAlarm = existingAlarmForCandidate(
      candidate,
      existingByKey,
      looseExistingByKey,
    );
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), ["aid"])
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }

    const recipientIds = new Set([
      ...(userIdsByBranch.get(candidate.staff.branchId) ?? []),
      ...adminUserIds,
    ]);
    if (candidate.staff.userId && allowedUserIds.has(candidate.staff.userId)) {
      recipientIds.add(candidate.staff.userId);
    }
    const directLegacyUserId = candidate.staff.userId
      ? legacyRecipients.find(
          (recipient) =>
            recipient.userId === candidate.staff.userId &&
            (!candidate.staff.sourceDatabase ||
              recipient.legacySourceDatabase === candidate.staff.sourceDatabase),
        )?.legacyRecipientId ?? null
      : null;
    const recipients = recipientsForContractCandidate(
      legacyRecipients,
      recipientIds,
      candidate,
      directLegacyUserId,
    );

    let alarmId = existingAlarm?.id ?? null;
    let shouldAttemptPushAudit = !existingAlarm;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      const needsPushAudit = !asRecord(existingData.pushDelivery);
      shouldAttemptPushAudit = needsPushAudit;
      if (
        readNumber(existingData, ["aid"]) === null ||
        existingData.sourceDeliveryTable !== CONTRACT_RECEIPT_SOURCE ||
        needsPushAudit
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: CONTRACT_RECEIPT_SOURCE,
              legacyBranchId: candidate.staff.branchLegacyId,
              legacyRecipientRule: "getUserAndBoss",
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "CONTRACT",
          referenceId: candidate.staff.id,
          referenceType: candidate.staffKind,
          message: candidate.message,
          dueDate: candidate.expiryDate,
          branchId: candidate.staff.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_contracts",
            sourceDeliveryTable: CONTRACT_RECEIPT_SOURCE,
            sourceDocumentTable: candidate.sourceTable,
            sourceStaffTable: candidate.sourceStaffTable,
            modernGenerator: "generateContractAlarms",
            legacyMethod: candidate.legacyMethod,
            legacyRecipientRule: "getUserAndBoss",
            personId: candidate.staff.id,
            legacyPersonId: candidate.legacyPersonId,
            documentId: candidate.documentId,
            legacyDocumentId: candidate.legacyDocumentId,
            type: candidate.documentType,
            documentType: candidate.documentType,
            documentTitle: candidate.documentTitle,
            level: candidate.sourceStaffTable,
            mid: candidate.legacyDayDifference,
            indays: candidate.legacyDayDifference,
            signedDaysUntilExpiry: candidate.signedDaysUntilExpiry,
            expiryDate: candidate.expiryKey,
            branchId: candidate.staff.branchId,
            legacyBranchId: candidate.staff.branchLegacyId,
            branchName: candidate.staff.branchName,
            staffKind: candidate.staffKind,
            href: "alarmsContracts.php",
          },
        },
      });
      alarmId = alarm.id;
      rememberCandidate(candidate, existingKeys);
      rememberExistingAlarmForCandidate(candidate, existingByKey, {
        id: alarm.id,
        referenceId: candidate.staff.id,
        referenceType: candidate.staffKind,
        dueDate: candidate.expiryDate,
        message: candidate.message,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    if (recipientIds.size === 0) {
      summary.skippedNoRecipients += 1;
      continue;
    }
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: CONTRACT_RECEIPT_SOURCE,
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

    const variables = {
      message: candidate.message,
      staff_name: legacyName(candidate.staff.firstName, candidate.staff.lastName),
      staff_type: candidate.staffKind,
      person_name: legacyName(candidate.staff.firstName, candidate.staff.lastName),
      document_type: candidate.documentType,
      document_title: candidate.documentTitle ?? candidate.documentType,
      document_name: candidate.documentTitle ?? candidate.documentType,
      branch_name: candidate.staff.branchName,
      date: candidate.expiryKey,
      expiry_date: candidate.expiryKey,
      days_until: candidate.legacyDayDifference,
    };
    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);

    if (newReceiptRecipients.length === 0) {
      if (templateEnabled && shouldAttemptPushAudit) {
        await storeContractPushAudit({
          alarmId,
          recipientUserIds: recipients.map((recipient) => recipient.userId),
          title,
          body,
          legacyNotificationId,
          candidate,
        });
      }
      continue;
    }

    const receiptResult = await db.notificationReceipt.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        sourceTable: CONTRACT_RECEIPT_SOURCE,
        category: "contracts",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateContractAlarms",
          legacyMethod: candidate.legacyMethod,
          legacyRecipientRule: "getUserAndBoss",
          legacySites: recipient.legacySites,
          legacyClasses: recipient.legacyClasses,
          legacyBranchId: candidate.staff.branchLegacyId,
          sourceStaffTable: candidate.sourceStaffTable,
          legacyPersonId: candidate.legacyPersonId,
          documentId: candidate.documentId,
          legacyDocumentId: candidate.legacyDocumentId,
          documentType: candidate.documentType,
          expiryDate: candidate.expiryKey,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    if (!templateEnabled || receiptResult.count === 0) continue;

    const created = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title,
        body,
        type: "CONTRACT",
        category: "CONTRACT",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;

    await storeContractEmailAudit({
      alarmId,
      subject: title,
      body,
      recipients: newReceiptRecipients,
      legacyNotificationId,
      sourceDatabase: candidate.staff.sourceDatabase,
    });

    if (shouldAttemptPushAudit) {
      await storeContractPushAudit({
        alarmId,
        recipientUserIds: newReceiptRecipients.map((recipient) => recipient.userId),
        title,
        body,
        legacyNotificationId,
        candidate,
      });
    }
  }

  return summary;
}
