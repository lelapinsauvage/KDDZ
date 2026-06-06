import { db } from "@/lib/db";
import type { PaymentCategory, PaymentStatus } from "@/generated/prisma/enums";

type PaymentAlarmLegacyType = "Paid" | "Before" | "After";

export interface PaymentGenerationSummary {
  branchesScanned: number;
  reminderGroupsMatched: number;
  remindersMatched: number;
  duePaymentGroupsMatched: number;
  duePaymentsMatched: number;
  alarmsCreated: number;
  paidAlarmsCreated: number;
  beforeAlarmsCreated: number;
  afterAlarmsCreated: number;
  parentRecipientsMatched: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedMissingChild: number;
  skippedNoEligibleFees: number;
}

interface PaymentAlarmCandidate {
  childId: string;
  childName: string;
  familyName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string | null;
  dueDate: Date;
  dueDateKey: string;
  alarmType: PaymentAlarmLegacyType;
  legacyMethod: string;
  reminderIds: string[];
  legacyReminderIds: number[];
  paymentIds: string[];
  legacyPaymentIds: number[];
  fees: string[];
  amountTotal: number;
  currency: string;
  parentUserCount: number;
}

interface PaymentTemplateConfig {
  category: string;
  subject: string;
  body: string;
  enabled: boolean;
  legacySubjectKey: string;
  legacySettingKey: string;
}

