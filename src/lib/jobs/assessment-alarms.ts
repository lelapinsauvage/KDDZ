import { ASSESSMENT_TYPE_NAMES, VALID_ASSESSMENT_TYPES } from "@/lib/assessment-types";
import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";
import {
  deliverPushNotification,
  pushDeliveryAuditData,
} from "@/lib/push-delivery";

const ASSESSMENT_ALARM_SOURCE = "t_alarms_assessment";
const ASSESSMENT_PARENT_ALARM_SOURCE = "t_alarms_assessment_parents";
const ASSESSMENT_RECEIPT_SOURCE = "custom_notifications_assessment";

export interface AssessmentDueAlarm {
  id: string;
  assessmentType: number;
  assessmentTypeName: string;
  childId: string;
  childNumber: string | null;
  legacyChildId: number | null;
  sourceDatabase: string | null;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string | null;
  legacyClassId: number | null;
  dueDate: Date;
  daysUntilDue: number;
  actionHref: string;
  message: string;
}

export interface AssessmentGenerationSummary {
  branchesScanned: number;
  childrenMatched: number;
  alarmsCreated: number;
  parentAlarmsCreated: number;
  receiptsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedExistingParentAlarms: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
}

interface LegacyAssessmentRecipient {
  userId: string;
  email: string | null;
  name: string | null;
  legacyRecipientId: number;
  legacySourceDatabase: string;
  legacyClasses: string;
}

const assessmentTypes = [...VALID_ASSESSMENT_TYPES];

