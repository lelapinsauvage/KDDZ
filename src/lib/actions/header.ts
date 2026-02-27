"use server";

import { getHeaderAlarmCounts, getNotifications } from "./alarms";
import { getUnreadMessageCount } from "./messages";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";

export interface HeaderNotification {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface HeaderMessage {
  id: string;
  subject: string | null;
  body: string;
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

export interface HeaderAlarm {
  id: string;
  type: string;
  message: string;
  dueDate: string | null;
  isOverdue: boolean;
  createdAt: string;
  isCritical: boolean;
}

export interface HeaderData {
  alarmCounts: {
    birthdays: number;
    assessments: number;
    medical: number;
    totalAlarms: number;
  };
  notifications: HeaderNotification[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  recentMessages: HeaderMessage[];
  recentAlarms: HeaderAlarm[];
  hasCriticalAlarms: boolean;
}

const CRITICAL_TYPES = new Set(["VACCINATION", "MEDICAL", "MEDICINE", "PAYMENT"]);

export async function getHeaderData(): Promise<HeaderData> {
  const { userId, organizationId: orgId } = await requireOrg();

  const [alarmCountsResult, notificationsResult, messageCountResult, recentDbAlarms] =
    await Promise.all([
      getHeaderAlarmCounts(),
      getNotifications({ limit: 8 }),
      getUnreadMessageCount().catch(() => ({ success: true, data: 0 })),
      db.alarm.findMany({
        where: { isActive: true, branch: { organizationId: orgId } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentAlarms: HeaderAlarm[] = recentDbAlarms.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message ?? a.type,
    dueDate: a.dueDate?.toISOString().slice(0, 10) ?? null,
    isOverdue: a.dueDate ? a.dueDate < today : false,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    isCritical: CRITICAL_TYPES.has(a.type),
  }));

  const hasCriticalAlarms = recentAlarms.some((a) => a.isCritical);

  const alarmCounts = (alarmCountsResult.data as {
    birthdays: number;
    assessments: number;
    medical: number;
    totalAlarms: number;
  }) ?? { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 };

  const notificationData = (notificationsResult.success
    ? notificationsResult.data
    : { notifications: [], unreadCount: 0 }) as {
    notifications: Array<{
      id: string;
      title: string;
      body: string | null;
      isRead: boolean;
      createdAt: Date;
    }>;
    unreadCount: number;
  };

  const messageCount =
    typeof messageCountResult.data === "number" ? messageCountResult.data : 0;

  const serializedNotifications = notificationData.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
  }));

  // Fetch recent messages for the inbox tray
  let recentMessages: HeaderMessage[] = [];
  try {
    const messages = await db.message.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    // Resolve sender names
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const [users, parentUsers] = await Promise.all([
      senderIds.length > 0
        ? db.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, name: true, email: true },
          })
        : [],
      senderIds.length > 0
        ? db.parentUser.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, username: true },
          })
        : [],
    ]);

    const nameMap = new Map<string, string>();
    for (const u of users) nameMap.set(u.id, u.name || u.email);
    for (const pu of parentUsers) nameMap.set(pu.id, pu.username);

    recentMessages = messages.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      senderName: nameMap.get(m.senderId) ?? "Unknown",
      isRead: m.isRead,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : String(m.createdAt),
    }));
  } catch {
    // If message fetch fails, continue with empty list
  }

  return {
    alarmCounts,
    notifications: serializedNotifications,
    unreadNotificationCount: notificationData.unreadCount,
    unreadMessageCount: messageCount,
    recentMessages,
    recentAlarms,
    hasCriticalAlarms,
  };
}
