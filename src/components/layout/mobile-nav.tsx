"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Baby,
  DollarSign,
  MoreHorizontal,
  Inbox,
} from "lucide-react"
import { MobileMoreSheet } from "./mobile-more-sheet"
import type { UserRole } from "./app-sidebar"

interface TabItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const adminTabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Reports", icon: FileText, href: "/daily-reports" },
  { label: "Children", icon: Baby, href: "/children" },
  { label: "Finance", icon: DollarSign, href: "/accounting" },
]

const teacherTabs: TabItem[] = [
  { label: "Today", icon: LayoutDashboard, href: "/today" },
  { label: "Reports", icon: FileText, href: "/daily-reports" },
  { label: "Children", icon: Baby, href: "/children" },
  { label: "Messages", icon: Inbox, href: "/messages/inbox" },
]

const nurseTabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Medical", icon: FileText, href: "/medical/general" },
  { label: "Children", icon: Baby, href: "/children" },
  { label: "Messages", icon: Inbox, href: "/messages/inbox" },
]

function getTabsForRole(role: UserRole): TabItem[] {
  switch (role) {
    case "TEACHER":
      return teacherTabs
    case "NURSE":
    case "DOCTOR":
      return nurseTabs
    case "ADMIN":
    case "MANAGER":
    default:
      return adminTabs
  }
}

interface MobileNavProps {
  userRole: UserRole
}

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname()
  const tabs = getTabsForRole(userRole)
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-white/85 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`size-5 ${isActive ? "text-primary" : ""}`} />
              <span>{tab.label}</span>
            </Link>
          )
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </button>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        userRole={userRole}
      />
    </>
  )
}
