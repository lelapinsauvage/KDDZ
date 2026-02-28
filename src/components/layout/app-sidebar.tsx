"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Building2,
  Inbox,
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
  ChevronsUpDown,
  LogOut,
  Plus,
  GraduationCap,
  Sun,
  History,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRecentlyVisited } from "@/hooks/use-recently-visited"
import type { SidebarBadges } from "@/lib/actions/sidebar"

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER"

interface FlatNavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badgeKey?: keyof SidebarBadges
}

interface NavSection {
  label: string
  items: FlatNavItem[]
}

// ---------------------------------------------------------------------------
// Badge styling — accent-tinted pills that pop on dark sidebar
// ---------------------------------------------------------------------------

const badgeColors: Record<keyof SidebarBadges, string> = {
  activeAlarms:   "bg-red-500/15 text-red-300 border-red-500/20",
  missingReports: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  unreadMessages: "bg-[#36CCA8]/15 text-[#6DE1C3] border-[#36CCA8]/20",
}

// ---------------------------------------------------------------------------
// Role-specific nav configs — workflow-oriented grouping by priority
// ---------------------------------------------------------------------------

const adminNav: NavSection[] = [
  {
    label: "Quick Access",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { title: "Today", icon: Sun, href: "/today" },
    ],
  },
  {
    label: "Daily Operations",
    items: [
      { title: "Daily Reports", icon: FileText, href: "/daily-reports", badgeKey: "missingReports" },
      { title: "Attendance", icon: CalendarDays, href: "/absent-reports" },
      { title: "Food Calendar", icon: UtensilsCrossed, href: "/food/calendar" },
      { title: "Food Items", icon: UtensilsCrossed, href: "/food" },
    ],
  },
  {
    label: "Children",
    items: [
      { title: "All Children", icon: Baby, href: "/children" },
      { title: "Enrollments", icon: GraduationCap, href: "/settings/parent-users" },
      { title: "Assessments", icon: ClipboardList, href: "/assessments" },
    ],
  },
  {
    label: "Health",
    items: [
      { title: "Medical Records", icon: Stethoscope, href: "/medical/general" },
      { title: "Vaccinations", icon: Syringe, href: "/medical/vaccinations" },
      { title: "Accidents", icon: AlertTriangle, href: "/medical/accidents" },
      { title: "Conditions", icon: Pill, href: "/medical/conditions" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", icon: Inbox, href: "/messages/inbox", badgeKey: "unreadMessages" },
      { title: "Notifications", icon: Bell, href: "/alarms", badgeKey: "activeAlarms" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Accounting", icon: DollarSign, href: "/accounting" },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Branches & Classes", icon: Building2, href: "/branches" },
      { title: "Employees", icon: UserCheck, href: "/employees/staff" },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", icon: Settings, href: "/settings" },
    ],
  },
]

