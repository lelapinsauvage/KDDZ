"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Users,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  FileText,
  CalendarDays,
  Stethoscope,
  Syringe,
  AlertTriangle,
  UserCheck,
  DollarSign,
  Bell,
  Baby,
  Search,
  Pill,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import type { SidebarBadges } from "@/lib/actions/sidebar"

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER"

interface FlatNavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  /** Badge key for dynamic badge counts */
  badgeKey?: keyof SidebarBadges
}

interface NavSection {
  label: string
  items: FlatNavItem[]
}

// ---------------------------------------------------------------------------
// Role-specific nav configs — flat, workflow-oriented
// ---------------------------------------------------------------------------

const adminNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    label: "Daily Ops",
    items: [
      { title: "Daily Reports", icon: FileText, href: "/daily-reports", badgeKey: "missingReports" },
      { title: "Attendance & Absences", icon: CalendarDays, href: "/absent-reports" },
      { title: "Food Calendar", icon: UtensilsCrossed, href: "/food/calendar" },
    ],
  },
  {
    label: "Children",
    items: [
      { title: "All Children", icon: Baby, href: "/children" },
      { title: "Parent Users", icon: Users, href: "/settings/parent-users" },
    ],
  },
  {
    label: "Health",
    items: [
      { title: "Medical Records", icon: Stethoscope, href: "/medical/general" },
      { title: "Conditions", icon: Pill, href: "/medical/conditions" },
      { title: "Visits", icon: Stethoscope, href: "/medical/visits" },
      { title: "Vaccinations", icon: Syringe, href: "/medical/vaccinations" },
      { title: "Accidents", icon: AlertTriangle, href: "/medical/accidents" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Accounting", icon: DollarSign, href: "/accounting" },
    ],
  },
  {
    label: "Staff & Setup",
    items: [
      { title: "Staff", icon: UserCheck, href: "/employees/staff" },
      { title: "Branches & Classes", icon: Building2, href: "/branches" },
      { title: "Assessments", icon: ClipboardList, href: "/assessments" },
      { title: "Messages", icon: Inbox, href: "/messages/inbox", badgeKey: "unreadMessages" },
      { title: "Notifications", icon: Bell, href: "/alarms", badgeKey: "activeAlarms" },
      { title: "Settings", icon: Settings, href: "/settings/nursery" },
    ],
  },
]

const teacherNav: NavSection[] = [
  {
    label: "My Day",
    items: [
      { title: "Today", icon: LayoutDashboard, href: "/today" },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Daily Reports", icon: FileText, href: "/daily-reports", badgeKey: "missingReports" },
      { title: "Batch Reports", icon: ClipboardList, href: "/daily-reports/batch" },
      { title: "Absences", icon: CalendarDays, href: "/absent-reports" },
    ],
  },
  {
    label: "My Class",
    items: [
      { title: "Children", icon: Baby, href: "/children" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", icon: Inbox, href: "/messages/inbox", badgeKey: "unreadMessages" },
    ],
  },
  {
    label: "Reference",
    items: [
      { title: "Food Calendar", icon: UtensilsCrossed, href: "/food/calendar" },
      { title: "Notifications", icon: Bell, href: "/alarms", badgeKey: "activeAlarms" },
    ],
  },
]

const nurseNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    label: "Health Center",
    items: [
      { title: "Medical Records", icon: Stethoscope, href: "/medical/general" },
      { title: "Conditions", icon: Pill, href: "/medical/conditions" },
      { title: "Visits", icon: Stethoscope, href: "/medical/visits" },
      { title: "Vaccinations", icon: Syringe, href: "/medical/vaccinations" },
      { title: "Accidents", icon: AlertTriangle, href: "/medical/accidents" },
    ],
  },
  {
    label: "Children",
    items: [
      { title: "All Children", icon: Baby, href: "/children" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", icon: Inbox, href: "/messages/inbox", badgeKey: "unreadMessages" },
      { title: "Notifications", icon: Bell, href: "/alarms", badgeKey: "activeAlarms" },
    ],
  },
]

function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "TEACHER":
      return teacherNav
    case "NURSE":
    case "DOCTOR":
      return nurseNav
    case "ADMIN":
    case "MANAGER":
    default:
      return adminNav
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  userRole: UserRole
  badges?: SidebarBadges
}

export function AppSidebar({ userRole, badges }: AppSidebarProps) {
  const pathname = usePathname()
  const sections = getNavForRole(userRole)

  return (
    <Sidebar
      collapsible="icon"
      className="top-[52px] h-[calc(100svh-52px)] border-r border-border"
    >
      <SidebarContent className="pt-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="py-1">
            <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-semibold text-muted-foreground/70 px-3">
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "border-l-3 border-primary bg-primary/5 text-primary font-medium hover:bg-primary/10 hover:text-primary rounded-none rounded-r-lg"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto size-5 justify-center rounded-full p-0 text-[10px] font-medium bg-primary/10 text-primary"
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Actions ⌘K"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                )
              }}
            >
              <Search className="size-4" />
              <span>Quick Actions</span>
              <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// Export the nav configs for use by mobile nav
export { getNavForRole, type NavSection, type FlatNavItem, type UserRole }
