"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  User,
  LogOut,
  Settings,
  Search,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ContextSwitcher } from "./context-switcher"
import { InboxTray } from "./inbox-tray"
import { NotificationDropdown } from "./notification-dropdown"
import { GlobalSearch } from "./global-search"
import { getHeaderData } from "@/lib/actions/header"
import type { HeaderNotification, HeaderMessage, HeaderAlarm } from "@/lib/actions/header"

export function Header() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "User"
  const userInitial = userName.charAt(0).toUpperCase()
  const [searchOpen, setSearchOpen] = useState(false)

  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<HeaderMessage[]>([])
  const [alarmCounts, setAlarmCounts] = useState({ birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 })
  const [recentAlarms, setRecentAlarms] = useState<HeaderAlarm[]>([])
  const [hasCriticalAlarms, setHasCriticalAlarms] = useState(false)

  useEffect(() => {
    getHeaderData().then((data) => {
      setAlarmCounts(data.alarmCounts)
      setNotifications(data.notifications)
      setUnreadNotificationCount(data.unreadNotificationCount)
      setUnreadMessageCount(data.unreadMessageCount)
      setRecentMessages(data.recentMessages)
      setRecentAlarms(data.recentAlarms)
      setHasCriticalAlarms(data.hasCriticalAlarms)
    })
  }, [])

  return (
    <header className="header-bar fixed top-0 left-0 right-0 z-50 flex h-14 items-center">
      {/* Logo area — anchored left */}
      <div className="flex h-14 w-auto shrink-0 items-center gap-2 pl-2 pr-3 md:w-[260px] md:pl-3 md:pr-4">
        <SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors" />
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
            K
          </div>
          <span className="hidden font-heading text-[15px] font-bold text-foreground tracking-tight sm:block">
            KiddzOnline
          </span>
        </Link>
      </div>

      {/* Center — context switcher + search */}
      <div className="flex flex-1 items-center gap-2 px-1 md:px-3">
        <ContextSwitcher />

        {/* Search pill — desktop */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-3.5 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-muted/70 hover:border-border/60 focus:outline-none focus:ring-2 focus:ring-ring/20 lg:flex"
        >
          <Search className="size-3.5 text-muted-foreground/60" />
          <span className="text-muted-foreground/60">Search...</span>
          <kbd className="ml-3 rounded-md border border-border/40 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
            ⌘K
          </kbd>
        </button>

        {/* Search icon — mobile */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:hidden"
        >
          <Search className="size-[18px]" />
        </button>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>

      {/* Right — notifications + inbox + user */}
      <div className="flex items-center gap-0.5 pr-2 md:pr-4">
        {/* Notification bell */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadNotificationCount}
        />

        {/* Inbox tray */}
        <InboxTray
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
          unreadMessageCount={unreadMessageCount}
          recentMessages={recentMessages}
          alarmCounts={alarmCounts}
          recentAlarms={recentAlarms}
          hasCriticalAlarms={hasCriticalAlarms}
        />

        {/* Divider */}
        <div className="mx-1.5 hidden h-6 w-px bg-border/50 sm:block" />

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring/20">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-background">
                {userInitial}
              </div>
              <span className="hidden max-w-[100px] truncate text-[13px] font-medium text-foreground sm:inline">
                {userName}
              </span>
              <ChevronDown className="hidden size-3 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground">Manage your account</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 size-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
