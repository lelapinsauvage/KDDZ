"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Mail, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/alarms"
import type { HeaderNotification, HeaderMessage } from "@/lib/actions/header"

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

interface InboxTrayProps {
  notifications: HeaderNotification[]
  unreadNotificationCount: number
  unreadMessageCount: number
  recentMessages: HeaderMessage[]
  alarmCounts: {
    birthdays: number
    assessments: number
    medical: number
    totalAlarms: number
  }
}

export function InboxTray({
  notifications: initialNotifications,
  unreadNotificationCount: initialUnreadCount,
  unreadMessageCount,
  recentMessages,
  alarmCounts,
}: InboxTrayProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isPending, startTransition] = useTransition()

  const totalBadge = unreadCount + unreadMessageCount

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationRead(id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none">
          <Bell className={`size-[18px] ${totalBadge > 0 ? "text-amber-500" : ""}`} />
          {totalBadge > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {totalBadge > 99 ? "99+" : totalBadge}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] p-0 sm:max-w-[400px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">Inbox</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="notifications" className="flex h-[calc(100%-57px)] flex-col">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3">
            <TabsTrigger value="notifications" className="relative text-xs">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative text-xs">
              Messages
              {unreadMessageCount > 0 && (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white">
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">
              Alerts
              {alarmCounts.totalAlarms > 0 && (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white">
                  {alarmCounts.totalAlarms > 9 ? "9+" : alarmCounts.totalAlarms}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notifications tab */}
          <TabsContent value="notifications" className="mt-0 flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="space-y-0.5 px-2 pb-4">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className="flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm leading-tight ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {n.body && (
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground/60">
                        {timeAgo(n.createdAt)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t px-4 py-3">
                  <Link
                    href="/alarms"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Messages tab */}
          <TabsContent value="messages" className="mt-0 flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-muted-foreground">
                {unreadMessageCount} unread
              </span>
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="space-y-0.5 px-2 pb-4">
                {recentMessages.length > 0 ? (
                  recentMessages.map((m) => (
                    <Link
                      key={m.id}
                      href={`/messages/inbox?id=${m.id}`}
                      className="flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                          <span
                            className={`text-sm leading-tight ${m.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}
                          >
                            {m.senderName}
                          </span>
                        </div>
                        {!m.isRead && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      {m.subject && (
                        <span className="line-clamp-1 pl-5.5 text-xs font-medium text-foreground/80">
                          {m.subject}
                        </span>
                      )}
                      <span className="line-clamp-1 pl-5.5 text-xs text-muted-foreground">
                        {m.body}
                      </span>
                      <span className="pl-5.5 text-[11px] text-muted-foreground/60">
                        {timeAgo(m.createdAt)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No messages
                  </div>
                )}
              </div>
              {recentMessages.length > 0 && (
                <div className="border-t px-4 py-3">
                  <Link
                    href="/messages/inbox"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all messages
                  </Link>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Alerts tab */}
          <TabsContent value="alerts" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-2 py-2 pb-4">
                {alarmCounts.birthdays > 0 && (
                  <Link
                    href="/alarms/birthdays"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <span className="text-sm">🎂</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Birthdays</p>
                      <p className="text-xs text-muted-foreground">{alarmCounts.birthdays} upcoming this week</p>
                    </div>
                  </Link>
                )}
                {alarmCounts.medical > 0 && (
                  <Link
                    href="/alarms/medical"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Medical</p>
                      <p className="text-xs text-muted-foreground">{alarmCounts.medical} active alerts</p>
                    </div>
                  </Link>
                )}
                {alarmCounts.assessments > 0 && (
                  <Link
                    href="/alarms/assessments"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <span className="text-sm">📋</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Assessments</p>
                      <p className="text-xs text-muted-foreground">{alarmCounts.assessments} upcoming</p>
                    </div>
                  </Link>
                )}
                {alarmCounts.totalAlarms === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No active alerts
                  </div>
                )}
              </div>
              <div className="border-t px-4 py-3">
                <Link
                  href="/alarms"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all alerts
                </Link>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
