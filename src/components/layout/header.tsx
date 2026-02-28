"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  User,
  LogOut,
  Settings,
  Search,
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
    <header className="header-bar fixed top-0 left-0 right-0 z-50 flex items-center">
      {/* Logo area */}
      <div className="flex h-[56px] w-auto shrink-0 items-center gap-2.5 px-3 md:w-[270px] md:px-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" />
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#0B9178] text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
            K
          </div>
          <span className="hidden font-heading text-[15px] font-bold text-primary tracking-tight sm:block">
            KiddzOnline
          </span>
        </Link>
      </div>

      {/* Center area */}
      <div className="flex flex-1 items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2.5">
          {/* Context Switcher — Branch + Year pill */}
          <ContextSwitcher />

          {/* Search hint */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 lg:flex"
          >
            <Search className="size-3.5 text-muted-foreground/70" />
            <span className="text-muted-foreground/70">Search...</span>
            <kbd className="ml-4 rounded-md bg-background border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground lg:hidden"
          >
            <Search className="size-[18px]" />
          </button>

          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </div>

        <div className="flex items-center gap-1">
          {/* Notification bell dropdown */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadNotificationCount}
          />

          {/* Inbox tray — unified notifications + messages + alerts */}
          <InboxTray
            notifications={notifications}
            unreadNotificationCount={unreadNotificationCount}
            unreadMessageCount={unreadMessageCount}
            recentMessages={recentMessages}
            alarmCounts={alarmCounts}
            recentAlarms={recentAlarms}
            hasCriticalAlarms={hasCriticalAlarms}
          />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#0B9178] text-white text-xs font-bold shadow-sm ring-2 ring-background">
                  {userInitial}
                </div>
                <span className="hidden font-medium sm:inline">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
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
      </div>
    </header>
  )
}
