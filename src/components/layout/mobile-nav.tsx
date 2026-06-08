"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Baby,
  MessageCircle,
  MoreHorizontal,
  Inbox,
} from "lucide-react"
import { MobileMoreSheet } from "./mobile-more-sheet"
import type {
  UserRole,
  SidebarClassInfo,
  SidebarBranchInfo,
  LegacyPagePermissionMap,
} from "./app-sidebar"
import { legacyPageAllows } from "./app-sidebar"
import type { SidebarBadges } from "@/lib/actions/sidebar"
import type { LegacyNotificationGateVisibility } from "@/lib/legacy-notification-gates"

interface TabItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  legacyPage?: string
}

const adminTabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", legacyPage: "index.php" },
  { label: "Children", icon: Baby, href: "/children", legacyPage: "children.php" },
  { label: "Reports", icon: FileText, href: "/daily-reports", legacyPage: "dailyreports.php" },
  { label: "Messages", icon: MessageCircle, href: "/messages/inbox" },
]

const teacherTabs: TabItem[] = [
  { label: "Today", icon: LayoutDashboard, href: "/today" },
  { label: "Children", icon: Baby, href: "/children", legacyPage: "children.php" },
  { label: "Reports", icon: FileText, href: "/daily-reports", legacyPage: "dailyreports.php" },
  { label: "Messages", icon: Inbox, href: "/messages/inbox" },
]

const nurseTabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", legacyPage: "index.php" },
  { label: "Medical", icon: FileText, href: "/medical/general", legacyPage: "medical_reports.php" },
  { label: "Children", icon: Baby, href: "/children", legacyPage: "children.php" },
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
  classes?: SidebarClassInfo[]
  branches?: SidebarBranchInfo[]
  badges?: SidebarBadges
  notificationGates?: LegacyNotificationGateVisibility | null
  legacyPagePermissions?: LegacyPagePermissionMap | null
}

export function MobileNav({
  userRole,
  classes,
  branches,
  badges,
  notificationGates,
  legacyPagePermissions,
}: MobileNavProps) {
  const pathname = usePathname()
  const tabs = getTabsForRole(userRole).filter((tab) =>
    legacyPageAllows(tab.legacyPage, legacyPagePermissions)
  )
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/92 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <span className="absolute -top-1 h-[2px] w-5 rounded-full bg-primary" />
                  )}
                  <tab.icon className={`size-5 ${isActive ? "text-primary" : ""}`} />
                </div>
                <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors"
          >
            <MoreHorizontal className="size-5" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        userRole={userRole}
        classes={classes}
        branches={branches}
        badges={badges}
        notificationGates={notificationGates}
        legacyPagePermissions={legacyPagePermissions}
      />
    </>
  )
}
