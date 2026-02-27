"use server";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";

export interface TodayChild {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  classId: string | null;
  className: string | null;
  hasReport: boolean;
  reportStatus: "SUBMITTED" | "DRAFT" | null;
  reportId: string | null;
  isAbsent: boolean;
}

export interface TodayMenu {
  breakfast: string | null;
  lunch: string | null;
  dessert: string | null;
  snack: string | null;
}

export interface TodayAlert {
  id: string;
  type: "message" | "birthday" | "medical" | "absence";
  title: string;
  description: string;
  href: string;
}

export interface TodayData {
  children: TodayChild[];
  classes: Array<{ id: string; name: string }>;
  menu: TodayMenu;
  alerts: TodayAlert[];
  stats: {
    totalChildren: number;
    reportsCompleted: number;
    reportsDraft: number;
    reportsMissing: number;
    absences: number;
  };
}

export async function getTodayData(): Promise<TodayData> {
  const { organizationId: orgId, branchId, userId } = await requireOrg();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch data in parallel
  const [activeChildren, todayReports, todayAbsences, todayCalendar, unreadMessages, classes] =
    await Promise.all([
      // Active children in this branch (or all branches for admin)
      db.child.findMany({
        where: {
          isActive: true,
          isDraft: false,
          branch: { organizationId: orgId },
          ...(branchId ? { branchId } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          classId: true,
          dateOfBirth: true,
          class: { select: { id: true, name: true } },
        },
        orderBy: [{ class: { name: "asc" } }, { firstName: "asc" }],
      }),

      // Today's daily reports
      db.dailyReport.findMany({
        where: {
          reportDate: { gte: today, lt: tomorrow },
          child: { branch: { organizationId: orgId }, ...(branchId ? { branchId } : {}) },
        },
        select: {
          id: true,
          childId: true,
          status: true,
        },
      }),

      // Today's absence reports
      db.absenceReport.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          child: { branch: { organizationId: orgId }, ...(branchId ? { branchId } : {}) },
        },
        select: {
          childId: true,
        },
      }),

      // Today's food calendar
      db.foodCalendar.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          branch: { organizationId: orgId },
          ...(branchId ? { branchId } : {}),
        },
        include: {
          food: { select: { name: true } },
        },
      }),

      // Unread messages count
      db.message.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      }),

      // Classes for filter
      db.class.findMany({
        where: { branch: { organizationId: orgId }, ...(branchId ? { branchId } : {}) },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  // Build report lookup
  const reportMap = new Map(
    todayReports.map((r) => [r.childId, { id: r.id, status: r.status as "SUBMITTED" | "DRAFT" }])
  );
  const absentSet = new Set(todayAbsences.map((a) => a.childId));

  // Map children with report status
  const children: TodayChild[] = activeChildren.map((child) => {
    const report = reportMap.get(child.id);
    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      photo: child.photo,
      classId: child.classId,
      className: child.class?.name ?? null,
      hasReport: !!report,
      reportStatus: report?.status ?? null,
      reportId: report?.id ?? null,
      isAbsent: absentSet.has(child.id),
    };
  });

  // Build menu
  const menu: TodayMenu = {
    breakfast: todayCalendar.find((c) => c.mealType === "BREAKFAST")?.food.name ?? null,
    lunch: todayCalendar.find((c) => c.mealType === "LUNCH")?.food.name ?? null,
    dessert: todayCalendar.find((c) => c.mealType === "DESSERT")?.food.name ?? null,
    snack: todayCalendar.find((c) => c.mealType === "SNACK")?.food.name ?? null,
  };

  // Build alerts
  const alerts: TodayAlert[] = [];

  if (unreadMessages > 0) {
    alerts.push({
      id: "messages",
      type: "message",
      title: `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}`,
      description: "You have new messages from parents or staff",
      href: "/messages/inbox",
    });
  }

  // Birthdays today
  const birthdayChildren = activeChildren.filter((c) => {
    if (!c.dateOfBirth) return false;
    const dob = new Date(c.dateOfBirth);
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  });
  birthdayChildren.forEach((child) => {
    alerts.push({
      id: `bday-${child.id}`,
      type: "birthday",
      title: `${child.firstName} ${child.lastName}'s birthday!`,
      description: "Happy birthday!",
      href: `/children/${child.id}/dashboard`,
    });
  });

  // Stats
  const totalChildren = children.length;
  const absences = children.filter((c) => c.isAbsent).length;
  const reportsCompleted = children.filter((c) => c.reportStatus === "SUBMITTED").length;
  const reportsDraft = children.filter((c) => c.reportStatus === "DRAFT").length;
  const reportsMissing = totalChildren - reportsCompleted - reportsDraft - absences;

  return {
    children,
    classes,
    menu,
    alerts,
    stats: {
      totalChildren,
      reportsCompleted,
      reportsDraft,
      reportsMissing: Math.max(0, reportsMissing),
      absences,
    },
  };
}

function emptyData(): TodayData {
  return {
    children: [],
    classes: [],
    menu: { breakfast: null, lunch: null, dessert: null, snack: null },
    alerts: [],
    stats: { totalChildren: 0, reportsCompleted: 0, reportsDraft: 0, reportsMissing: 0, absences: 0 },
  };
}
