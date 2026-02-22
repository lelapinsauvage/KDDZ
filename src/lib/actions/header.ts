"use server";

import { getHeaderAlarmCounts, getNotifications } from "./alarms";
import { getUnreadMessageCount } from "./messages";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
}

export async function getHeaderData(): Promise<HeaderData> {
  const [alarmCountsResult, notificationsResult, messageCountResult, session] =
    await Promise.all([
      getHeaderAlarmCounts(),
      getNotifications({ limit: 8 }),
      getUnreadMessageCount().catch(() => ({ success: true, data: 0 })),
      auth(),
    ]);

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
  if (session?.user?.id) {
    try {
      const messages = await db.message.findMany({
        where: { recipientId: session.user.id },
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
  }

  return {
    alarmCounts,
    notifications: serializedNotifications,
    unreadNotificationCount: notificationData.unreadCount,
    unreadMessageCount: messageCount,
    recentMessages,
  };
}
