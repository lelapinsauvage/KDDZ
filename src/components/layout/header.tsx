"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  Mail,
  Heart,
  Cake,
  ClipboardCheck,
  Bell,
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

const notifications = [
  { icon: Mail, label: "Messages", count: 5, href: "/messages/inbox" },
  { icon: Heart, label: "Medical", count: 2, href: "/medical/general" },
  { icon: Cake, label: "Birthdays", count: 3, href: "/alarms/birthdays" },
  { icon: ClipboardCheck, label: "Assessment", count: 1, href: "/alarms/assessments" },
  { icon: Bell, label: "Alarms", count: 8, href: "/alarms/others" },
]

export function Header() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "User"
  const userInitial = userName.charAt(0).toUpperCase()

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
          {/* Notification icons */}
          {notifications.map((item) => (
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
                  {item.count}
                </Badge>
              )}
            </Link>
          ))}

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
