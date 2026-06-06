import { db } from "@/lib/db";

export interface PaymentGenerationSummary {
  branchesScanned: number;
  reminderGroupsMatched: number;
  remindersMatched: number;
  alarmsCreated: number;
  parentRecipientsMatched: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedMissingChild: number;
}

interface ReminderGroup {
  childId: string;
  childName: string;
  familyName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string | null;
  dueDate: Date;
  dueDateKey: string;
  reminderIds: string[];
  legacyReminderIds: number[];
  fees: string[];
  amountTotal: number;
  currency: string;
  parentUserCount: number;
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
    alarmsCreated: 0,
    parentRecipientsMatched: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedMissingChild: 0,
  };
}

function groupKey(childId: string, dueDate: Date) {
  return `${childId}:${dateKey(dueDate)}`;
}

function makeFeeList(fees: string[]) {
  return Array.from(new Set(fees)).join(", ");
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

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: "alarm.payment.enabled",
    },
  });
  const enabledByBranch = new Map(settings.map((setting) => [setting.branchId, setting.value]));
  const enabledBranchIds = branchIds.filter((id) => enabledByBranch.get(id) !== "false");
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const reminders = await db.paymentReminder.findMany({
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
  });

  const groups = new Map<string, ReminderGroup>();
  for (const reminder of reminders) {
    if (!reminder.child || !reminder.childId || !reminder.dueDate) {
      summary.skippedMissingChild += 1;
      continue;
    }

    const key = groupKey(reminder.childId, reminder.dueDate);
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
      familyName: reminder.child.lastName,
      branchId: reminder.child.branchId,
      branchName: reminder.child.branch.name,
      classId: reminder.child.classId,
      className: reminder.child.class?.name ?? null,
      dueDate: reminder.dueDate,
      dueDateKey: dateKey(reminder.dueDate),
      reminderIds: [reminder.id],
      legacyReminderIds: reminder.legacyId !== null ? [reminder.legacyId] : [],
      fees: [fee],
      amountTotal: amount,
      currency,
      parentUserCount: reminder.child.parentUsers.length,
    });
  }

  const candidates = Array.from(groups.values());
  summary.reminderGroupsMatched = candidates.length;
  summary.remindersMatched = reminders.length;
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
    const dueDate = reminderDueDate(alarm.legacyData) ?? (alarm.dueDate ? dateKey(alarm.dueDate) : null);
    if (type === "paid" && dueDate) {
      existingKeys.add(`${alarm.referenceId}:${dueDate}`);
    }
  }

  const template = await db.notificationTemplate.findUnique({
    where: {
      organizationId_category: {
        organizationId: params.organizationId,
        category: "PAYMENT",
      },
    },
  });
  const templateEnabled = template?.enabled ?? true;
  const bodyTemplate =
    template?.body ||
    "Payment reminder for [[family_name]]: [[fees]] due on [[payment_date]].";

  for (const candidate of candidates) {
    const key = `${candidate.childId}:${candidate.dueDateKey}`;
    if (existingKeys.has(key)) {
      summary.skippedExisting += 1;
      continue;
    }

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
    const message = templateEnabled
      ? renderNotificationText(bodyTemplate, variables)
      : `Payment reminder for ${candidate.familyName}: ${feeList} due on ${candidate.dueDateKey}.`;

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
          sourceReminderTable: "newpayment",
          modernGenerator: "generatePaymentAlarms",
          legacyMethod: "Data::AlarmsPaidPayments",
          paymentAlarmType: "Paid",
          childId: candidate.childId,
          classId: candidate.classId,
          paymentReminderIds: candidate.reminderIds,
          legacyPaymentReminderIds: candidate.legacyReminderIds,
          fees: candidate.fees,
          familyName: candidate.familyName,
          paymentDate: candidate.dueDateKey,
          amountTotal: candidate.amountTotal,
          currency: candidate.currency,
          parentRecipientCount: candidate.parentUserCount,
          href: "alarmsPayments.php",
        },
      },
    });
    existingKeys.add(key);
    summary.alarmsCreated += 1;
  }

  return summary;
}
