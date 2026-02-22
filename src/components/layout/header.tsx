"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  Mail,
  Heart,
  Cake,
  ClipboardCheck,
  User,
  LogOut,
  Settings,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { NotificationDropdown } from "./notification-dropdown"
import { GlobalSearch } from "./global-search"
import { getHeaderData } from "@/lib/actions/header"

export function Header() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "User"
  const userInitial = userName.charAt(0).toUpperCase()
  const [searchOpen, setSearchOpen] = useState(false)

  const [alarmCounts, setAlarmCounts] = useState({ birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 })
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string | null; isRead: boolean; createdAt: string }>>([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    getHeaderData().then((data) => {
      setAlarmCounts(data.alarmCounts)
      setNotifications(data.notifications)
      setUnreadNotificationCount(data.unreadNotificationCount)
      setUnreadMessageCount(data.unreadMessageCount)
    })
  }, [])

  const navIcons = [
    { icon: Mail, label: "Messages", count: unreadMessageCount, href: "/messages/inbox", color: "text-blue-500" },
    { icon: Heart, label: "Medical", count: alarmCounts.medical, href: "/alarms/medical", color: "text-rose-500" },
    { icon: Cake, label: "Birthdays", count: alarmCounts.birthdays, href: "/alarms/birthdays", color: "text-amber-500" },
    { icon: ClipboardCheck, label: "Assessment", count: alarmCounts.assessments, href: "/alarms/assessments", color: "text-violet-500" },
  ]

  return (
    <header className="header-bar fixed top-0 left-0 right-0 z-50 flex items-center">
      {/* Logo area */}
      <div className="flex h-[56px] w-auto shrink-0 items-center gap-3 px-4 md:w-[270px] md:px-5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-bold shadow-sm">
          K
        </div>
        <Link href="/dashboard" className="text-lg font-bold text-foreground tracking-tight">
          Kidd<span className="text-primary">z</span>Online
        </Link>
      </div>

      {/* Right side */}
      <div className="flex flex-1 items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted" />

          {/* Search hint */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-100 md:flex"
          >
            <Search className="size-3.5" />
            <span>Search...</span>
            <kbd className="ml-4 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
              ⌘K
            </kbd>
          </button>

          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Navigation icon links */}
          {navIcons.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex h-10 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-10"
              title={item.label}
            >
              <item.icon className={`size-[18px] ${item.count > 0 ? item.color : ""}`} />
              {item.count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full p-0 text-[10px] leading-none"
                >
                  {item.count > 99 ? "99+" : item.count}
                </Badge>
              )}
            </Link>
          ))}

          {/* Notification bell dropdown */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadNotificationCount}
          />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none">
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-xs font-bold shadow-sm">
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
