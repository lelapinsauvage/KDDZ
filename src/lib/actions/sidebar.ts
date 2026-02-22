"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export interface SidebarBadges {
  missingReports: number
  unreadMessages: number
  activeAlarms: number
}

export async function getSidebarBadges(): Promise<SidebarBadges> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { missingReports: 0, unreadMessages: 0, activeAlarms: 0 }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Count children who don't have a daily report for today
    // Count unread messages for the current user
    // Count active alarms
    const [totalActiveChildren, reportsToday, unreadMessages, activeAlarms] =
      await Promise.all([
        db.child.count({ where: { isActive: true } }),
        db.dailyReport.count({
          where: {
            reportDate: { gte: today, lt: tomorrow },
          },
        }),
        db.message.count({
          where: {
            recipientId: session.user.id,
            isRead: false,
          },
        }),
        db.alarm.count({
          where: { isActive: true },
        }),
      ])

    return {
      missingReports: Math.max(0, totalActiveChildren - reportsToday),
      unreadMessages: unreadMessages,
      activeAlarms: activeAlarms,
    }
  } catch (error) {
    console.error("Failed to fetch sidebar badges:", error)
    return { missingReports: 0, unreadMessages: 0, activeAlarms: 0 }
  }
}
