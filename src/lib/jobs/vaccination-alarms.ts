import { db } from "@/lib/db";
import { isLegacyNotificationGateEnabled } from "@/lib/legacy-notification-gates";

export interface VaccinationDueAlarm {
  id: string;
  childId: string;
  childNumber: string | null;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
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
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedLegacyNotificationGate: boolean;
  skippedMissingDob: number;
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

function normalizeVaccineType(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
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
      childNumber: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      branchId: true,
      classId: true,
      branch: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
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
          childNumber: child.childNumber,
          childName,
          branchId: child.branchId,
          branchName: child.branch.name,
          classId: child.classId,
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
    select: { referenceId: true, legacyData: true },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    const key = legacyAlarmKey(alarm.legacyData, alarm.referenceId);
    if (key) existingKeys.add(key);
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
          category: "VACCINATIONS",
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
  const subjectTemplate = template?.subject || "Vaccination Due";
  const bodyTemplate =
    template?.body ||
    "Vaccination [[vaccination_name]] for [[child_name]] is due on [[date]]. Please remind [[parent_name]].";

  for (const candidate of candidates) {
    const key = `${candidate.childId}:${candidate.vaccineType}:${candidate.level}`;
    if (existingKeys.has(key)) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "VACCINATION",
        referenceId: candidate.childId,
        referenceType: "Child",
        message: candidate.message,
        dueDate: candidate.dueDate,
        branchId: candidate.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_vaccinations",
          modernGenerator: "generateVaccinationAlarms",
          legacyMethod: "Data::AlarmsVaccinations",
          childId: candidate.childId,
          classId: candidate.classId,
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
    existingKeys.add(key);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = Array.from(
      new Set([
        ...(userIdsByBranch.get(candidate.branchId) ?? []),
        ...branchAdminIds,
      ]),
    );
    if (recipientIds.length === 0) continue;

    const variables = {
      child_name: candidate.childName,
      parent_name: "Parent",
      class_name: candidate.className ?? "",
      branch_name: candidate.branchName,
      date: dateKey(candidate.dueDate),
      vaccination_name: candidate.vaccineName,
      days_until: candidate.daysUntilDue,
    };
    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);
    const created = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        title,
        body,
        type: "VACCINATION",
        category: "VACCINATIONS",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
