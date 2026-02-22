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
import { GlobalSearch } from "./global-search"
import { getHeaderData } from "@/lib/actions/header"
import type { HeaderNotification, HeaderMessage } from "@/lib/actions/header"

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

  useEffect(() => {
    getHeaderData().then((data) => {
      setAlarmCounts(data.alarmCounts)
      setNotifications(data.notifications)
      setUnreadNotificationCount(data.unreadNotificationCount)
      setUnreadMessageCount(data.unreadMessageCount)
      setRecentMessages(data.recentMessages)
    })
  }, [])

  return (
    <header className="header-bar fixed top-0 left-0 right-0 z-50 flex items-center">
      {/* Logo area */}
      <div className="flex h-[52px] w-auto shrink-0 items-center gap-3 px-4 md:w-[270px] md:px-5">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted" />
        <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xs font-bold shadow-sm">
          K
        </div>
        <Link href="/dashboard" className="hidden text-base font-bold text-foreground tracking-tight sm:block">
          Kidd<span className="text-primary">z</span>Online
        </Link>
      </div>

      {/* Center area */}
      <div className="flex flex-1 items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-3">
          {/* Context Switcher — Branch + Year pill */}
          <ContextSwitcher />

          {/* Search hint */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-100 lg:flex"
          >
            <Search className="size-3.5" />
            <span>Search...</span>
            <kbd className="ml-4 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Search className="size-[18px]" />
          </button>

          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </div>

        <div className="flex items-center gap-1">
          {/* Inbox tray — unified notifications + messages + alerts */}
          <InboxTray
            notifications={notifications}
            unreadNotificationCount={unreadNotificationCount}
            unreadMessageCount={unreadMessageCount}
            recentMessages={recentMessages}
            alarmCounts={alarmCounts}
          />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none">
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-[11px] font-bold shadow-sm">
                  {userInitial}
                </div>
                <span className="hidden font-medium sm:inline">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