const fallbackAssessmentWindows: Record<number, { minDays: number; maxDays: number }> = {
  1: { minDays: 0, maxDays: 90 },
  2: { minDays: 91, maxDays: 243 },
  3: { minDays: 244, maxDays: 365 },
  4: { minDays: 366, maxDays: 730 },
  5: { minDays: 731, maxDays: 1095 },
  6: { minDays: 1096, maxDays: 1460 },
  7: { minDays: 1461, maxDays: 1825 },
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ageInDays(dateOfBirth: Date | null, asOf: Date) {
  if (!dateOfBirth) return null;
  return Math.floor((asOf.getTime() - dateOfBirth.getTime()) / 86_400_000);
}

function isEligibleForAssessmentAlarm(
  child: { dateOfBirth: Date | null; enrollmentDate: Date | null },
  asOf: Date,
  minDays: number,
  maxDays: number,
) {
  const currentAge = ageInDays(child.dateOfBirth, asOf);
  if (currentAge === null || currentAge < minDays || currentAge > maxDays) {
    return { eligible: false, currentAge: null };
  }

  const joiningAge = ageInDays(child.dateOfBirth, child.enrollmentDate ?? asOf);
  if (joiningAge !== null && joiningAge > maxDays) {
    return { eligible: false, currentAge: null };
  }

  return { eligible: true, currentAge };
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

function assessmentTypeFromLegacyData(legacyData: unknown) {
  const data = asRecord(legacyData);
  const direct = data?.assessmentType;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "") {
    const parsed = Number(direct);
    if (Number.isFinite(parsed)) return parsed;
  }

  const legacyType = data?.type ?? data?.legacyType;
  if (typeof legacyType === "string") {
    const match = legacyType.match(/t_assessment_(\d+)/);
    if (match) return Number(match[1]);
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

function legacyAssessmentHref(type: number, legacyChildId: number | null) {
  const suffix = legacyChildId ? `?id=${legacyChildId}` : "";
  return `assessment_${type}.php${suffix}`;
}

function legacyClassListAllows(legacyClasses: string, classLegacyId: number | null) {
  const normalized = legacyClasses.trim();
  if (!normalized || normalized === "0") return true;
  if (classLegacyId === null) return false;

  return normalized
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(String(classLegacyId));
}

function legacySourceMatches(
  recipient: LegacyAssessmentRecipient,
  sourceDatabase: string | null,
) {
  return !sourceDatabase || recipient.legacySourceDatabase === sourceDatabase;
}

function recipientsForCandidate(
  recipients: LegacyAssessmentRecipient[],
  candidate: AssessmentDueAlarm,
) {
  const selected = new Map<string, LegacyAssessmentRecipient>();
  for (const recipient of recipients) {
    if (!legacySourceMatches(recipient, candidate.sourceDatabase)) continue;
    if (!legacyClassListAllows(recipient.legacyClasses, candidate.legacyClassId)) {
      continue;
    }
    if (!selected.has(recipient.userId)) selected.set(recipient.userId, recipient);
  }

  return Array.from(selected.values());
}

async function storeAssessmentEmailAudit(params: {
  alarmId: string;
  subject: string;
  body: string;
  recipients: LegacyAssessmentRecipient[];
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
    category: "ASSESSMENT",
    metadata: {
      source: "generateAssessmentAlarms",
      legacyNotificationId: params.legacyNotificationId,
      sourceDatabase: params.sourceDatabase,
      legacyDeliveryTable: ASSESSMENT_RECEIPT_SOURCE,
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

async function storeAssessmentParentPushAudit(params: {
  parentAlarmId: string;
  parentUserIds: string[];
  title: string;
  body: string;
  childId: string;
  legacyChildId: number | null;
  assessmentType: number;
  sourceDatabase: string | null;
}) {
  const pushDelivery = await deliverPushNotification({
    recipientParentUserIds: params.parentUserIds,
    title: params.title,
    body: params.body,
    category: "ASSESSMENT",
    url: "/parent",
    metadata: {
      source: "generateAssessmentAlarms",
      legacyDeliveryTable: ASSESSMENT_PARENT_ALARM_SOURCE,
      childId: params.childId,
      legacyChildId: params.legacyChildId,
      assessmentType: params.assessmentType,
      sourceDatabase: params.sourceDatabase,
    },
  });

  const alarm = await db.alarm.findUnique({
    where: { id: params.parentAlarmId },
    select: { legacyData: true },
  });
  await db.alarm.update({
    where: { id: params.parentAlarmId },
    data: {
      legacyData: {
        ...(asRecord(alarm?.legacyData) ?? {}),
        parentPushDelivery: pushDeliveryAuditData(pushDelivery),
      },
    },
  });
}

async function storeAssessmentStaffPushAudit(params: {
  alarmId: string;
  recipientUserIds: string[];
  title: string;
  body: string;
  legacyNotificationId: number;
  candidate: AssessmentDueAlarm;
}) {
  const pushDelivery = await deliverPushNotification({
    recipientUserIds: params.recipientUserIds,
    title: params.title,
    body: params.body,
    category: "ASSESSMENT",
    url: "/alarms/assessments",
    metadata: {
      source: "generateAssessmentAlarms",
      legacyNotificationId: params.legacyNotificationId,
      legacyDeliveryTable: ASSESSMENT_RECEIPT_SOURCE,
      childId: params.candidate.childId,
      legacyChildId: params.candidate.legacyChildId,
      legacyClassId: params.candidate.legacyClassId,
      assessmentType: params.candidate.assessmentType,
      targetDate: dateKey(params.candidate.dueDate),
      sourceDatabase: params.candidate.sourceDatabase,
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

function emptySummary(): AssessmentGenerationSummary {
  return {
    branchesScanned: 0,
    childrenMatched: 0,
    alarmsCreated: 0,
    parentAlarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedExistingParentAlarms: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
  };
}

function sourceTableFromLegacyData(legacyData: unknown) {
  return readString(asRecord(legacyData), "sourceTable");
}

export async function getAssessmentDueAlarmCandidates(params: {
  organizationId: string;
  branchId?: string | null;
}): Promise<AssessmentDueAlarm[]> {
  const today = startOfToday();
  const childWhere = {
    isActive: true,
    isDraft: false,
    branch: { organizationId: params.organizationId },
    ...(params.branchId ? { branchId: params.branchId } : {}),
  };

  const [children, assessments, scheduleRules] = await Promise.all([
    db.child.findMany({
      where: childWhere,
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        childNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        enrollmentDate: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true, sourceDatabase: true } },
        class: { select: { id: true, name: true, legacyId: true, sourceDatabase: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.assessment.findMany({
      where: {
        assessmentType: { in: assessmentTypes },
        child: childWhere,
      },
      select: {
        childId: true,
        assessmentType: true,
      },
    }),
    db.assessmentScheduleRule.findMany({
      where: {
        organizationId: params.organizationId,
        assessmentType: { in: assessmentTypes },
      },
      select: {
        assessmentType: true,
        minimumAgeDays: true,
        maximumAgeDays: true,
      },
    }),
  ]);

  const ruleByType = new Map(
    scheduleRules.map((rule) => [
      rule.assessmentType,
      {
        minDays: Number(
          rule.minimumAgeDays ??
            fallbackAssessmentWindows[rule.assessmentType]?.minDays ??
            0,
        ),
        maxDays: Number(
          rule.maximumAgeDays ??
            fallbackAssessmentWindows[rule.assessmentType]?.maxDays ??
            Number.MAX_SAFE_INTEGER,
        ),
      },
    ]),
  );

  const assessedKeys = new Set(
    assessments.map((assessment) => `${assessment.assessmentType}:${assessment.childId}`),
  );

  const alarms: AssessmentDueAlarm[] = [];

  for (const type of assessmentTypes) {
    const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];

    for (const child of children) {
      if (assessedKeys.has(`${type}:${child.id}`)) continue;

      const { eligible, currentAge } = isEligibleForAssessmentAlarm(
        child,
        today,
        window.minDays,
        window.maxDays,
      );
      if (!eligible || currentAge === null) continue;

      const daysUntilDue = Math.floor(window.maxDays - currentAge);
      if (daysUntilDue < 0 || daysUntilDue > 15) continue;

      const dueDate = child.dateOfBirth
        ? addDays(child.dateOfBirth, Math.floor(window.maxDays))
        : today;
      const assessmentTypeName = ASSESSMENT_TYPE_NAMES[type] ?? `Type ${type}`;
      const childName = `${child.firstName} ${child.lastName}`;

      alarms.push({
        id: `${type}:${child.id}`,
        assessmentType: type,
        assessmentTypeName,
        childId: child.id,
        childNumber: child.childNumber,
        legacyChildId: child.legacyId,
        sourceDatabase:
          child.sourceDatabase ?? child.class?.sourceDatabase ?? child.branch.sourceDatabase,
        childName,
        branchId: child.branchId,
        branchName: child.branch.name,
        classId: child.classId,
        className: child.class?.name ?? null,
        legacyClassId: child.class?.legacyId ?? null,
        dueDate,
        daysUntilDue,
        actionHref: `/assessments/${type}/new?childId=${child.id}`,
        message: `${assessmentTypeName} for ${childName} is needed within 15 days`,
      });
    }
  }

  alarms.sort((a, b) => {
    if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
    if (a.assessmentType !== b.assessmentType) {
      return a.assessmentType - b.assessmentType;
    }
    return a.childName.localeCompare(b.childName);
  });

  return alarms;
}

export async function generateAssessmentAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
}): Promise<AssessmentGenerationSummary> {
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

  if (!(await isLegacyNotificationGateEnabled(params.organizationId, "assessments"))) {
    summary.skippedLegacyNotificationGate = true;
    return summary;
  }

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: "alarm.assessment.enabled",
    },
  });
  const enabledByBranch = new Map(settings.map((setting) => [setting.branchId, setting.value]));
  const enabledBranchIds = branchIds.filter((id) => enabledByBranch.get(id) !== "false");
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const candidates = (
    await getAssessmentDueAlarmCandidates({
      organizationId: params.organizationId,
      branchId: params.branchId,
    })
  ).filter((candidate) => enabledBranchIds.includes(candidate.branchId));
  summary.childrenMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "ASSESSMENT",
      referenceType: "Child",
      referenceId: { in: candidates.map((candidate) => candidate.childId) },
      isActive: true,
    },
    select: { id: true, referenceId: true, legacyData: true },
  });
  const existingStaffByKey = new Map<
    string,
    { id: string; referenceId: string | null; legacyData: unknown }
  >();
  const existingParentByKey = new Map<
    string,
    { id: string; referenceId: string | null; legacyData: unknown }
  >();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const assessmentType = assessmentTypeFromLegacyData(alarm.legacyData);
    if (assessmentType !== null) {
      const key = `${assessmentType}:${alarm.referenceId}`;
      const sourceTable = sourceTableFromLegacyData(alarm.legacyData);
      if (sourceTable === ASSESSMENT_PARENT_ALARM_SOURCE) {
        existingParentByKey.set(key, alarm);
      } else if (!sourceTable || sourceTable === ASSESSMENT_ALARM_SOURCE) {
        existingStaffByKey.set(key, alarm);
      }
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
          category: "ASSESSMENT",
        },
      },
    }),
    db.notificationReceipt.aggregate({
      where: { sourceTable: ASSESSMENT_RECEIPT_SOURCE },
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

  const legacyRecipients: LegacyAssessmentRecipient[] = [];
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
  const subjectTemplate = template?.subject || "Assessment Due";
  const bodyTemplate =
    template?.body ||
    "Assessment for [[child_name]] is due on [[date]]. Please complete it before the deadline.";
  const maxExistingAlarmLegacyId = existingAlarms.reduce((max, alarm) => {
    const legacyId = readNumber(asRecord(alarm.legacyData), "aid") ?? 0;
    return Math.max(max, legacyId);
  }, 0);
  let nextLegacyNotificationId =
    Math.max(maxReceipt._max.legacyNotificationId ?? 0, maxExistingAlarmLegacyId) + 1;

  for (const candidate of candidates) {
    const dedupeKey = `${candidate.assessmentType}:${candidate.childId}`;
    const existingAlarm = existingStaffByKey.get(dedupeKey);
    let legacyNotificationId = existingAlarm
      ? readNumber(asRecord(existingAlarm.legacyData), "aid")
      : null;
    if (legacyNotificationId === null) {
      legacyNotificationId = nextLegacyNotificationId++;
    }

    let alarmId = existingAlarm?.id ?? null;
    let shouldAttemptStaffPushAudit = !existingAlarm;
    if (existingAlarm) {
      summary.skippedExisting += 1;
      const existingData = asRecord(existingAlarm.legacyData) ?? {};
      const needsStaffPushAudit = !asRecord(existingData.pushDelivery);
      shouldAttemptStaffPushAudit = needsStaffPushAudit;
      if (
        readNumber(existingData, "aid") === null ||
        existingData.sourceDeliveryTable !== ASSESSMENT_RECEIPT_SOURCE ||
        needsStaffPushAudit
      ) {
        await db.alarm.update({
          where: { id: existingAlarm.id },
          data: {
            legacyData: {
              ...existingData,
              aid: legacyNotificationId,
              sourceTable: ASSESSMENT_ALARM_SOURCE,
              sourceDeliveryTable: ASSESSMENT_RECEIPT_SOURCE,
              legacyChildId: candidate.legacyChildId,
              legacyClassId: candidate.legacyClassId,
              legacyClassAccess: "login_users.uclasses",
              href: legacyAssessmentHref(
                candidate.assessmentType,
                candidate.legacyChildId,
              ),
            },
          },
        });
      }
    } else {
      const alarm = await db.alarm.create({
        data: {
          type: "ASSESSMENT",
          referenceId: candidate.childId,
          referenceType: "Child",
          message: candidate.message,
          dueDate: candidate.dueDate,
          branchId: candidate.branchId,
          isActive: true,
          legacyData: {
            aid: legacyNotificationId,
            sourceTable: ASSESSMENT_ALARM_SOURCE,
            sourceDeliveryTable: ASSESSMENT_RECEIPT_SOURCE,
            modernGenerator: "generateAssessmentAlarms",
            legacyMethod: "Data::AlarmsAssessment",
            legacyType: `t_assessment_${candidate.assessmentType}`,
            assessmentType: candidate.assessmentType,
            childId: candidate.childId,
            legacyChildId: candidate.legacyChildId,
            classId: candidate.classId,
            legacyClassId: candidate.legacyClassId,
            legacyClassAccess: "login_users.uclasses",
            level: 1,
            status: 0,
            href: legacyAssessmentHref(candidate.assessmentType, candidate.legacyChildId),
            actionHref: candidate.actionHref,
            targetDate: dateKey(candidate.dueDate),
          },
        },
      });
      alarmId = alarm.id;
      existingStaffByKey.set(dedupeKey, {
        id: alarm.id,
        referenceId: candidate.childId,
        legacyData: alarm.legacyData,
      });
      summary.alarmsCreated += 1;
    }

    const existingParentAlarm = existingParentByKey.get(dedupeKey);
    let parentAlarmId = existingParentAlarm?.id ?? null;
    let shouldAttemptParentPushAudit = !existingParentAlarm;
    let legacyParentAlarmId = existingParentAlarm
      ? readNumber(asRecord(existingParentAlarm.legacyData), "aid")
      : null;
    if (legacyParentAlarmId === null) {
      legacyParentAlarmId = nextLegacyNotificationId++;
    }

    if (existingParentAlarm) {
      summary.skippedExistingParentAlarms += 1;
      const existingData = asRecord(existingParentAlarm.legacyData) ?? {};
      const needsParentPushAudit = !asRecord(existingData.parentPushDelivery);
      shouldAttemptParentPushAudit = needsParentPushAudit;
      if (
        readNumber(existingData, "aid") === null ||
        existingData.sourceTable !== ASSESSMENT_PARENT_ALARM_SOURCE ||
        existingData.details !== candidate.message ||
        existingData.href !== "alarmsAssessment.php" ||
        needsParentPushAudit
      ) {
        await db.alarm.update({
          where: { id: existingParentAlarm.id },
          data: {
            message: candidate.message,
            dueDate: candidate.dueDate,
            branchId: candidate.branchId,
            legacyData: {
              ...existingData,
              aid: legacyParentAlarmId,
              mid: legacyNotificationId,
              sourceTable: ASSESSMENT_PARENT_ALARM_SOURCE,
              details: candidate.message,
              href: "alarmsAssessment.php",
              type: candidate.assessmentTypeName,
              legacyType: `t_assessment_${candidate.assessmentType}`,
              assessmentType: candidate.assessmentType,
              childId: candidate.childId,
              child_id: candidate.legacyChildId,
              legacyChildId: candidate.legacyChildId,
              classId: candidate.classId,
              legacyClassId: candidate.legacyClassId,
              targetDate: dateKey(candidate.dueDate),
            },
          },
        });
      }
    } else {
      const parentAlarm = await db.alarm.create({
        data: {
          type: "ASSESSMENT",
          referenceId: candidate.childId,
          referenceType: "Child",
          message: candidate.message,
          dueDate: candidate.dueDate,
          branchId: candidate.branchId,
          isActive: true,
          legacyData: {
            aid: legacyParentAlarmId,
            mid: legacyNotificationId,
            sourceTable: ASSESSMENT_PARENT_ALARM_SOURCE,
            modernGenerator: "generateAssessmentAlarms",
            legacyMethod: "Data::addToAssessments",
            legacySourceMethod: "Data::AlarmsAssessment",
            legacyType: `t_assessment_${candidate.assessmentType}`,
            assessmentType: candidate.assessmentType,
            childId: candidate.childId,
            child_id: candidate.legacyChildId,
            legacyChildId: candidate.legacyChildId,
            classId: candidate.classId,
            legacyClassId: candidate.legacyClassId,
            level: 1,
            status: 0,
            ntype: 0,
            type: candidate.assessmentTypeName,
            details: candidate.message,
            href: "alarmsAssessment.php",
            actionHref: candidate.actionHref,
            targetDate: dateKey(candidate.dueDate),
          },
        },
      });
      parentAlarmId = parentAlarm.id;
      existingParentByKey.set(dedupeKey, {
        id: parentAlarm.id,
        referenceId: candidate.childId,
        legacyData: parentAlarm.legacyData,
      });
      summary.parentAlarmsCreated += 1;
    }

    if (parentAlarmId && shouldAttemptParentPushAudit) {
      const parentUsers = await db.parentUser.findMany({
        where: {
          childId: candidate.childId,
          isActive: true,
        },
        select: { id: true },
      });
      if (parentUsers.length > 0) {
        await storeAssessmentParentPushAudit({
          parentAlarmId,
          parentUserIds: parentUsers.map((parentUser) => parentUser.id),
          title: candidate.assessmentTypeName,
          body: candidate.message,
          childId: candidate.childId,
          legacyChildId: candidate.legacyChildId,
          assessmentType: candidate.assessmentType,
          sourceDatabase: candidate.sourceDatabase,
        });
      }
    }

    const recipients = recipientsForCandidate(legacyRecipients, candidate);
    if (!alarmId || recipients.length === 0) continue;

    const existingReceipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: ASSESSMENT_RECEIPT_SOURCE,
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
      child_name: candidate.childName,
      parent_name: "Parent",
      class_name: candidate.className ?? "",
      branch_name: candidate.branchName,
      date: dateKey(candidate.dueDate),
    };
    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);

    if (newReceiptRecipients.length === 0) {
      if (templateEnabled && shouldAttemptStaffPushAudit) {
        await storeAssessmentStaffPushAudit({
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
        sourceTable: ASSESSMENT_RECEIPT_SOURCE,
        category: "assessment",
        legacyNotificationId,
        legacyRecipientId: recipient.legacyRecipientId,
        recipientType: "USER",
        recipientId: recipient.userId,
        alarmId,
        isRead: false,
        metadata: {
          modernGenerator: "generateAssessmentAlarms",
          legacyMethod: "Data::AlarmsAssessment",
          legacyClassId: candidate.legacyClassId,
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
        title,
        body,
        type: "ASSESSMENT",
        category: "ASSESSMENT",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;

    await storeAssessmentEmailAudit({
      alarmId,
      subject: title,
      body,
      recipients: newReceiptRecipients,
      legacyNotificationId,
      sourceDatabase: candidate.sourceDatabase,
    });

    if (shouldAttemptStaffPushAudit) {
      await storeAssessmentStaffPushAudit({
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
