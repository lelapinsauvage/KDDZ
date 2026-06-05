"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { getOrgBranchIds, verifyBranchAccess } from "@/lib/verify-org-access";
import type { AlarmType } from "@/generated/prisma/enums";
import { ASSESSMENT_TYPE_NAMES, VALID_ASSESSMENT_TYPES } from "@/lib/assessment-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlarmListParams {
  type?: AlarmType;
  branchId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface AlarmData {
  type: AlarmType;
  referenceId?: string | null;
  referenceType?: string | null;
  message?: string | null;
  dueDate?: Date | string | null;
  branchId?: string | null;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

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

export interface BirthdayGenerationSummary {
  branchesScanned: number;
  childrenMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateOrNull(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  return typeof value === "string" ? new Date(value) : value;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function legacyAlarmLevel(legacyData: unknown): number | null {
  const data = asRecord(legacyData);
  const rawLevel = data?.level;
  if (typeof rawLevel === "number") return rawLevel;
  if (typeof rawLevel === "string" && rawLevel.trim() !== "") {
    const parsed = Number(rawLevel);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function birthdayMessage(childName: string, daysUntil: number) {
  if (daysUntil === 0) return `${childName} Birthday Today`;
  if (daysUntil === 1) return `${childName} Birthday Tomorrow`;
  return `${childName} Birthday in ${daysUntil} Days`;
}

function renderNotificationText(
  text: string,
  variables: Record<string, string | number | null | undefined>,
) {
  return text.replace(
    /(\[\[([a-zA-Z0-9_]+)\]\]|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g,
    (match, _token, squareKey: string | undefined, braceKey: string | undefined) => {
      const key = squareKey ?? braceKey;
      const value = key ? variables[key] : undefined;
      return value === null || typeof value === "undefined" ? match : String(value);
    },
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

function isEligibleForAssessmentAlarm(
  child: { dateOfBirth: Date | null; enrollmentDate: Date | null },
  asOf: Date,
  minDays: number,
  maxDays: number
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

// ---------------------------------------------------------------------------
// generateBirthdayAlarms
// ---------------------------------------------------------------------------

export async function generateBirthdayAlarms(
  branchId?: string,
): Promise<ActionResult<BirthdayGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const branchIds = branchId ? [branchId] : await getOrgBranchIds(ctx.organizationId);
    const today = startOfToday();

    const settings = await db.settings.findMany({
      where: {
        branchId: { in: branchIds },
        key: { in: ["alarm.birthday.enabled", "alarm.birthday.threshold"] },
      },
    });
    const settingsByBranch = new Map<string, Record<string, string>>();
    for (const setting of settings) {
      const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
      branchSettings[setting.key] = setting.value;
      settingsByBranch.set(setting.branchId, branchSettings);
    }

    const enabledBranchIds = branchIds.filter((id) => {
      const enabled = settingsByBranch.get(id)?.["alarm.birthday.enabled"];
      return enabled === undefined || enabled === "true";
    });

    const summary: BirthdayGenerationSummary = {
      branchesScanned: branchIds.length,
      childrenMatched: 0,
      alarmsCreated: 0,
      notificationsCreated: 0,
      skippedExisting: 0,
      skippedDisabledBranches: branchIds.length - enabledBranchIds.length,
    };

    if (enabledBranchIds.length === 0) {
      return { success: true, data: summary };
    }

    const maxWindow = Math.max(
      0,
      ...enabledBranchIds.map((id) =>
        parsePositiveInteger(
          settingsByBranch.get(id)?.["alarm.birthday.threshold"],
          7,
        ),
      ),
    );

    if (maxWindow === 0) {
      return { success: true, data: summary };
    }

    const children = await db.child.findMany({
      where: {
        isActive: true,
        isDraft: false,
        dateOfBirth: { not: null },
        branchId: { in: enabledBranchIds },
      },
      include: {
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    const candidates = children
      .map((child) => {
        const dob = child.dateOfBirth!;
        const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / 86_400_000,
        );
        const threshold = parsePositiveInteger(
          settingsByBranch.get(child.branchId)?.["alarm.birthday.threshold"],
          7,
        );
        return { child, nextBirthday, daysUntil, threshold };
      })
      .filter((candidate) => candidate.daysUntil < candidate.threshold);

    summary.childrenMatched = candidates.length;
    if (candidates.length === 0) {
      return { success: true, data: summary };
    }

    const childIds = candidates.map((candidate) => candidate.child.id);
    const existingAlarms = await db.alarm.findMany({
      where: {
        type: "BIRTHDAY",
        referenceType: "Child",
        referenceId: { in: childIds },
        isActive: true,
      },
      select: { referenceId: true, dueDate: true, legacyData: true },
    });
    const existingKeys = new Set<string>();
    for (const alarm of existingAlarms) {
      if (!alarm.referenceId) continue;
      const level = legacyAlarmLevel(alarm.legacyData);
      if (level !== null) {
        existingKeys.add(`${alarm.referenceId}:${level}`);
      }
      if (alarm.dueDate) {
        existingKeys.add(`${alarm.referenceId}:${dateKey(alarm.dueDate)}`);
      }
    }

    const [users, template] = await Promise.all([
      db.user.findMany({
        where: {
          isActive: true,
          organizationId: ctx.organizationId,
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
            organizationId: ctx.organizationId,
            category: "BIRTHDAY",
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
    const subjectTemplate = template?.subject || "Happy Birthday!";
    const bodyTemplate =
      template?.body ||
      "Happy Birthday, [[child_name]]! Wishing you a wonderful day from everyone at [[branch_name]].";

    for (const candidate of candidates) {
      const { child, daysUntil, nextBirthday } = candidate;
      const dedupeByLevel = `${child.id}:${daysUntil}`;
      const dedupeByDate = `${child.id}:${dateKey(nextBirthday)}`;
      if (existingKeys.has(dedupeByLevel) || existingKeys.has(dedupeByDate)) {
        summary.skippedExisting += 1;
        continue;
      }

      const childName = `${child.firstName} ${child.lastName}`;
      const message = birthdayMessage(childName, daysUntil);
      await db.alarm.create({
        data: {
          type: "BIRTHDAY",
          referenceId: child.id,
          referenceType: "Child",
          message,
          dueDate: nextBirthday,
          branchId: child.branchId,
          isActive: true,
          legacyData: {
            sourceTable: "t_alarms_birthday",
            modernGenerator: "generateBirthdayAlarms",
            legacyMethod: "Data::AlarmsBirthday",
            childId: child.id,
            classId: child.classId,
            level: daysUntil,
            href: "alarmsBirthday.php",
            targetDate: dateKey(nextBirthday),
          },
        },
      });
      existingKeys.add(dedupeByLevel);
      existingKeys.add(dedupeByDate);
      summary.alarmsCreated += 1;

      if (!templateEnabled) continue;

      const recipientIds = Array.from(
        new Set([...(userIdsByBranch.get(child.branchId) ?? []), ...branchAdminIds]),
      );
      if (recipientIds.length === 0) continue;

      const variables = {
        child_name: childName,
        parent_name: "Parent",
        class_name: child.class?.name ?? "",
        branch_name: child.branch.name,
        date: dateKey(nextBirthday),
      };

      const notificationResult = await db.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          title: renderNotificationText(subjectTemplate, variables),
          body: renderNotificationText(bodyTemplate, variables),
          type: "BIRTHDAY",
          category: "BIRTHDAY",
          isRead: false,
        })),
      });
      summary.notificationsCreated += notificationResult.count;
    }

    revalidatePath("/alarms");
    revalidatePath("/alarms/birthdays");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate birthday alarms:", error);
    return { success: false, error: "Failed to generate birthday alarms" };
  }
}

// ---------------------------------------------------------------------------
// getAlarms
// ---------------------------------------------------------------------------

export async function getAlarms(
  params: AlarmListParams = {},
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const { type, branchId, isActive, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      branch: { organizationId: orgId },
    };

    if (type) where.type = type;
    if (branchId) where.branchId = branchId;
    if (typeof isActive === "boolean") where.isActive = isActive;

    const skip = (page - 1) * pageSize;

    const [alarms, total] = await Promise.all([
      db.alarm.findMany({
        where,
        include: { branch: true },
        orderBy: { dueDate: "asc" },
        skip,
        take: pageSize,
      }),
      db.alarm.count({ where }),
    ]);

    return {
      success: true,
      data: {
        alarms,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Failed to fetch alarms:", error);
    return { success: false, error: "Failed to fetch alarms" };
  }
}

// ---------------------------------------------------------------------------
// createAlarm
// ---------------------------------------------------------------------------

export async function createAlarm(data: AlarmData): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    if (data.branchId) {
      const hasAccess = await verifyBranchAccess(data.branchId, orgId);
      if (!hasAccess) return { success: false, error: "Branch not found in your organization" };
    }

    const alarm = await db.alarm.create({
      data: {
        type: data.type,
        referenceId: data.referenceId ?? null,
        referenceType: data.referenceType ?? null,
        message: data.message ?? null,
        dueDate: toDateOrNull(data.dueDate),
        branchId: data.branchId ?? null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to create alarm:", error);
    return { success: false, error: "Failed to create alarm" };
  }
}

// ---------------------------------------------------------------------------
// updateAlarm
// ---------------------------------------------------------------------------

export async function updateAlarm(
  id: string,
  data: Partial<AlarmData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.referenceId !== undefined)
      updateData.referenceId = data.referenceId;
    if (data.referenceType !== undefined)
      updateData.referenceType = data.referenceType;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.dueDate !== undefined)
      updateData.dueDate = toDateOrNull(data.dueDate);
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const alarm = await db.alarm.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to update alarm:", error);
    return { success: false, error: "Failed to update alarm" };
  }
}

// ---------------------------------------------------------------------------
// dismissAlarm — set isActive=false
// ---------------------------------------------------------------------------

export async function dismissAlarm(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    await db.alarm.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss alarm:", error);
    return { success: false, error: "Failed to dismiss alarm" };
  }
}

// ---------------------------------------------------------------------------
// deleteAlarm
// ---------------------------------------------------------------------------

export async function deleteAlarm(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    await db.alarm.delete({ where: { id } });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete alarm:", error);
    return { success: false, error: "Failed to delete alarm" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingBirthdays
// ---------------------------------------------------------------------------

export async function getUpcomingBirthdays(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      dateOfBirth: { not: null },
      branch: { organizationId: orgId },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const children = await db.child.findMany({
      where,
      include: { branch: true, class: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthdays = children
      .map((child) => {
        const dob = child.dateOfBirth!;
        // Calculate next birthday
        const nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );

        // If the birthday already passed this year, use next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate age at next birthday
        const age = nextBirthday.getFullYear() - dob.getFullYear();

        return {
          child,
          daysUntil,
          age,
          nextBirthday,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { success: true, data: birthdays };
  } catch (error) {
    console.error("Failed to fetch upcoming birthdays:", error);
    return { success: false, error: "Failed to fetch upcoming birthdays" };
  }
}

// ---------------------------------------------------------------------------
// getOverdueVaccinations
// ---------------------------------------------------------------------------

export async function getOverdueVaccinations(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      nextDueDate: { lt: today },
      child: { branch: { organizationId: orgId } },
    };

    if (branchId) {
      where.child = { ...where.child, branchId };
    }

    const vaccinations = await db.vaccination.findMany({
      where,
      include: {
        child: {
          include: { branch: true, class: true },
        },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return { success: true, data: vaccinations };
  } catch (error) {
    console.error("Failed to fetch overdue vaccinations:", error);
    return { success: false, error: "Failed to fetch overdue vaccinations" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingAssessments
// ---------------------------------------------------------------------------

export async function getUpcomingAssessments(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      scheduledDate: { gte: today },
      branch: { organizationId: orgId },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const assessmentDates = await db.assessmentDate.findMany({
      where,
      include: { branch: true },
      orderBy: { scheduledDate: "asc" },
    });

    return { success: true, data: assessmentDates };
  } catch (error) {
    console.error("Failed to fetch upcoming assessments:", error);
    return { success: false, error: "Failed to fetch upcoming assessments" };
  }
}

// ---------------------------------------------------------------------------
// getAssessmentDueAlarms — legacy-style child assessment reminders
// ---------------------------------------------------------------------------

export async function getAssessmentDueAlarms(
  branchId?: string,
): Promise<ActionResult<AssessmentDueAlarm[]>> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const today = startOfToday();

    const childWhere = {
      isActive: true,
      isDraft: false,
      branch: { organizationId: orgId },
      ...(branchId ? { branchId } : {}),
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
          organizationId: orgId,
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
              0
          ),
          maxDays: Number(
            rule.maximumAgeDays ??
              fallbackAssessmentWindows[rule.assessmentType]?.maxDays ??
              Number.MAX_SAFE_INTEGER
          ),
        },
      ])
    );

    const assessedKeys = new Set(
      assessments.map((assessment) => `${assessment.assessmentType}:${assessment.childId}`)
    );

    const alarms: AssessmentDueAlarm[] = [];

    for (const type of assessmentTypes) {
      const window = ruleByType.get(type) ?? fallbackAssessmentWindows[type];

      for (const child of children) {
        if (assessedKeys.has(`${type}:${child.id}`)) {
          continue;
        }

        const { eligible, currentAge } = isEligibleForAssessmentAlarm(
          child,
          today,
          window.minDays,
          window.maxDays
        );
        if (!eligible || currentAge === null) {
          continue;
        }

        const daysUntilDue = Math.floor(window.maxDays - currentAge);
        if (daysUntilDue < 0 || daysUntilDue > 15) {
          continue;
        }

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
      if (a.daysUntilDue !== b.daysUntilDue) {
        return a.daysUntilDue - b.daysUntilDue;
      }
      if (a.assessmentType !== b.assessmentType) {
        return a.assessmentType - b.assessmentType;
      }
      return a.childName.localeCompare(b.childName);
    });

    return { success: true, data: alarms };
  } catch (error) {
    console.error("Failed to fetch assessment due alarms:", error);
    return { success: false, error: "Failed to fetch assessment due alarms" };
  }
}

// ---------------------------------------------------------------------------
// getAlarmOverviewCounts — counts per alarm type for overview page
// ---------------------------------------------------------------------------

export interface AlarmCountItem {
  type: string;
  label: string;
  count: number;
  href: string;
  color: string;
  icon: string;
}

export async function getAlarmOverviewCounts(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      birthdayCount,
      assessmentCount,
      vaccinationCount,
      medicalCount,
      medicineCount,
      eventCount,
      insuranceCount,
      paymentCount,
      requestCount,
      contractCount,
      otherCount,
    ] = await Promise.all([
      // Birthdays: children with birthday in the next 30 days
      db.child.findMany({
        where: { isActive: true, dateOfBirth: { not: null }, branch: { organizationId: orgId } },
        select: { dateOfBirth: true },
      }).then((children) => {
        return children.filter((c) => {
          const dob = c.dateOfBirth!;
          const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (next < today) next.setFullYear(today.getFullYear() + 1);
          return next <= thirtyDaysFromNow;
        }).length;
      }),
      // Assessments: upcoming assessment dates
      db.assessmentDate.count({
        where: { scheduledDate: { gte: today }, branch: { organizationId: orgId } },
      }),
      // Vaccinations: overdue
      db.vaccination.count({
        where: { nextDueDate: { lt: today }, child: { branch: { organizationId: orgId } } },
      }),
      // Medical: active alarms
      db.alarm.count({
        where: { type: "MEDICAL", isActive: true, branch: { organizationId: orgId } },
      }),
      // Medicine: active alarms
      db.alarm.count({
        where: { type: "MEDICINE", isActive: true, branch: { organizationId: orgId } },
      }),
      // Events: upcoming active events
      db.event.count({
        where: { isActive: true, date: { gte: today }, branch: { organizationId: orgId } },
      }),
      // Insurance: active alarms
      db.alarm.count({
        where: { type: "INSURANCE", isActive: true, branch: { organizationId: orgId } },
      }),
      // Payments: overdue
      db.payment.count({
        where: {
          status: "OVERDUE",
          deletedAt: null,
          child: { branch: { organizationId: orgId } },
        },
      }),
      // Requests: active alarms
      db.alarm.count({
        where: { type: "REQUEST", isActive: true, branch: { organizationId: orgId } },
      }),
      // Contracts: active alarms
      db.alarm.count({
        where: { type: "CONTRACT", isActive: true, branch: { organizationId: orgId } },
      }),
      // Other: active alarms
      db.alarm.count({
        where: { type: "OTHER", isActive: true, branch: { organizationId: orgId } },
      }),
    ]);

    const counts: AlarmCountItem[] = [
      { type: "BIRTHDAY", label: "Birthdays", count: birthdayCount, href: "/alarms/birthdays", color: "bg-pink-100 text-pink-600", icon: "Cake" },
      { type: "ASSESSMENT", label: "Assessments", count: assessmentCount, href: "/alarms/assessments", color: "bg-teal-100 text-teal-600", icon: "ClipboardCheck" },
      { type: "VACCINATION", label: "Vaccinations", count: vaccinationCount, href: "/alarms/vaccinations", color: "bg-blue-100 text-blue-600", icon: "Syringe" },
      { type: "MEDICAL", label: "Medical", count: medicalCount, href: "/alarms/medical", color: "bg-red-100 text-red-600", icon: "Stethoscope" },
      { type: "MEDICINE", label: "Medicine", count: medicineCount, href: "/alarms/medicine", color: "bg-purple-100 text-purple-600", icon: "Pill" },
      { type: "EVENT", label: "Events", count: eventCount, href: "/alarms/events", color: "bg-teal-100 text-teal-600", icon: "CalendarDays" },
      { type: "INSURANCE", label: "Insurance", count: insuranceCount, href: "/alarms/insurance", color: "bg-blue-100 text-blue-600", icon: "Shield" },
      { type: "PAYMENT", label: "Payments", count: paymentCount, href: "/alarms/payments", color: "bg-amber-100 text-amber-600", icon: "DollarSign" },
      { type: "REQUEST", label: "Requests", count: requestCount, href: "/alarms/requests", color: "bg-blue-100 text-blue-600", icon: "MessageSquare" },
      { type: "CONTRACT", label: "Contracts", count: contractCount, href: "/alarms/contracts", color: "bg-teal-100 text-teal-600", icon: "FileText" },
      { type: "OTHER", label: "Others", count: otherCount, href: "/alarms/others", color: "bg-orange-100 text-orange-600", icon: "Bell" },
    ];

    const totalActive = counts.reduce((sum, c) => sum + c.count, 0);

    return { success: true, data: { counts, totalActive } };
  } catch (error) {
    console.error("Failed to fetch alarm overview counts:", error);
    return { success: false, error: "Failed to fetch alarm overview counts" };
  }
}

// ---------------------------------------------------------------------------
// getNotifications — for a specific user
// ---------------------------------------------------------------------------

export async function getNotifications(params: {
  userId?: string;
  isRead?: boolean;
  limit?: number;
} = {}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = params.userId ?? session.user.id;
    const limit = params.limit ?? 20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (typeof params.isRead === "boolean") where.isRead = params.isRead;

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { success: true, data: { notifications, unreadCount } };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// ---------------------------------------------------------------------------
// getUnreadNotificationCount — lightweight count for header badge
// ---------------------------------------------------------------------------

export async function getUnreadNotificationCount(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, data: 0 };
    }

    const count = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return { success: true, data: 0 };
  }
}

// ---------------------------------------------------------------------------
// markNotificationRead
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// ---------------------------------------------------------------------------
// markAllNotificationsRead
// ---------------------------------------------------------------------------

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

// ---------------------------------------------------------------------------
// getHeaderAlarmCounts — lightweight counts for header notification badges
// ---------------------------------------------------------------------------

export async function getHeaderAlarmCounts(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [birthdayResult, assessmentCount, medicalCount, totalAlarmCount] =
      await Promise.all([
        // Birthdays in next 7 days — single DB count with org filter
        db.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM children
          WHERE "isActive" = true AND "dateOfBirth" IS NOT NULL
          AND "branchId" IN (SELECT id FROM branches WHERE "organizationId" = cast(${orgId} as uuid))
          AND (EXTRACT(MONTH FROM "dateOfBirth") * 100 + EXTRACT(DAY FROM "dateOfBirth"))
          IN (
            SELECT EXTRACT(MONTH FROM d) * 100 + EXTRACT(DAY FROM d)
            FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day') AS d
          )
        `,
        // Upcoming assessments
        db.assessmentDate.count({
          where: { scheduledDate: { gte: today }, branch: { organizationId: orgId } },
        }),
        // Active medical alarms
        db.alarm.count({
          where: { type: "MEDICAL", isActive: true, branch: { organizationId: orgId } },
        }),
        // Total active alarms across all types
        db.alarm.count({
          where: { isActive: true, branch: { organizationId: orgId } },
        }),
      ]);

    const birthdayCount = Number(birthdayResult[0]?.count ?? 0);

    return {
      success: true,
      data: {
        birthdays: birthdayCount,
        assessments: assessmentCount,
        medical: medicalCount,
        totalAlarms: totalAlarmCount,
      },
    };
  } catch (error) {
    console.error("Failed to fetch header alarm counts:", error);
    return {
      success: true,
      data: { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 },
    };
  }
}
