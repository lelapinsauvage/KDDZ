"use server";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { getOrgBranchIds } from "@/lib/verify-org-access";

// ── Types ──────────────────────────────────────────

export interface ActionItems {
  pendingAbsences: Array<{
    id: string;
    childName: string;
    childId: string;
    date: string;
    reason: string | null;
  }>;
  overduePayments: Array<{
    childId: string;
    childName: string;
    totalOverdue: number;
    oldestDate: string;
  }>;
  missingReportsByClass: Array<{
    className: string;
    count: number;
  }>;
  draftChildren: Array<{
    id: string;
    childName: string;
    createdAt: string;
  }>;
}

export type PillarStatus = "green" | "amber" | "red";

export interface MorningBriefing {
  attendance: { present: number; total: number; status: PillarStatus };
  reports: { submitted: number; total: number; status: PillarStatus };
  staff: { present: number; total: number; status: PillarStatus };
  finance: { overdueCount: number; overdueAmount: number; status: PillarStatus };
  health: { issues: number; status: PillarStatus };

  actionItems: ActionItems;
  totalAttentionItems: number;

  insights: Array<{ text: string; type: "positive" | "neutral" | "warning" }>;

  todayMenu: {
    breakfast: string | null;
    lunch: string | null;
    dessert: string | null;
    snack: string | null;
  };
  weeklyAttendance: Array<{ day: string; present: number; total: number }>;
}

// ── Main briefing function ─────────────────────────