const DUE_PAYMENT_CATEGORIES: PaymentCategory[] = [
  "MONTHLY",
  "BUS",
  "XTRA_TIME",
];
const UNPAID_PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "OVERDUE"];
const PAYMENT_TEMPLATE_CATEGORIES = [
  "PAYMENT",
  "PAYMENT_BEFORE",
  "PAYMENT_AFTER",
];
const LEGACY_PAYMENT_SETTING_KEYS = [
  "account-remind-before",
  "account-remind-after",
  "email-accounting-subj",
  "email-accounting-msg-paid",
  "email-accounting-msg-before",
  "email-accounting-msg-after",
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((startOfToday(end).getTime() - startOfToday(start).getTime()) / 86_400_000);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function reminderLegacyType(legacyData: unknown) {
  const data = asRecord(legacyData);
  const rawType = data?.paymentAlarmType ?? data?.type;
  return typeof rawType === "string" ? rawType.trim().toLowerCase() : null;
}

function reminderDueDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const rawDueDate = data?.paymentDate ?? data?.dueDate ?? data?.to;
  if (typeof rawDueDate === "string" && rawDueDate.trim() !== "") {
    return rawDueDate.trim().slice(0, 10);
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

function categoryLabel(value: string) {
  const labels: Record<string, string> = {
    REGISTRATION: "Registration",
    MONTHLY: "Monthly",
    BUS: "Bus",
    XTRA_TIME: "Extra Time",
    FOOD: "Food",
    OTHER: "Other",
  };
  return labels[value] ?? value;
}

function emptySummary(): PaymentGenerationSummary {
  return {
    branchesScanned: 0,
    reminderGroupsMatched: 0,
    remindersMatched: 0,
    duePaymentGroupsMatched: 0,
    duePaymentsMatched: 0,
    alarmsCreated: 0,
    paidAlarmsCreated: 0,
    beforeAlarmsCreated: 0,
    afterAlarmsCreated: 0,
    parentRecipientsMatched: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedMissingChild: 0,
    skippedNoEligibleFees: 0,
  };
}

function parsePositiveInteger(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

function normalizeLegacyType(value: PaymentAlarmLegacyType | string) {
  return value.trim().toLowerCase();
}

function candidateKey(
  childId: string,
  dueDate: Date,
  alarmType: PaymentAlarmLegacyType | string,
) {
  return `${childId}:${normalizeLegacyType(alarmType)}:${dateKey(dueDate)}`;
}

function makeFeeList(fees: string[]) {
  return Array.from(new Set(fees)).join(", ");
}

function capitalize(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function isTruthyLegacyValue(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
}

function isEligibleDuePaymentFee(
  category: PaymentCategory,
  child: { busAttendance: string | null; lunchIncluded: boolean; isActive: boolean },
) {
  if (!DUE_PAYMENT_CATEGORIES.includes(category)) return false;
  if (category === "BUS") return isTruthyLegacyValue(child.busAttendance);
  if (category === "MONTHLY") return child.isActive && child.lunchIncluded;
  return true;
}

function chooseLegacySettingValue(
  rows: Array<{ sourceDatabase: string; settingKey: string; settingValue: string | null }>,
  key: string,
) {
  const candidates = rows.filter(
    (row) => row.settingKey === key && row.settingValue?.trim(),
  );
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    candidates[0]
  ).settingValue!.trim();
}

function defaultPaymentTemplate(alarmType: PaymentAlarmLegacyType): PaymentTemplateConfig {
  if (alarmType === "Before") {
    return {
      category: "PAYMENT_BEFORE",
      subject: "Payment Due Date",
      body: "Dear Mr and Mrs [[family_name]], your payment ([[fees]]) is due on [[payment_date]].",
      enabled: true,
      legacySubjectKey: "email-accounting-subj",
      legacySettingKey: "email-accounting-msg-before",
    };
  }

  if (alarmType === "After") {
    return {
      category: "PAYMENT_AFTER",
      subject: "Payment Due Date",
      body: "Dear Mr and Mrs [[family_name]], your [[fees]] payment was due on [[payment_date]].",
      enabled: true,
      legacySubjectKey: "email-accounting-subj",
      legacySettingKey: "email-accounting-msg-after",
    };
  }

  return {
    category: "PAYMENT",
    subject: "Payment Due Date",
    body: "Payment reminder for [[family_name]]: [[fees]] due on [[payment_date]].",
    enabled: true,
    legacySubjectKey: "email-accounting-subj",
    legacySettingKey: "email-accounting-msg-paid",
  };
}

function resolveTemplate(
  alarmType: PaymentAlarmLegacyType,
  templateByCategory: Map<string, { enabled: boolean; subject: string; body: string }>,
  legacySettings: Map<string, string>,
) {
  const defaults = defaultPaymentTemplate(alarmType);
  const modern = templateByCategory.get(defaults.category);
  return {
    category: defaults.category,
    subject:
      modern?.subject ||
      legacySettings.get(defaults.legacySubjectKey) ||
      defaults.subject,
    body: modern?.body || legacySettings.get(defaults.legacySettingKey) || defaults.body,
    enabled: modern?.enabled ?? defaults.enabled,
    legacySubjectKey: defaults.legacySubjectKey,
    legacySettingKey: defaults.legacySettingKey,
  };
}

function incrementCreated(summary: PaymentGenerationSummary, alarmType: PaymentAlarmLegacyType) {
  summary.alarmsCreated += 1;
  if (alarmType === "Paid") summary.paidAlarmsCreated += 1;
  if (alarmType === "Before") summary.beforeAlarmsCreated += 1;
  if (alarmType === "After") summary.afterAlarmsCreated += 1;
}

export async function generatePaymentAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<PaymentGenerationSummary> {
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

  const [settings, legacySettingRows] = await Promise.all([
    db.settings.findMany({
      where: {
        branchId: { in: branchIds },
        key: {
          in: [
            "alarm.payment.enabled",
            "alarm.payment.threshold",
            "alarm.payment.beforeDays",
            "alarm.payment.afterDays",
          ],
        },
      },
    }),
    db.legacySetting.findMany({
      where: {
        legacyTable: "login_settings",
        settingKey: { in: LEGACY_PAYMENT_SETTING_KEYS },
      },
      select: { sourceDatabase: true, settingKey: true, settingValue: true },
      orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
    }),
  ]);

  const legacySettings = new Map<string, string>();
  for (const key of LEGACY_PAYMENT_SETTING_KEYS) {
    const value = chooseLegacySettingValue(legacySettingRows, key);
    if (value) legacySettings.set(key, value);
  }

  const legacyBeforeDays = parsePositiveInteger(
    legacySettings.get("account-remind-before"),
    1,
  );
  const legacyAfterDays = parsePositiveInteger(
    legacySettings.get("account-remind-after"),
    10,
  );

  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }

  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.payment.enabled"];
    return enabled === undefined || enabled === "true";
  });
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const beforeDaysByBranch = new Map<string, number>();
  const afterDaysByBranch = new Map<string, number>();
  for (const id of enabledBranchIds) {
    const branchSettings = settingsByBranch.get(id);
    beforeDaysByBranch.set(
      id,
      parsePositiveInteger(
        branchSettings?.["alarm.payment.beforeDays"] ??
          branchSettings?.["alarm.payment.threshold"],
        legacyBeforeDays,
      ),
    );
    afterDaysByBranch.set(
      id,
      parsePositiveInteger(branchSettings?.["alarm.payment.afterDays"], legacyAfterDays),
    );
  }

  const maxBeforeWindow = Math.max(0, ...beforeDaysByBranch.values(), 7);
  const maxAfterWindow = Math.max(20, ...afterDaysByBranch.values());
  const duePaymentsFrom = addDays(today, -maxAfterWindow);
  const duePaymentsTo = addDays(today, maxBeforeWindow);

  const [reminders, duePayments] = await Promise.all([
    db.paymentReminder.findMany({
      where: {
        sent: false,
        dueDate: { gte: today },
        childId: { not: null },
        child: {
          isActive: true,
          isDraft: false,
          branchId: { in: enabledBranchIds },
          branch: { organizationId: params.organizationId },
        },
      },
      include: {
        child: {
          include: {
            branch: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            parentUsers: { where: { isActive: true }, select: { id: true } },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    db.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: UNPAID_PAYMENT_STATUSES },
        category: { in: DUE_PAYMENT_CATEGORIES },
        dateTo: { gte: duePaymentsFrom, lte: duePaymentsTo },
        child: {
          isActive: true,
          isDraft: false,
          branchId: { in: enabledBranchIds },
          branch: { organizationId: params.organizationId },
        },
      },
      include: {
        child: {
          include: {
            branch: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            parentUsers: { where: { isActive: true }, select: { id: true } },
          },
        },
      },
      orderBy: [{ dateTo: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const groups = new Map<string, PaymentAlarmCandidate>();

  for (const reminder of reminders) {
    if (!reminder.child || !reminder.childId || !reminder.dueDate) {
      summary.skippedMissingChild += 1;
      continue;
    }

    const key = candidateKey(reminder.childId, reminder.dueDate, "Paid");
    const existing = groups.get(key);
    const fee = categoryLabel(reminder.category);
    const amount = reminder.amount ? Number(reminder.amount) : 0;
    const currency = reminder.currency || "";

    if (existing) {
      existing.reminderIds.push(reminder.id);
      if (reminder.legacyId !== null) existing.legacyReminderIds.push(reminder.legacyId);
      existing.fees.push(fee);
      existing.amountTotal += amount;
      if (!existing.currency && reminder.currency) existing.currency = reminder.currency;
      continue;
    }

    groups.set(key, {
      childId: reminder.childId,
      childName: `${reminder.child.firstName} ${reminder.child.lastName}`,
      familyName: capitalize(reminder.child.lastName),
      branchId: reminder.child.branchId,
      branchName: reminder.child.branch.name,
      classId: reminder.child.classId,
      className: reminder.child.class?.name ?? null,
      dueDate: reminder.dueDate,
      dueDateKey: dateKey(reminder.dueDate),
      alarmType: "Paid",
      legacyMethod: "Data::AlarmsPaidPayments",
      reminderIds: [reminder.id],
      legacyReminderIds: reminder.legacyId !== null ? [reminder.legacyId] : [],
      paymentIds: [],
      legacyPaymentIds: [],
      fees: [fee],
      amountTotal: amount,
      currency,
      parentUserCount: reminder.child.parentUsers.length,
    });
  }

  summary.reminderGroupsMatched = Array.from(groups.values()).filter(
    (candidate) => candidate.alarmType === "Paid",
  ).length;
  summary.remindersMatched = reminders.length;

  for (const payment of duePayments) {
    if (!payment.dateTo) continue;
    if (!isEligibleDuePaymentFee(payment.category, payment.child)) {
      summary.skippedNoEligibleFees += 1;
      continue;
    }

    const daysUntilDue = daysBetween(today, payment.dateTo);
    let alarmType: PaymentAlarmLegacyType | null = null;
    let legacyMethod = "";

    if (
      daysUntilDue >= 0 &&
      daysUntilDue === beforeDaysByBranch.get(payment.child.branchId)
    ) {
      alarmType = "Before";
      legacyMethod = "Data::NotifyBeforePayment";
    }

    const daysAfterDue = -daysUntilDue;
    if (
      daysAfterDue > 0 &&
      daysAfterDue === afterDaysByBranch.get(payment.child.branchId)
    ) {
      alarmType = "After";
      legacyMethod = "Data::NotifyAfterPayment";
    }

    if (!alarmType) continue;

    const key = candidateKey(payment.childId, payment.dateTo, alarmType);
    const existing = groups.get(key);
    const fee = categoryLabel(payment.category);
    const amount = Number(payment.amount);

    summary.duePaymentsMatched += 1;

    if (existing) {
      existing.paymentIds.push(payment.id);
      if (payment.legacyId !== null) existing.legacyPaymentIds.push(payment.legacyId);
      existing.fees.push(fee);
      existing.amountTotal += amount;
      if (!existing.currency && payment.currency) existing.currency = payment.currency;
      continue;
    }

    groups.set(key, {
      childId: payment.childId,
      childName: `${payment.child.firstName} ${payment.child.lastName}`,
      familyName: capitalize(payment.child.lastName),
      branchId: payment.child.branchId,
      branchName: payment.child.branch.name,
      classId: payment.child.classId,
      className: payment.child.class?.name ?? null,
      dueDate: payment.dateTo,
      dueDateKey: dateKey(payment.dateTo),
      alarmType,
      legacyMethod,
      reminderIds: [],
      legacyReminderIds: [],
      paymentIds: [payment.id],
      legacyPaymentIds: payment.legacyId !== null ? [payment.legacyId] : [],
      fees: [fee],
      amountTotal: amount,
      currency: payment.currency,
      parentUserCount: payment.child.parentUsers.length,
    });
  }

  const candidates = Array.from(groups.values());
  summary.duePaymentGroupsMatched = candidates.filter(
    (candidate) => candidate.alarmType !== "Paid",
  ).length;
  summary.parentRecipientsMatched = candidates.reduce(
    (sum, candidate) => sum + candidate.parentUserCount,
    0,
  );
  if (candidates.length === 0) return summary;

  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "PAYMENT",
      referenceType: "Child",
      referenceId: { in: candidates.map((candidate) => candidate.childId) },
      isActive: true,
    },
    select: { referenceId: true, dueDate: true, legacyData: true },
  });
  const existingKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const type = reminderLegacyType(alarm.legacyData);
    const dueDate =
      reminderDueDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (type && dueDate) {
      existingKeys.add(`${alarm.referenceId}:${type}:${dueDate}`);
    }
  }

  const templates = await db.notificationTemplate.findMany({
    where: {
      organizationId: params.organizationId,
      category: { in: PAYMENT_TEMPLATE_CATEGORIES },
    },
  });
  const templateByCategory = new Map(
    templates.map((template) => [
      template.category,
      {
        enabled: template.enabled,
        subject: template.subject,
        body: template.body,
      },
    ]),
  );

  for (const candidate of candidates) {
    const key = candidateKey(candidate.childId, candidate.dueDate, candidate.alarmType);
    if (existingKeys.has(key)) {
      summary.skippedExisting += 1;
      continue;
    }

    const template = resolveTemplate(
      candidate.alarmType,
      templateByCategory,
      legacySettings,
    );
    const feeList = makeFeeList(candidate.fees);
    const variables = {
      child_name: candidate.childName,
      family_name: candidate.familyName,
      parent_name: "Parent",
      branch_name: candidate.branchName,
      class_name: candidate.className ?? "",
      fees: feeList,
      payment_date: candidate.dueDateKey,
      date: candidate.dueDateKey,
      amount: candidate.amountTotal.toFixed(2),
      currency: candidate.currency,
    };
    const message = template.enabled
      ? renderNotificationText(template.body, variables)
      : `Payment ${candidate.alarmType.toLowerCase()} reminder for ${candidate.familyName}: ${feeList} due on ${candidate.dueDateKey}.`;

    await db.alarm.create({
      data: {
        type: "PAYMENT",
        referenceId: candidate.childId,
        referenceType: "Child",
        message,
        dueDate: candidate.dueDate,
        branchId: candidate.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_payments",
          sourceReminderTable:
            candidate.alarmType === "Paid" ? "newpayment" : undefined,
          sourcePaymentTable:
            candidate.alarmType === "Paid" ? undefined : "t_payments",
          modernGenerator: "generatePaymentAlarms",
          legacyMethod: candidate.legacyMethod,
          paymentAlarmType: candidate.alarmType,
          childId: candidate.childId,
          classId: candidate.classId,
          paymentReminderIds: candidate.reminderIds,
          legacyPaymentReminderIds: candidate.legacyReminderIds,
          paymentIds: candidate.paymentIds,
          legacyPaymentIds: candidate.legacyPaymentIds,
          fees: candidate.fees,
          familyName: candidate.familyName,
          paymentDate: candidate.dueDateKey,
          amountTotal: candidate.amountTotal,
          currency: candidate.currency,
          parentRecipientCount: candidate.parentUserCount,
          templateCategory: template.category,
          legacyTemplateSettingKey: template.legacySettingKey,
          beforeDays: beforeDaysByBranch.get(candidate.branchId),
          afterDays: afterDaysByBranch.get(candidate.branchId),
          modernStatusFilter:
            candidate.alarmType === "Paid" ? undefined : UNPAID_PAYMENT_STATUSES,
          href: "alarmsPayments.php",
        },
      },
    });
    existingKeys.add(key);
    incrementCreated(summary, candidate.alarmType);
  }

  return summary;
}
