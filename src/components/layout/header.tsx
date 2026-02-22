"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  Mail,
  Heart,
  Cake,
  ClipboardCheck,
  User,
  LogOut,
  Settings,
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

interface HeaderProps {
  alarmCounts?: {
    birthdays: number
    assessments: number
    medical: number
    totalAlarms: number
  }
  notifications?: Array<{
    id: string
    title: string
    body: string | null
    isRead: boolean
    createdAt: string
  }>
  unreadNotificationCount?: number
  unreadMessageCount?: number
}

export function Header({
  alarmCounts = { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 },
  notifications = [],
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
}: HeaderProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name || "User"
  const userInitial = userName.charAt(0).toUpperCase()

  const navIcons = [
    { icon: Mail, label: "Messages", count: unreadMessageCount, href: "/messages/inbox" },
    { icon: Heart, label: "Medical", count: alarmCounts.medical, href: "/alarms/medical" },
    { icon: Cake, label: "Birthdays", count: alarmCounts.birthdays, href: "/alarms/birthdays" },
    { icon: ClipboardCheck, label: "Assessment", count: alarmCounts.assessments, href: "/alarms/assessments" },
  ]

  return (
    <header className="header-bar fixed top-0 left-0 right-0 z-50 flex items-center">
      {/* Logo area — matches sidebar width */}
      <div className="flex h-[46px] w-[270px] shrink-0 items-center px-5">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-wide">
          KiddzOnline
        </Link>
      </div>

      {/* Right side: sidebar trigger + notifications + user menu */}
      <div className="flex flex-1 items-center justify-between px-4">
        <SidebarTrigger className="text-[#b4bcc8] hover:text-white hover:bg-white/10" />

        <div className="flex items-center gap-1">
          {/* Navigation icon links */}
          {navIcons.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex h-[46px] w-10 items-center justify-center text-[#b4bcc8] transition-colors hover:text-white"
            >
              <item.icon className="size-[18px]" />
              {item.count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-1.5 right-0.5 flex size-[18px] items-center justify-center p-0 text-[10px] leading-none"
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
              <button className="ml-2 flex items-center gap-2 rounded px-3 py-1.5 text-sm text-[#b4bcc8] transition-colors hover:text-white focus:outline-none">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#1caf9a] text-white text-xs font-semibold">
                  {userInitial}
                </div>
                <span className="hidden sm:inline">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