export async function getMorningBriefing(): Promise<MorningBriefing> {
  const { organizationId: orgId } = await requireOrg();
  const orgBranchIds = await getOrgBranchIds(orgId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Build last 5 working days (Sun-Thu for nursery context, but we'll use last 5 calendar days with data)
  const last5Days: Date[] = [];
  for (let i = 0; i < 7 && last5Days.length < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip Friday and Saturday (weekend)
    const dow = d.getDay();
    if (dow !== 5 && dow !== 6) {
      last5Days.push(d);
    }
  }
  last5Days.reverse(); // oldest first

  const weekStart = last5Days[0] ?? today;
  const weekEnd = tomorrow;

  // One week ago range (for comparisons)
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);

  // 30 days ago (for health pillar — recent draft forms only)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeChildrenCount,
    todayReportCount,
    todayAbsenceCount,
    teacherCount,
    nurseCount,
    doctorCount,
    todayEmployeeAbsences,
    draftMedicalCount,
    activeHealthAlarms,
    todayFoodCalendar,
    weeklyReportCounts,
    lastWeekReportCount,
    lastWeekAbsenceCount,
    thisWeekAbsenceCount,
    chronicAbsences,
    illnessAbsences,
    actionItems,
  ] = await Promise.all([
    // 1. Active children
    db.child.count({ where: { isActive: true, isDraft: false, branch: { organizationId: orgId } } }),

    // 2. Today's daily reports
    db.dailyReport.count({
      where: { reportDate: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
    }),

    // 3. Today's absences
    db.absenceReport.count({
      where: { date: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
    }),

    // 4-5. Staff counts
    db.teacher.count({ where: { isActive: true, branch: { organizationId: orgId } } }),
    db.nurse.count({ where: { isActive: true, branch: { organizationId: orgId } } }),
    db.doctor.count({ where: { isActive: true, branch: { organizationId: orgId } } }),

    // 6. Staff absent today
    db.employeeEvent.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["SICK", "ABSENT", "DAY_OFF"] },
        branchId: { in: orgBranchIds },
      },
    }),

    // 7. Health issues — draft medical forms created in the last 30 days
    db.medicalForm.count({
      where: { status: "DRAFT", createdAt: { gte: thirtyDaysAgo }, child: { branch: { organizationId: orgId } } },
    }),

    // 7b. Active health-related alarms
    db.alarm.count({
      where: {
        isActive: true,
        type: { in: ["MEDICAL", "MEDICINE", "VACCINATION"] },
        branch: { organizationId: orgId },
      },
    }),

    // 8. Food calendar for today
    db.foodCalendar.findMany({
      where: { date: { gte: today, lt: tomorrow }, branch: { organizationId: orgId } },
      include: { food: { select: { name: true } } },
    }),

    // 9. Weekly attendance — report counts per day for last 5 working days
    db.$queryRaw<Array<{ report_date: Date; count: bigint }>>`
      SELECT dr."reportDate" as report_date, COUNT(*) as count
      FROM daily_reports dr
      JOIN children c ON dr."childId" = c.id
      JOIN branches b ON c."branchId" = b.id
      WHERE dr."reportDate" >= ${weekStart} AND dr."reportDate" < ${weekEnd}
        AND b."organizationId" = cast(${orgId} as uuid)
      GROUP BY dr."reportDate"
      ORDER BY dr."reportDate"
    `,

    // 10. Last week data for comparisons
    db.dailyReport.count({
      where: { reportDate: { gte: lastWeekStart, lt: lastWeekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    db.absenceReport.count({
      where: { date: { gte: lastWeekStart, lt: lastWeekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    // This week absences (for comparison)
    db.absenceReport.count({
      where: { date: { gte: weekStart, lt: weekEnd }, child: { branch: { organizationId: orgId } } },
    }),

    // Chronic absences (3+ days this week)
    db.$queryRaw<Array<{ child_id: string; absence_count: bigint }>>`
      SELECT ar."childId" as child_id, COUNT(*) as absence_count
      FROM absence_reports ar
      JOIN children c ON ar."childId" = c.id
      JOIN branches b ON c."branchId" = b.id
      WHERE ar."date" >= ${weekStart} AND ar."date" < ${weekEnd}
        AND b."organizationId" = cast(${orgId} as uuid)
      GROUP BY ar."childId"
      HAVING COUNT(*) >= 3
    `,

    // Illness-related absences this week
    db.absenceReport.count({
      where: {
        date: { gte: weekStart, lt: weekEnd },
        reason: { contains: "sick", mode: "insensitive" },
        child: { branch: { organizationId: orgId } },
      },
    }),

    // 11. Action items (reuse existing logic)
    getActionItems(),
  ]);

  // Overdue payments — separate try/catch since column may not exist
  let overdueCount = 0;
  let overdueAmount = 0;
  try {
    const overduePayments = await db.payment.findMany({
      where: { status: "OVERDUE", child: { branch: { organizationId: orgId } } },
      select: { amount: true },
    });
    overdueCount = overduePayments.length;
    overdueAmount = overduePayments.reduce(
      (sum, p) => sum + (p.amount as unknown as { toNumber(): number }).toNumber(),
      0
    );
  } catch {
    // status column may not exist yet
  }

  // ── Compute pillar statuses ────────────────────

  const totalStaff = teacherCount + nurseCount + doctorCount;
  const staffPresent = totalStaff - todayEmployeeAbsences;
  const healthIssues = draftMedicalCount + activeHealthAlarms;

  const attendancePct = activeChildrenCount > 0
    ? ((todayReportCount + todayAbsenceCount) / activeChildrenCount) * 100
    : 100;
  const reportPct = activeChildrenCount > 0
    ? (todayReportCount / activeChildrenCount) * 100
    : 100;

  const attendance = {
    present: todayReportCount,
    total: activeChildrenCount,
    status: statusFromPct(attendancePct, 90, 75),
  };
  const reports = {
    submitted: todayReportCount,
    total: activeChildrenCount,
    status: statusFromPct(reportPct, 90, 70),
  };
  const staff = {
    present: Math.max(0, staffPresent),
    total: totalStaff,
    status: todayEmployeeAbsences === 0 ? "green" as const
      : todayEmployeeAbsences === 1 ? "amber" as const
      : "red" as const,
  };
  const finance = {
    overdueCount,
    overdueAmount,
    status: overdueCount === 0 ? "green" as const
      : overdueCount <= 2 ? "amber" as const
      : "red" as const,
  };
  const health = {
    issues: healthIssues,
    status: healthIssues === 0 ? "green" as const
      : healthIssues <= 2 ? "amber" as const
      : "red" as const,
  };

  // ── Count total attention items ────────────────

  const totalAttentionItems =
    actionItems.pendingAbsences.length +
    actionItems.overduePayments.length +
    (actionItems.missingReportsByClass.reduce((s, c) => s + c.count, 0) > 0 ? 1 : 0) +
    actionItems.draftChildren.length;

  // ── Insights ───────────────────────────────────

  const insights: MorningBriefing["insights"] = [];

  // Attendance trend
  const thisWeekTotal = todayReportCount; // today's count as proxy
  if (lastWeekReportCount > 0 && last5Days.length > 0) {
    const lastWeekAvg = lastWeekReportCount / 5;
    const diff = ((thisWeekTotal - lastWeekAvg) / lastWeekAvg) * 100;
    if (Math.abs(diff) >= 3) {
      insights.push({
        text: `Attendance ${diff > 0 ? "up" : "down"} ${Math.abs(Math.round(diff))}% vs last week average`,
        type: diff > 0 ? "positive" : "warning",
      });
    }
  }

  // Chronic absences
  const chronicCount = chronicAbsences.length;
  if (chronicCount > 0) {
    insights.push({
      text: `${chronicCount} ${chronicCount === 1 ? "child" : "children"} absent 3+ days this week`,
      type: "warning",
    });
  }

  // Report completion rate
  if (activeChildrenCount > 0) {
    const completionRate = Math.round((todayReportCount / activeChildrenCount) * 100);
    if (lastWeekReportCount > 0) {
      const lastWeekRate = Math.round((lastWeekReportCount / 5 / activeChildrenCount) * 100);
      const diff = completionRate - lastWeekRate;
      if (Math.abs(diff) >= 3) {
        insights.push({
          text: `Report completion: ${completionRate}% (${diff > 0 ? "up from" : "down from"} ${lastWeekRate}% last week)`,
          type: diff >= 0 ? "positive" : "warning",
        });
      } else {
        insights.push({
          text: `Report completion rate: ${completionRate}%`,
          type: completionRate >= 80 ? "positive" : "neutral",
        });
      }
    } else {
      insights.push({
        text: `Report completion rate: ${completionRate}%`,
        type: completionRate >= 80 ? "positive" : "neutral",
      });
    }
  }

  // Illness cluster
  if (illnessAbsences >= 3) {
    insights.push({
      text: `${illnessAbsences} illness-related absences this week`,
      type: "warning",
    });
  }

  // Absence trend
  if (lastWeekAbsenceCount > 0) {
    const diff = thisWeekAbsenceCount - lastWeekAbsenceCount;
    if (Math.abs(diff) >= 2) {
      insights.push({
        text: `Absences ${diff > 0 ? "up" : "down"} by ${Math.abs(diff)} vs last week`,
        type: diff > 0 ? "warning" : "positive",
      });
    }
  }

  // ── Today's menu ───────────────────────────────

  const todayMenu = {
    breakfast: todayFoodCalendar.find((c) => c.mealType === "BREAKFAST")?.food.name ?? null,
    lunch: todayFoodCalendar.find((c) => c.mealType === "LUNCH")?.food.name ?? null,
    dessert: todayFoodCalendar.find((c) => c.mealType === "DESSERT")?.food.name ?? null,
    snack: todayFoodCalendar.find((c) => c.mealType === "SNACK")?.food.name ?? null,
  };

  // ── Weekly attendance ──────────────────────────

  const reportCountMap = new Map(
    weeklyReportCounts.map((r) => [
      new Date(r.report_date).toISOString().slice(0, 10),
      Number(r.count),
    ])
  );

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyAttendance = last5Days.map((d) => ({
    day: dayNames[d.getDay()],
    present: reportCountMap.get(d.toISOString().slice(0, 10)) ?? 0,
    total: activeChildrenCount,
  }));

  return {
    attendance,
    reports,
    staff,
    finance,
    health,
    actionItems,
    totalAttentionItems,
    insights,
    todayMenu,
    weeklyAttendance,
  };
}

// ── Helpers ──────────────────────────────────────

function statusFromPct(pct: number, greenThreshold: number, amberThreshold: number): PillarStatus {
  if (pct >= greenThreshold) return "green";
  if (pct >= amberThreshold) return "amber";
  return "red";
}

// ── Action items (internal helper, also exported for reuse) ──

export async function getActionItems(): Promise<ActionItems> {
  const { organizationId: orgId } = await requireOrg();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingAbsencesRaw, activeChildren, todayReports, draftChildrenRaw] =
    await Promise.all([
      db.absenceReport.findMany({
        where: { status: "PENDING", child: { branch: { organizationId: orgId } } },
        include: { child: true },
        take: 5,
        orderBy: { date: "desc" },
      }),

      db.child.findMany({
        where: { isActive: true, isDraft: false, branch: { organizationId: orgId } },
        select: { id: true, class: { select: { name: true } } },
      }),

      db.dailyReport.findMany({
        where: { reportDate: { gte: today, lt: tomorrow }, child: { branch: { organizationId: orgId } } },
        select: { childId: true },
      }),

      db.child.findMany({
        where: { isDraft: true, branch: { organizationId: orgId } },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Overdue payments — separate because status column may not exist in DB yet
  let overduePaymentsRaw: Array<{
    childId: string;
    amount: { toNumber(): number };
    date: Date;
    child: { firstName: string; lastName: string };
  }> = [];
  try {
    const raw = await db.payment.findMany({
      where: { status: "OVERDUE", child: { branch: { organizationId: orgId } } },
      include: { child: true },
      take: 20,
    });
    overduePaymentsRaw = raw as typeof overduePaymentsRaw;
  } catch {
    // Column missing — skip
  }

  // Pending absences
  const pendingAbsences = pendingAbsencesRaw.map((a) => ({
    id: a.id,
    childName: `${a.child.firstName} ${a.child.lastName}`,
    childId: a.childId,
    date: a.date.toISOString().slice(0, 10),
    reason: a.reason,
  }));

  // Overdue payments — group by child
  const paymentsByChild = new Map<string, { childName: string; total: number; oldest: Date }>();
  for (const p of overduePaymentsRaw) {
    const existing = paymentsByChild.get(p.childId);
    const amount = p.amount.toNumber();
    if (existing) {
      existing.total += amount;
      if (p.date < existing.oldest) existing.oldest = p.date;
    } else {
      paymentsByChild.set(p.childId, {
        childName: `${p.child.firstName} ${p.child.lastName}`,
        total: amount,
        oldest: p.date,
      });
    }
  }
  const overduePayments = Array.from(paymentsByChild.entries())
    .map(([childId, data]) => ({
      childId,
      childName: data.childName,
      totalOverdue: data.total,
      oldestDate: data.oldest.toISOString().slice(0, 10),
    }))
    .slice(0, 5);

  // Missing reports by class
  const reportedChildIds = new Set(todayReports.map((r) => r.childId));
  const missingByClass = new Map<string, number>();
  for (const child of activeChildren) {
    if (!reportedChildIds.has(child.id)) {
      const className = child.class?.name ?? "No Class";
      missingByClass.set(className, (missingByClass.get(className) ?? 0) + 1);
    }
  }
  const missingReportsByClass = Array.from(missingByClass.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count);

  // Draft children
  const draftChildren = draftChildrenRaw.map((c) => ({
    id: c.id,
    childName: `${c.firstName} ${c.lastName}`,
    createdAt: c.createdAt.toISOString().slice(0, 10),
  }));

  return { pendingAbsences, overduePayments, missingReportsByClass, draftChildren };
}
