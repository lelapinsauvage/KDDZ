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

/** Color accent per section label for visual grouping — uses design system module accents */
const sectionColors: Record<string, string> = {
  "Overview":       "text-sidebar-primary",
  "My Day":         "text-sidebar-primary",
  "Daily Ops":      "text-[#36CCA8]",
  "Reports":        "text-[#36CCA8]",
  "Children":       "text-[#6DE1C3]",
  "My Class":       "text-[#6DE1C3]",
  "Health":         "text-[#A6EFDB]",
  "Health Center":  "text-[#A6EFDB]",
  "Finance":        "text-[#94A3B8]",
  "Staff & Setup":  "text-[#94A3B8]",
  "Communication":  "text-[#94A3B8]",
  "Reference":      "text-[#94A3B8]",
}

/** Badge color per badge key — brand tones that pop on dark sidebar */
const badgeColors: Record<keyof SidebarBadges, string> = {
  activeAlarms:   "bg-[#DC2626]/20 text-[#FCA5A5]",
  missingReports: "bg-[#D97706]/20 text-[#FCD34D]",
  unreadMessages: "bg-[#36CCA8]/20 text-[#6DE1C3]",
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
      { title: "Food Items", icon: UtensilsCrossed, href: "/food" },
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
      { title: "Settings", icon: Settings, href: "/settings" },
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
      className="top-[56px] h-[calc(100svh-56px)]"
    >
      <SidebarContent className="pt-3 px-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="py-1.5">
            <SidebarGroupLabel className={`uppercase text-[10px] tracking-widest font-bold px-3 mb-0.5 ${sectionColors[section.label] ?? "text-muted-foreground/70"}`}>
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0
                const badgeColor = item.badgeKey ? badgeColors[item.badgeKey] : ""

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "border-l-[3px] border-sidebar-primary bg-sidebar-accent text-sidebar-primary font-semibold hover:bg-sidebar-accent hover:text-sidebar-primary rounded-none rounded-r-lg transition-all duration-200"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 hover:translate-x-0.5"
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className={`size-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                        <span className="flex-1 truncate">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge
                            variant="secondary"
                            className={`ml-auto min-w-5 h-5 justify-center rounded-full px-1.5 py-0 text-[10px] font-bold ${badgeColor}`}
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Actions ⌘K"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                )
              }}
            >
              <Search className="size-4" />
              <span>Quick Actions</span>
              <kbd className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60 border border-sidebar-border">
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
