import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { encryptLegacyId } from "@/lib/legacy-id";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

const MEDICAL_RECEIPT_SOURCE = "custom_notifications_medical";

interface MedicalReportConfig {
  formType: "GENERAL" | "CONDITIONS" | "VACCINATIONS";
  legacyType: "t_form_1" | "t_form_2" | "t_form_4";
  legacyHref: "Medical_form1.php" | "Medical_form2.php" | "Medical_form4.php";
  reportName: string;
}

interface LegacyMedicalRecipient {
  userId: string;
  email: string | null;
  name: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
}

export interface MedicalGenerationSummary {
  branchesScanned: number;
  childrenScanned: number;
  reportsMatched: number;
  alarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
}

const REPORTS: MedicalReportConfig[] = [
  {
    formType: "GENERAL",
    legacyType: "t_form_1",
    legacyHref: "Medical_form1.php",
    reportName: "General Form",
  },
  {
    formType: "CONDITIONS",
    legacyType: "t_form_2",
    legacyHref: "Medical_form2.php",
    reportName: "Suffering Form",
  },
  {
    formType: "VACCINATIONS",
    legacyType: "t_form_4",
    legacyHref: "Medical_form4.php",
    reportName: "Vaccination Report",
  },
];

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
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

function legacyMedicalClassAllows(
  legacyClasses: string,
  classLegacyId: number | null,
) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized === String(classLegacyId);
}