const teacherNav: NavSection[] = [
  {
    label: "Quick Access",
    items: [
      { title: "Today", icon: Sun, href: "/today" },
    ],
  },
  {
    label: "Daily Operations",
    items: [
      { title: "Daily Reports", icon: FileText, href: "/daily-reports", badgeKey: "missingReports" },
      { title: "Absences", icon: CalendarDays, href: "/absent-reports" },
    ],
  },
  {
    label: "Children",
    items: [
      { title: "Children", icon: Baby, href: "/children" },
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

const nurseNav: NavSection[] = [
  {
    label: "Quick Access",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    label: "Health",
    items: [
      { title: "Medical Records", icon: Stethoscope, href: "/medical/general" },
      { title: "Vaccinations", icon: Syringe, href: "/medical/vaccinations" },
      { title: "Accidents", icon: AlertTriangle, href: "/medical/accidents" },
      { title: "Conditions", icon: Pill, href: "/medical/conditions" },
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
// Readable role label
// ---------------------------------------------------------------------------

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  NURSE: "Nurse",
  DOCTOR: "Doctor",
  MANAGER: "Manager",
}

// ---------------------------------------------------------------------------
// Quick actions per role (contextual shortcuts)
// ---------------------------------------------------------------------------

interface QuickAction {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

function getQuickActionsForRole(role: UserRole): QuickAction[] {
  switch (role) {
    case "TEACHER":
      return [
        { title: "New Daily Report", icon: Plus, href: "/daily-reports/new" },
      ]
    case "NURSE":
    case "DOCTOR":
      return [
        { title: "Log Accident", icon: Plus, href: "/medical/accidents" },
      ]
    case "ADMIN":
    case "MANAGER":
    default:
      return [
        { title: "New Daily Report", icon: Plus, href: "/daily-reports/new" },
      ]
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  userRole: UserRole
  badges?: SidebarBadges
}

const TABLET_MAX = 1024

export function AppSidebar({ userRole, badges }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { setOpen } = useSidebar()
  const sections = getNavForRole(userRole)
  const quickActions = getQuickActionsForRole(userRole)
  const { recentPages } = useRecentlyVisited()

  const userName = session?.user?.name || "User"
  const userInitial = userName.charAt(0).toUpperCase()

  // Auto-collapse sidebar on tablet-width screens (768–1024px)
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: 768px) and (max-width: ${TABLET_MAX}px)`)
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setOpen(false)
    }
    handleChange(mql)
    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [setOpen])

  return (
    <Sidebar
      collapsible="icon"
      className="top-[56px] h-[calc(100svh-56px)]"
    >
      {/* ── Brand header ── */}
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0B9178] text-white text-sm font-bold shadow-md ring-1 ring-white/10 transition-shadow duration-200 group-hover:shadow-lg group-hover:ring-white/20">
            K
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-[15px] font-bold leading-tight text-sidebar-accent-foreground tracking-tight">
              KiddzOnline
            </span>
            <span className="text-[10px] font-medium leading-none text-sidebar-foreground/50 tracking-wider uppercase">
              Nursery Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-3 pt-1">
        {/* Quick action shortcuts */}
        {quickActions.length > 0 && (
          <SidebarGroup className="py-1">
            <SidebarMenu className="space-y-0.5">
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={action.title}
                    className="text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary rounded-lg transition-all duration-200 border border-sidebar-primary/20 border-dashed"
                  >
                    <Link href={action.href}>
                      <action.icon className="size-[18px] shrink-0" />
                      <span className="flex-1 truncate text-[13px] font-medium">{action.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Main nav sections */}
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="py-1">
            <SidebarGroupLabel className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-sidebar-foreground/40">
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
                          ? "relative bg-sidebar-accent text-sidebar-accent-foreground font-medium rounded-lg border-l-[3px] border-l-sidebar-primary rounded-l-none pl-[9px] transition-all duration-200"
                          : "relative text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200"
                      }
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={`size-[18px] shrink-0 ${
                            isActive
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/50"
                          }`}
                        />
                        <span className="flex-1 truncate text-[13px]">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge
                            variant="secondary"
                            className={`ml-auto min-w-5 h-5 justify-center rounded-full border px-1.5 py-0 text-[10px] font-bold tabular-nums ${badgeColor}`}
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

        {/* Recently Visited */}
        {recentPages.length > 0 && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-sidebar-foreground/40">
              Recently Visited
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-0.5">
              {recentPages.slice(0, 5).map((page) => {
                const isActive = pathname === page.href
                return (
                  <SidebarMenuItem key={page.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={page.title}
                      className={
                        isActive
                          ? "relative bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium rounded-lg transition-all duration-200"
                          : "relative text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 rounded-lg transition-all duration-200"
                      }
                    >
                      <Link href={page.href}>
                        <History className="size-[18px] shrink-0 text-sidebar-foreground/30" />
                        <span className="flex-1 truncate text-[13px]">{page.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer: Quick Actions + User ── */}
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        {/* Quick Actions shortcut */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Actions ⌘K"
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200"
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                )
              }}
            >
              <Search className="size-[18px] shrink-0" />
              <span className="text-[13px]">Quick Actions</span>
              <kbd className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/40 border border-sidebar-border">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User info */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200 data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                    {userInitial}
                  </div>
                  <div className="flex flex-col flex-1 text-left leading-tight">
                    <span className="text-[13px] font-medium text-sidebar-accent-foreground truncate">
                      {userName}
                    </span>
                    <span className="text-[11px] text-sidebar-foreground/50 truncate">
                      {roleLabels[userRole]}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/40" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
              >
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{userName}</span>
                    <span className="text-xs text-muted-foreground">{roleLabels[userRole]}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">
                    <LogOut className="mr-2 size-4" />
                    Log Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// Export the nav configs for use by mobile nav
export { getNavForRole, type NavSection, type FlatNavItem, type UserRole }
