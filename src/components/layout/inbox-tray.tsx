"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  Bell,
  CheckCheck,
  Mail,
  Cake,
  Syringe,
  Heart,
  Pill,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  X,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  dismissAlarm,
} from "@/lib/actions/alarms"
import type { HeaderNotification, HeaderMessage, HeaderAlarm } from "@/lib/actions/header"

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

// --- Alarm type config ---
const alarmTypeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  BIRTHDAY:    { icon: Cake,          color: "text-[#EC4899]",  bg: "bg-[#EC4899]/10" },
  VACCINATION: { icon: Syringe,       color: "text-[#059669]",  bg: "bg-[#059669]/10" },
  MEDICAL:     { icon: Heart,         color: "text-[#0B9178]",  bg: "bg-primary/10" },
  MEDICINE:    { icon: Pill,          color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10" },
  PAYMENT:     { icon: DollarSign,    color: "text-[#D97706]",  bg: "bg-[#D97706]/10" },
  EVENT:       { icon: Calendar,      color: "text-[#059669]",  bg: "bg-[#059669]/10" },
  INSURANCE:   { icon: Shield,        color: "text-[#0B9178]",  bg: "bg-primary/10" },
  CONTRACT:    { icon: FileText,      color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10" },
  REQUEST:     { icon: MessageSquare, color: "text-[#059669]",  bg: "bg-[#059669]/10" },
  ASSESSMENT:  { icon: FileText,      color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10" },
  OTHER:       { icon: Bell,          color: "text-[#8B8178]",  bg: "bg-[#8B8178]/10" },
}

function getAlarmConfig(type: string) {
  return alarmTypeConfig[type] ?? alarmTypeConfig.OTHER
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
  recentAlarms: HeaderAlarm[]
  hasCriticalAlarms: boolean
}

export function InboxTray({
  notifications: initialNotifications,
  unreadNotificationCount: initialUnreadCount,
  unreadMessageCount,
  recentMessages,
  alarmCounts,
  recentAlarms: initialRecentAlarms,
  hasCriticalAlarms,
}: InboxTrayProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [recentAlarms, setRecentAlarms] = useState(initialRecentAlarms)
  const [isPending, startTransition] = useTransition()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const totalBadge = unreadCount + unreadMessageCount + alarmCounts.totalAlarms

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

  function handleDismissAlarm(id: string) {
    startTransition(async () => {
      const result = await dismissAlarm(id)
      if (result.success) {
        setRecentAlarms((prev) => prev.filter((a) => a.id !== id))
      }
    })
  }

  return (
    <>
      {/* Bell with Popover — quick alarm dropdown */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none">
            <Bell className={`size-[18px] ${totalBadge > 0 ? "text-primary" : ""}`} />
            {totalBadge > 0 && (
              <Badge
                className={`absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-0 bg-primary p-0 text-[10px] leading-none text-primary-foreground ${
                  hasCriticalAlarms ? "animate-pulse" : ""
                }`}
              >
                {totalBadge > 99 ? "99+" : totalBadge}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px] p-0 rounded-sm border-border/40 shadow-sm" sideOffset={8}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Alerts</h3>
            <span className="text-xs text-muted-foreground">
              {alarmCounts.totalAlarms} active
            </span>
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {recentAlarms.length > 0 ? (
              <div className="divide-y divide-border/40">
                {recentAlarms.map((alarm) => {
                  const config = getAlarmConfig(alarm.type)
                  const Icon = config.icon
                  return (
                    <div
                      key={alarm.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                        <Icon className={`size-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">
                          {alarm.message}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {alarm.dueDate && (
                            <span className={`text-[11px] ${alarm.isOverdue ? "font-medium text-[#0B9178]" : "text-muted-foreground"}`}>
                              {alarm.isOverdue ? "Overdue" : `Due ${alarm.dueDate}`}
                            </span>
                          )}
                          {!alarm.dueDate && (
                            <span className="text-[11px] text-muted-foreground">
                              {timeAgo(alarm.createdAt)}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${config.bg} ${config.color}`}>
                            {alarm.type.charAt(0) + alarm.type.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismissAlarm(alarm.id)}
                        disabled={isPending}
                        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                        title="Dismiss"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <Bell className="size-5 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2.5">
            <Link
              href="/alarms"
              onClick={() => setPopoverOpen(false)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View All <ChevronRight className="size-3" />
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  onClick={() => setPopoverOpen(false)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-3" />
                  Inbox
                  {(unreadCount + unreadMessageCount) > 0 && (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                      {unreadCount + unreadMessageCount > 9 ? "9+" : unreadCount + unreadMessageCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] rounded-l-2xl border-border/40 p-0 sm:max-w-[400px]">
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle className="text-base font-semibold">Inbox</SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="notifications" className="flex h-[calc(100%-57px)] flex-col">
                  <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
                    <TabsTrigger value="notifications" className="relative text-xs">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="relative text-xs">
                      Messages
                      {unreadMessageCount > 0 && (
                        <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
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
                                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
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
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
