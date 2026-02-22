"use server";

import { getHeaderAlarmCounts, getNotifications } from "./alarms";
import { getUnreadMessageCount } from "./messages";

export async function getHeaderData() {
  const [alarmCountsResult, notificationsResult, messageCountResult] =
    await Promise.all([
      getHeaderAlarmCounts(),
      getNotifications({ limit: 8 }),
      getUnreadMessageCount().catch(() => ({ success: true, data: 0 })),
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

  return {
    alarmCounts,
    notifications: serializedNotifications,
    unreadNotificationCount: notificationData.unreadCount,
    unreadMessageCount: messageCount,
  };
}
