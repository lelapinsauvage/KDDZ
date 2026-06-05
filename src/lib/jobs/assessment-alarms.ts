import { ASSESSMENT_TYPE_NAMES, VALID_ASSESSMENT_TYPES } from "@/lib/assessment-types";
import { db } from "@/lib/db";

export interface AssessmentDueAlarm {
  id: string;
  assessmentType: number;
  assessmentTypeName: string;
  childId: string;
  childNumber: string | null;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string | null;
  dueDate: Date;
  daysUntilDue: number;
  actionHref: string;
  message: string;
}

export interface AssessmentGenerationSummary {
  branchesScanned: number;
  childrenMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
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

function emptySummary(): AssessmentGenerationSummary {
  return {
    branchesScanned: 0,
    childrenMatched: 0,
    alarmsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
  };
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
        childNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        enrollmentDate: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
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
        childName,
        branchId: child.branchId,
        branchName: child.branch.name,
        classId: child.classId,
        className: child.class?.name ?? null,
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
    select: { referenceId: true, legacyData: true },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const assessmentType = assessmentTypeFromLegacyData(alarm.legacyData);
    if (assessmentType !== null) existingKeys.add(`${assessmentType}:${alarm.referenceId}`);
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
          category: "ASSESSMENT",
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
  const subjectTemplate = template?.subject || "Assessment Due";
  const bodyTemplate =
    template?.body ||
    "Assessment for [[child_name]] is due on [[date]]. Please complete it before the deadline.";

  for (const candidate of candidates) {
    const dedupeKey = `${candidate.assessmentType}:${candidate.childId}`;
    if (existingKeys.has(dedupeKey)) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "ASSESSMENT",
        referenceId: candidate.childId,
        referenceType: "Child",
        message: candidate.message,
        dueDate: candidate.dueDate,
        branchId: candidate.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_assessment",
          modernGenerator: "generateAssessmentAlarms",
          legacyMethod: "Data::AlarmsAssessment",
          legacyType: `t_assessment_${candidate.assessmentType}`,
          assessmentType: candidate.assessmentType,
          childId: candidate.childId,
          classId: candidate.classId,
          level: 1,
          status: 0,
          href: `assessment_${candidate.assessmentType}.php`,
          actionHref: candidate.actionHref,
          targetDate: dateKey(candidate.dueDate),
        },
      },
    });
    existingKeys.add(dedupeKey);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = Array.from(
      new Set([...(userIdsByBranch.get(candidate.branchId) ?? []), ...branchAdminIds]),
    );
    if (recipientIds.length === 0) continue;

    const variables = {
      child_name: candidate.childName,
      parent_name: "Parent",
      class_name: candidate.className ?? "",
      branch_name: candidate.branchName,
      date: dateKey(candidate.dueDate),
    };

    const notificationResult = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        title: renderNotificationText(subjectTemplate, variables),
        body: renderNotificationText(bodyTemplate, variables),
        type: "ASSESSMENT",
        category: "ASSESSMENT",
        isRead: false,
      })),
    });
    summary.notificationsCreated += notificationResult.count;
  }

  return summary;
}