function legacySourceMatches(
  recipient: LegacyMedicalRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForMedicalCandidate(
  recipients: LegacyMedicalRecipient[],
  candidate: {
    sourceDatabase: string | null;
    legacyClassId: number | null;
  },
) {
  const selected = new Map<string, LegacyMedicalRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyMedicalClassAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
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

function emptySummary(): MedicalGenerationSummary {
  return {
    branchesScanned: 0,
    childrenScanned: 0,
    reportsMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
  };
}

function childLegacyHref(config: MedicalReportConfig, child: { id: string; legacyId: number | null }) {
  const identifier = child.legacyId ? encryptLegacyId(child.legacyId) : child.id;
  return `${config.legacyHref}?id=${encodeURIComponent(identifier)}`;
}

function existingMedicalKey(
  alarm: {
    referenceId: string | null;
    legacyData: unknown;
  },
) {
  if (!alarm.referenceId) return null;
  const legacyData = asRecord(alarm.legacyData);
  const legacyType = readString(legacyData, ["type", "legacyType"]);
  const status = readNumber(legacyData, ["status", "legacyStatus"]);
  if (!legacyType || status === null) return null;
  return `${alarm.referenceId}:${legacyType}:${status}`;
}

async function storeMedicalEmailAudit(params: {
  alarmId: string;
  subject: string;
  body: string;
  recipients: LegacyMedicalRecipient[];
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
    category: "MISSING_REPORTS",
    metadata: {
      source: "generateMedicalAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: MEDICAL_RECEIPT_SOURCE,
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

export async function generateMedicalAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<MedicalGenerationSummary> {
  const today = startOfToday(params.now);
  const todayKey = dateKey(today);
  const summary = emptySummary();

  const branchRows = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true },
  });
  const branchIds = branchRows.map((branch) => branch.id);
  summary.branchesScanned = branchIds.length;

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "medical"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: "alarm.medical.enabled",
    },
  });
  const enabledByBranch = new Map(
    settings.map((setting) => [setting.branchId, setting.value]),
  );
  const enabledBranchIds = branchIds.filter((id) => enabledByBranch.get(id) !== "false");
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const children = await db.child.findMany({
    where: {
      isActive: true,
      isDraft: false,
      branchId: { in: enabledBranchIds },
      branch: { organizationId: params.organizationId },
    },
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
    orderBy: [{ branchId: "asc" }, { classId: "asc" }, { firstName: "asc" }],
  });
  summary.childrenScanned = children.length;
  if (children.length === 0) return summary;

  const childIds = children.map((child) => child.id);
  const existingForms = await db.medicalForm.findMany({
    where: {
      childId: { in: childIds },
      formType: { in: REPORTS.map((report) => report.formType) },
    },
    select: { childId: true, formType: true },
  });
  const existingFormKeys = new Set(
    existingForms.map((form) => `${form.childId}:${form.formType}`),
  );

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "MEDICAL",
      referenceId: { in: childIds },
      isActive: true,
    },
    select: { id: true, referenceId: true, legacyData: true },
  });
  const existingAlarmByKey = new Map<string, (typeof existingAlarms)[number]>();
  for (const alarm of existingAlarms) {
    const key = existingMedicalKey(alarm);
    if (key) existingAlarmByKey.set(key, alarm);
  }

  const candidates: Array<{
    child: (typeof children)[number];
    report: MedicalReportConfig;
    key: string;
    existingAlarm: (typeof existingAlarms)[number] | null;
  }> = [];
  for (const child of children) {
    for (const report of REPORTS) {
      if (existingFormKeys.has(`${child.id}:${report.formType}`)) continue;
      const key = `${child.id}:${report.legacyType}:0`;
      const existingAlarm = existingAlarmByKey.get(key) ?? null;
      if (existingAlarm) {
        summary.skippedExisting += 1;
      }
      candidates.push({ child, report, key, existingAlarm });
    }
  }
  summary.reportsMatched = candidates.length;
  if (candidates.length === 0) return summary;

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
          category: "MISSING_REPORTS",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: MEDICAL_RECEIPT_SOURCE },
      _max: { legacyNotificationId: true },
    }),
  ]);

  const legacyUsers = users.length
    ? await db.legacyAuthRecord.findMany({
        where: {
          legacyTable: "login_users",
          userId: { in: users.map((user) => user.id) },
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

  const legacyRecipients: LegacyMedicalRecipient[] = [];
  const usersById = new Map(users.map((user) => [user.id, user]));
  for (const record of legacyUsers) {
    if (!record.userId) continue;
    const user = usersById.get(record.userId);
    legacyRecipients.push({
      userId: record.userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      legacyRecipientId: record.legacyUserId ?? record.legacyId,
      legacySourceDatabase: record.sourceDatabase,
      legacyClasses: readString(asRecord(record.legacyData), ["uclasses"]) ?? "0",
    });
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Missing Report";
  const bodyTemplate =
    template?.body ||
    "Dear Parents, The {{report_name}} of your child {{child_name}} is missing . we need to be provided with that report. Regards, The Administration";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), ["aid"]) ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const { child, existingAlarm, key, report } = candidate;
    const childName = `${child.firstName} ${child.lastName}`;
    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      report_name: report.reportName,
      date: todayKey,
    };
    const message = renderNotificationText(bodyTemplate, variables);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), ["aid"])
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }
    const href = childLegacyHref(report, child);
    let alarmId = existingAlarm?.id ?? null;
    if (existingAlarm) {
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      if (
        readNumber(existingData, ["aid"]) === null ||
        existingData.sourceDeliveryTable !== MEDICAL_RECEIPT_SOURCE
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceDeliveryTable: MEDICAL_RECEIPT_SOURCE,
              legacyChildId: child.legacyId,
              legacyClassId: child.class?.legacyId ?? null,
              legacyClassAccess: "login_users.uclasses_exact_or_zero",
            },
          },
        });
      }
    }

    if (!existingAlarm) {
      const alarm = await db.alarm.create({
        data: {
          type: "MEDICAL",
          referenceId: child.id,
          referenceType: "Child",
          message,
          dueDate: today,
          branchId: child.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: "t_alarms_medical",
            sourceDeliveryTable: MEDICAL_RECEIPT_SOURCE,
            modernGenerator: "generateMedicalAlarms",
            legacyMethod: "Data::AlarmsMedical",
            childId: child.id,
            legacyChildId: child.legacyId,
            classId: child.classId,
            legacyClassId: child.class?.legacyId ?? null,
            legacyClassAccess: "login_users.uclasses_exact_or_zero",
            type: report.legacyType,
            level: 1,
            status: 0,
            currDate: todayKey,
            reportName: report.reportName,
            href,
          },
        },
      });
      alarmId = alarm.id;
      existingAlarmByKey.set(key, {
        id: alarm.id,
        referenceId: child.id,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const recipients = recipientsForMedicalCandidate(legacyRecipients, {
      sourceDatabase:
        child.sourceDatabase ?? child.class?.sourceDatabase ?? child.branch.sourceDatabase,
      legacyClassId: child.class?.legacyId ?? null,
    });
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: MEDICAL_RECEIPT_SOURCE,
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
        sourceTable: MEDICAL_RECEIPT_SOURCE,
        category: "medical",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateMedicalAlarms",
          legacyMethod: "Data::AlarmsMedical",
          legacyClassId: child.class?.legacyId ?? null,
          legacyClasses: recipient.legacyClasses,
          ntype: 0,
        },
      })),
      skipDuplicates: true,
    });
    summary.receiptsCreated += receiptResult.count;

    if (!templateEnabled || receiptResult.count === 0) continue;

    const notificationResult = await db.notification.createMany({
      data: newReceiptRecipients.map((recipient) => ({
        userId: recipient.userId,
        title: renderNotificationText(subjectTemplate, variables),
        body: message,
        type: "MEDICAL",
        category: "MISSING_REPORTS",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;

    await storeMedicalEmailAudit({
      alarmId,
      subject: renderNotificationText(subjectTemplate, variables),
      body: message,
      recipients: newReceiptRecipients,
      legacyNotificationId,
      sourceDatabase:
        child.sourceDatabase ?? child.class?.sourceDatabase ?? child.branch.sourceDatabase,
    });
  }

  return summary;
}
