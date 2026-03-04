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
        <SidebarTrigger className="size-8 text-[#b4bcc8] hover:text-white hover:bg-white/10 rounded-lg transition-colors" />
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
            K
          </div>
          <span className="hidden font-heading text-[15px] font-bold text-white tracking-tight sm:block">
            KiddzOnline
          </span>
        </Link>
      </div>

      {/* Center — context switcher + search */}
      <div className="flex flex-1 items-center gap-2 px-1 md:px-3">
        <ContextSwitcher />

        {/* Search pill — tablet & desktop */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#455263] px-3.5 py-1.5 text-[13px] text-[#b4bcc8] transition-all hover:bg-[#4f5f73] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-ring/20 md:flex"
        >
          <Search className="size-3.5 text-[#959fad]" />
          <span className="text-[#959fad] min-w-[100px]">Search...</span>
          <kbd className="ml-3 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-[#959fad]">
            ⌘K
          </kbd>
        </button>

        {/* Search button — mobile */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-[#455263] border border-white/10 px-2.5 py-1.5 text-[#b4bcc8] transition-colors hover:bg-[#4f5f73] hover:text-white md:hidden"
        >
          <Search className="size-4 text-[#959fad]" />
          <span className="text-xs">Search</span>
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
        <div className="mx-1.5 hidden h-6 w-px bg-white/15 sm:block" />

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ring/20">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-background">
                {userInitial}
              </div>
              <span className="hidden max-w-[100px] truncate text-[13px] font-medium text-white sm:inline">
                {userName}
              </span>
              <ChevronDown className="hidden size-3 text-[#b4bcc8] sm:block" />
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
