"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ActionableAlarm {
  id: string;
  type: string;
  message: string;
  dueDate: string | null;
  isOverdue: boolean;
  childName: string | null;
  childId: string | null;
  amount: number | null;
  actionUrl: string | null;
}

export interface ActionableAlarmGroups {
  critical: ActionableAlarm[];
  warning: ActionableAlarm[];
  info: ActionableAlarm[];
  totalActive: number;
}

// Urgency mapping (same as alarms-overview-client)
const urgencyMap: Record<string, "critical" | "warning" | "info"> = {
  VACCINATION: "critical",
  MEDICAL: "critical",
  MEDICINE: "critical",
  PAYMENT: "critical",
  INSURANCE: "warning",
  CONTRACT: "warning",
  ASSESSMENT: "warning",
  REQUEST: "warning",
  BIRTHDAY: "info",
  EVENT: "info",
  OTHER: "info",
};

export async function getActionableAlarms(): Promise<ActionableAlarmGroups> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Fetch actual alarm records + derived data in parallel
  const [activeAlarms, overdueVaccinations, birthdayChildren] =
    await Promise.all([
      db.alarm.findMany({
        where: { isActive: true },
        orderBy: { dueDate: "asc" },
        take: 50,
      }),

      db.vaccination.findMany({
        where: { nextDueDate: { lt: today } },
        include: { child: true },
        take: 20,
      }),

      db.child.findMany({
        where: { isActive: true, dateOfBirth: { not: null } },
        select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
      }),
    ]);

  // Overdue payments — separate query wrapped in try/catch because the
  // status column may not exist in the database yet
  let overduePayments: Array<{
    id: string;
    childId: string;
    amount: { toNumber(): number };
    date: Date;
    child: { id: string; firstName: string; lastName: string };
  }> = [];
  try {
    const raw = await db.payment.findMany({
      where: { status: "OVERDUE" },
      include: { child: true },
      take: 20,
    });
    overduePayments = raw as typeof overduePayments;
  } catch {
    // Column missing — skip overdue payments
  }

  const result: ActionableAlarmGroups = {
    critical: [],
    warning: [],
    info: [],
    totalActive: 0,
  };

  // Batch-resolve child names for alarms referencing children
  const childRefIds = activeAlarms
    .filter((a) => a.referenceId && a.referenceType === "Child")
    .map((a) => a.referenceId!);

  const childNameMap = new Map<string, { firstName: string; lastName: string }>();
  if (childRefIds.length > 0) {
    const children = await db.child.findMany({
      where: { id: { in: childRefIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    for (const c of children) {
      childNameMap.set(c.id, { firstName: c.firstName, lastName: c.lastName });
    }
  }

  // Process active alarms from alarm table
  for (const alarm of activeAlarms) {
    const isOverdue = alarm.dueDate ? alarm.dueDate < today : false;
    const urgency = urgencyMap[alarm.type] ?? "info";

    let childName: string | null = null;
    let childId: string | null = null;
    if (alarm.referenceId && alarm.referenceType === "Child") {
      const child = childNameMap.get(alarm.referenceId);
      if (child) {
        childName = `${child.firstName} ${child.lastName}`;
        childId = alarm.referenceId;
      }
    }

    result[urgency].push({
      id: alarm.id,
      type: alarm.type,
      message: alarm.message ?? alarm.type,
      dueDate: alarm.dueDate?.toISOString().slice(0, 10) ?? null,
      isOverdue,
      childName,
      childId,
      amount: null,
      actionUrl: childId ? `/children/${childId}/dashboard` : null,
    });
  }

  // Process overdue vaccinations
  for (const v of overdueVaccinations) {
    result.critical.push({
      id: `vax-${v.id}`,
      type: "VACCINATION",
      message: `${v.vaccineName} overdue for ${v.child.firstName} ${v.child.lastName}`,
      dueDate: v.nextDueDate?.toISOString().slice(0, 10) ?? null,
      isOverdue: true,
      childName: `${v.child.firstName} ${v.child.lastName}`,
      childId: v.child.id,
      amount: null,
      actionUrl: `/children/${v.child.id}/medical`,
    });
  }

  // Process overdue payments
  for (const p of overduePayments) {
    result.critical.push({
      id: `pay-${p.id}`,
      type: "PAYMENT",
      message: `$${p.amount.toNumber().toFixed(2)} overdue for ${p.child.firstName} ${p.child.lastName}`,
      dueDate: p.date.toISOString().slice(0, 10),
      isOverdue: true,
      childName: `${p.child.firstName} ${p.child.lastName}`,
      childId: p.child.id,
      amount: p.amount.toNumber(),
      actionUrl: `/children/${p.child.id}/accounting`,
    });
  }

  // Process birthdays
  const birthdayList = birthdayChildren.filter((c) => {
    const dob = c.dateOfBirth!;
    const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return next <= thirtyDaysFromNow;
  });

  for (const c of birthdayList) {
    const dob = c.dateOfBirth!;
    const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const daysUntil = Math.ceil(
      (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    result.info.push({
      id: `bday-${c.id}`,
      type: "BIRTHDAY",
      message:
        daysUntil === 0
          ? `${c.firstName} ${c.lastName}'s birthday is today!`
          : `${c.firstName} ${c.lastName}'s birthday in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
      dueDate: next.toISOString().slice(0, 10),
      isOverdue: false,
      childName: `${c.firstName} ${c.lastName}`,
      childId: c.id,
      amount: null,
      actionUrl: `/children/${c.id}/dashboard`,
    });
  }

  result.totalActive =
    result.critical.length + result.warning.length + result.info.length;

  return result;
}

export async function snoozeAlarm(
  id: string,
  days: number
): Promise<{ success: boolean }> {
  try {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);

    await db.alarm.update({
      where: { id },
      data: { dueDate: newDate },
    });

    revalidatePath("/alarms");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function resolveAlarm(
  id: string
): Promise<{ success: boolean }> {
  try {
    await db.alarm.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/alarms");
    return { success: true };
  } catch {
    return { success: false };
  }
}
