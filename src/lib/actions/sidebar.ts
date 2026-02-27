"use server"

import { db } from "@/lib/db"
import { requireOrg } from "@/lib/require-org"

export interface SidebarBadges {
  missingReports: number
  unreadMessages: number
  activeAlarms: number
}

export async function getSidebarBadges(): Promise<SidebarBadges> {
  try {
    const { organizationId: orgId, userId } = await requireOrg()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Count children who don't have a daily report for today
    // Count unread messages for the current user
    // Count active alarms
    const [totalActiveChildren, reportsToday, unreadMessages, activeAlarms] =
      await Promise.all([
        db.child.count({ where: { isActive: true, branch: { organizationId: orgId } } }),
        db.dailyReport.count({
          where: {
            reportDate: { gte: today, lt: tomorrow },
            child: { branch: { organizationId: orgId } },
          },
        }),
        db.message.count({
          where: {
            recipientId: userId,
            isRead: false,
          },
        }),
        db.alarm.count({
          where: { isActive: true, branch: { organizationId: orgId } },
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
