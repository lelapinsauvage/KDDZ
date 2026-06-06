import { db } from "@/lib/db";

const LEGACY_REMINDER_DAYS = [1, 3, 7];
const DAY_MS = 86_400_000;

type StaffKind = "Teacher" | "Manager" | "Doctor" | "Nurse";

interface StaffOwner {
  id: string;
  legacyId: number | null;
  firstName: string;
  lastName: string;
  branchId: string;
  branchName: string;
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

export interface ContractGenerationSummary {
  branchesScanned: number;
  documentsScanned: number;
  documentsMatched: number;
  alarmsCreated: number;
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

function emptySummary(): ContractGenerationSummary {
  return {
    branchesScanned: 0,
    documentsScanned: 0,
    documentsMatched: 0,
    alarmsCreated: 0,
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
  alarm: {
    referenceId: string | null;
    referenceType: string | null;
    dueDate: Date | null;
    message: string | null;
    legacyData: unknown;
  };
}) {
  const data = asRecord(params.alarm.legacyData);
  const type = readString(data, ["type", "documentType"]);
  const days = readNumber(data, ["mid", "daysBefore", "indays", "legacyDayDifference"]);
  const expiry =
    expiryFromLegacyData(params.alarm.legacyData) ??
    expiryFromMessage(params.alarm.message) ??
    (params.alarm.dueDate ? dateKey(params.alarm.dueDate) : null);

  if (params.alarm.referenceId && params.alarm.referenceType && type && days !== null && expiry) {
    params.existingKeys.add(
      modernKey(
        params.alarm.referenceType,
        params.alarm.referenceId,
        type,
        days,
        expiry,
      ),
    );
  }

  const legacyPersonId = readNumber(data, ["legacyPersonId", "person_id"]);
  const sourceStaffTable = readString(data, ["sourceStaffTable", "level"]);
  if (legacyPersonId !== null && sourceStaffTable && type && days !== null) {
    if (expiry) {
      params.existingKeys.add(
        legacyKey(sourceStaffTable, legacyPersonId, type, days, expiry),
      );
    } else {
      params.looseExistingKeys.add(
        looseLegacyKey(sourceStaffTable, legacyPersonId, type, days),
      );
    }
  }
}

function candidateExists(
  candidate: ContractCandidate,
  existingKeys: Set<string>,
  looseExistingKeys: Set<string>,
) {
  const modern = modernKey(
    candidate.staffKind,
    candidate.staff.id,
    candidate.documentType,
    candidate.legacyDayDifference,
    candidate.expiryKey,
  );
  if (existingKeys.has(modern)) return true;

  if (!candidate.legacyPersonId) return false;
  const exactLegacy = legacyKey(
    candidate.sourceStaffTable,
    candidate.legacyPersonId,
    candidate.documentType,
    candidate.legacyDayDifference,
    candidate.expiryKey,
  );
  if (existingKeys.has(exactLegacy)) return true;

  return looseExistingKeys.has(
    looseLegacyKey(
      candidate.sourceStaffTable,
      candidate.legacyPersonId,
      candidate.documentType,
      candidate.legacyDayDifference,
    ),
  );
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
  const expiryDate = startOfToday(params.expiryDate);
  const signedDaysUntilExpiry = dayDiff(params.today, expiryDate);
  const legacyDayDifference = Math.abs(signedDaysUntilExpiry);
  const expiryKey = dateKey(expiryDate);
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
            branch: { select: { name: true } },
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
          branchName: row.teacher.branch.name,
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
          branchName: row.teacher.branch.name,
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
          branchName: row.nurse.branch.name,
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
          branchName: row.nurse.branch.name,
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
          branchName: row.doctor.branch.name,
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
          branchName: row.doctor.branch.name,
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
          branchName: row.manager.branch.name,
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
      referenceId: true,
      referenceType: true,
      dueDate: true,
      message: true,
      legacyData: true,
    },
  });
  const existingKeys = new Set<string>();
  const looseExistingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    addExistingKeys({ existingKeys, looseExistingKeys, alarm });
  }

  const directUserIds = Array.from(
    new Set(candidates.map((candidate) => candidate.staff.userId).filter(Boolean) as string[]),
  );

  const [users, template] = await Promise.all([
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
      select: { id: true, branchId: true, role: true },
    }),
    db.notificationTemplate.findUnique({
      where: {
        organizationId_category: {
          organizationId: params.organizationId,
          category: "CONTRACT",
        },
      },
    }),
  ]);

  const adminUserIds = users
    .filter((user) => user.branchId === null && user.role === "ADMIN")
    .map((user) => user.id);
  const userIdsByBranch = new Map<string, string[]>();
  const usersById = new Set(users.map((user) => user.id));
  for (const user of users) {
    if (!user.branchId) continue;
    const branchUsers = userIdsByBranch.get(user.branchId) ?? [];
    branchUsers.push(user.id);
    userIdsByBranch.set(user.branchId, branchUsers);
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Staff Document Expiring";
  const bodyTemplate = template?.body || "[[message]]";

  for (const candidate of candidates) {
    if (candidateExists(candidate, existingKeys, looseExistingKeys)) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "CONTRACT",
        referenceId: candidate.staff.id,
        referenceType: candidate.staffKind,
        message: candidate.message,
        dueDate: candidate.expiryDate,
        branchId: candidate.staff.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_contracts",
          sourceDeliveryTable: "custom_notifications_contracts",
          sourceDocumentTable: candidate.sourceTable,
          sourceStaffTable: candidate.sourceStaffTable,
          modernGenerator: "generateContractAlarms",
          legacyMethod: candidate.legacyMethod,
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
          branchName: candidate.staff.branchName,
          staffKind: candidate.staffKind,
          href: "alarmsContracts.php",
        },
      },
    });
    rememberCandidate(candidate, existingKeys);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = new Set([
      ...(userIdsByBranch.get(candidate.staff.branchId) ?? []),
      ...adminUserIds,
    ]);
    if (candidate.staff.userId && usersById.has(candidate.staff.userId)) {
      recipientIds.add(candidate.staff.userId);
    }
    if (recipientIds.size === 0) {
      summary.skippedNoRecipients += 1;
      continue;
    }

    const variables = {
      message: candidate.message,
      staff_name: legacyName(candidate.staff.firstName, candidate.staff.lastName),
      staff_type: candidate.staffKind,
      document_type: candidate.documentType,
      document_title: candidate.documentTitle ?? candidate.documentType,
      branch_name: candidate.staff.branchName,
      date: candidate.expiryKey,
      expiry_date: candidate.expiryKey,
      days_until: candidate.legacyDayDifference,
    };
    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);

    const created = await db.notification.createMany({
      data: Array.from(recipientIds).map((userId) => ({
        userId,
        title,
        body,
        type: "CONTRACT",
        category: "CONTRACT",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
