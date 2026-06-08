"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  ChevronRight,
  Send,
  PenLine,
  MapPin,
  Map as MapIcon,
  Globe,
  Users,
  Calendar,
  Upload,
  Clock,
  Heart,
  MessageSquare,
  School,
  Phone,
  FileEdit,
  Cake,
  Shield,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { SidebarBadges } from "@/lib/actions/sidebar"
import type {
  LegacyNotificationGateKey,
  LegacyNotificationGateVisibility,
} from "@/lib/legacy-notification-gates"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER"

interface NavLeaf {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badgeKey?: keyof SidebarBadges
  notificationGateKey?: LegacyNotificationGateKey
  legacyPage?: string
}

interface NavAccordionItem {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: NavItem[]
  legacyPage?: string
}

type NavItem = NavLeaf | NavAccordionItem

/** Top-level section: either a flat link or an accordion with children */
type NavSection =
  | {
      label: string
      icon: React.ComponentType<{ className?: string }>
      href: string
      badgeKey?: keyof SidebarBadges
      notificationGateKey?: LegacyNotificationGateKey
      legacyPage?: string
    }
  | {
      label: string
      icon: React.ComponentType<{ className?: string }>
      children: NavItem[]
      legacyPage?: string
    }

function isAccordion(item: NavItem): item is NavAccordionItem {
  return "children" in item
}

function isSectionAccordion(
  section: NavSection
): section is Extract<NavSection, { children: NavItem[] }> {
  return "children" in section
}

export interface SidebarClassInfo {
  id: string
  name: string
  branch: { id: string; name: string }
}

export interface SidebarBranchInfo {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Badge styling
// ---------------------------------------------------------------------------

const badgeColors: Record<keyof SidebarBadges, string> = {
  activeAlarms: "bg-red-500/15 text-red-300 border-red-500/20",
  missingReports: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  unreadMessages: "bg-[#36CCA8]/15 text-[#6DE1C3] border-[#36CCA8]/20",
}

// ---------------------------------------------------------------------------
// Active-state detection
// ---------------------------------------------------------------------------

function isLeafActive(href: string, pathname: string, searchParams?: URLSearchParams): boolean {
  const [hrefPath, hrefQuery] = href.split("?")
  if (hrefQuery) {
    // For hrefs with query params (e.g. "/children?tab=calls"), require exact path + param match
    if (pathname !== hrefPath) return false
    const expected = new URLSearchParams(hrefQuery)
    for (const [key, value] of expected) {
      if (searchParams?.get(key) !== value) return false
    }
    return true
  }
  return pathname === href || pathname.startsWith(href + "/")
}

function hasActiveChild(items: NavItem[], pathname: string, searchParams?: URLSearchParams): boolean {
  return items.some((item) => {
    if (isAccordion(item)) return hasActiveChild(item.children, pathname, searchParams)
    return isLeafActive(item.href, pathname, searchParams)
  })
}

function sectionHasActiveChild(section: NavSection, pathname: string, searchParams?: URLSearchParams): boolean {
  if (isSectionAccordion(section)) return hasActiveChild(section.children, pathname, searchParams)
  return isLeafActive(section.href, pathname, searchParams)
}

function notificationGateAllows(
  key: LegacyNotificationGateKey | undefined,
  gates?: LegacyNotificationGateVisibility | null
) {
  return !key || !gates || gates[key] !== false
}

export type LegacyPagePermissionDecision = {
  isConfigured: boolean
  isAllowed: boolean
}

export type LegacyPagePermissionMap = Record<string, LegacyPagePermissionDecision>

function legacyPageAllows(
  legacyPage: string | undefined,
  permissions?: LegacyPagePermissionMap | null
) {
  if (!legacyPage || !permissions) return true
  const decision = permissions[legacyPage]
  return !decision?.isConfigured || decision.isAllowed
}

function filterNavItems(
  items: NavItem[],
  gates?: LegacyNotificationGateVisibility | null,
  legacyPagePermissions?: LegacyPagePermissionMap | null
): NavItem[] {
  return items.flatMap<NavItem>((item) => {
    if (!isAccordion(item)) {
      return notificationGateAllows(item.notificationGateKey, gates) &&
        legacyPageAllows(item.legacyPage, legacyPagePermissions)
        ? [item]
        : []
    }

    if (!legacyPageAllows(item.legacyPage, legacyPagePermissions)) return []

    const children = filterNavItems(
      item.children,
      gates,
      legacyPagePermissions
    )
    return children.length > 0 ? [{ ...item, children }] : []
  })
}

function filterNavSections(
  sections: NavSection[],
  gates?: LegacyNotificationGateVisibility | null,
  legacyPagePermissions?: LegacyPagePermissionMap | null
): NavSection[] {
  return sections.flatMap<NavSection>((section) => {
    if (!isSectionAccordion(section)) {
      return notificationGateAllows(section.notificationGateKey, gates) &&
        legacyPageAllows(section.legacyPage, legacyPagePermissions)
        ? [section]
        : []
    }

    if (!legacyPageAllows(section.legacyPage, legacyPagePermissions)) return []

    const children = filterNavItems(
      section.children,
      gates,
      legacyPagePermissions
    )
    return children.length > 0 ? [{ ...section, children }] : []
  })
}

// ---------------------------------------------------------------------------
// Nav configs
// ---------------------------------------------------------------------------

const adminNav: NavSection[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", legacyPage: "index.php" },
  {
    label: "Garderie Management",
    icon: Building2,
    children: [
      { title: "Branches Management", href: "/branches", icon: Building2, legacyPage: "branches.php" },
      { title: "Classes Management", href: "/classes", icon: School, legacyPage: "classes.php" },
      { title: "Accounting Management", href: "/accounting", icon: DollarSign, legacyPage: "accounting.php" },
      { title: "Monthly Attendance", href: "/reports/monthly", icon: CalendarDays, legacyPage: "Monthly_report.php" },
    ],
  },
  // "Classes" dynamic section inserted at runtime by getNavForRole
  {
    label: "Messages",
    icon: Inbox,
    children: [
      { title: "Inbox", href: "/messages/inbox", icon: Inbox, badgeKey: "unreadMessages" },
      { title: "Messages Portal", href: "/messages/compose", icon: Send, legacyPage: "message_portal.php" },
      { title: "Single Messaging", href: "/messages/compose/direct", icon: PenLine, legacyPage: "message_portal_single.php" },
      { title: "Sent Messages", href: "/messages/sent", icon: Send, legacyPage: "Msg_list.php" },
    ],
  },
  {
    label: "Children Management",
    icon: Baby,
    children: [
      { title: "Children Listing", href: "/children", icon: Baby, legacyPage: "children.php" },
      { title: "Children Drafts", href: "/children/drafts", icon: FileEdit, legacyPage: "children_drafts.php" },
      { title: "Calls Management", href: "/calls", icon: Phone, legacyPage: "calls.php" },
      {
        title: "Daily Reports",
        icon: FileText,
        children: [
          { title: "Daily Reports", href: "/daily-reports", icon: FileText, badgeKey: "missingReports", legacyPage: "dailyreports.php" },
          { title: "Drafts", href: "/daily-reports/drafts", icon: FileEdit, legacyPage: "dailyreportsd.php" },
          { title: "Absent Reports", href: "/absent-reports", icon: CalendarDays, legacyPage: "absentreports.php" },
          { title: "Absent Drafts", href: "/absent-reports/drafts", icon: FileEdit, legacyPage: "absentreportsD.php" },
        ],
      },
      {
        title: "Medical Reports",
        icon: Stethoscope,
        legacyPage: "medical_reports.php",
        children: [
          { title: "General Info", href: "/medical/general", icon: Stethoscope },
          { title: "Suffering Form", href: "/medical/suffering", icon: Heart },
          { title: "Medical Visits", href: "/medical/visits", icon: Stethoscope },
          { title: "Vaccinations", href: "/medical/vaccinations", icon: Syringe },
          { title: "Accident Report", href: "/medical/accidents", icon: AlertTriangle },
        ],
      },
      { title: "Parent Users", href: "/settings/parent-users", icon: Users, legacyPage: "parent_users.php" },
    ],
  },
  {
    label: "Food Management",
    icon: UtensilsCrossed,
    children: [
      { title: "Food Listing", href: "/food", icon: UtensilsCrossed, legacyPage: "food.php" },
      { title: "Food Calendar", href: "/food/calendar", icon: Calendar, legacyPage: "food_calendar.php" },
    ],
  },
  {
    label: "Employees Management",
    icon: UserCheck,
    children: [
      { title: "Nurses Listing", href: "/employees/nurses", icon: Stethoscope, legacyPage: "nurses.php" },
      { title: "Doctors Listing", href: "/employees/doctors", icon: Pill, legacyPage: "doctors.php" },
      { title: "Managers Listing", href: "/employees/managers", icon: UserCheck, legacyPage: "managers.php" },
      { title: "Teachers Listing", href: "/employees/teachers", icon: GraduationCap, legacyPage: "teachers.php" },
      { title: "Teachers Calendar", href: "/employees/calendar", icon: Calendar, legacyPage: "calendar.php" },
      { title: "Upload Attendance", href: "/employees/attendance", icon: Upload, legacyPage: "attendance.php" },
      { title: "Attendance Logs", href: "/employees/attendance-logs", icon: Clock, legacyPage: "PA_logs.php" },
    ],
  },
  {
    label: "Setting",
    icon: Settings,
    children: [
      { title: "Holiday Calendar", href: "/settings/holidays", icon: Calendar, legacyPage: "holiday_calendar.php" },
      { title: "Events Calendar", href: "/settings/events", icon: CalendarDays, legacyPage: "NotifCalendar.php" },
      {
        title: "Address Management",
        icon: MapPin,
        legacyPage: "Address.php",
        children: [
          { title: "Mouhafaza", href: "/settings/regions", icon: Globe },
          { title: "Quadaa", href: "/settings/zones", icon: MapIcon },
          { title: "Region", href: "/settings/areas", icon: MapPin },
        ],
      },
      {
        title: "Notifications",
        icon: Bell,
        legacyPage: "Alarms.php",
        children: [
          { title: "Overview", href: "/alarms", icon: Bell, badgeKey: "activeAlarms", notificationGateKey: "general" },
          { title: "Birthdays", href: "/alarms/birthdays", icon: Cake, notificationGateKey: "birthdays" },
          { title: "Assessments", href: "/alarms/assessments", icon: ClipboardList, notificationGateKey: "assessments" },
          { title: "Vaccinations", href: "/alarms/vaccinations", icon: Syringe, notificationGateKey: "vaccinations" },
          { title: "Medical", href: "/alarms/medical", icon: Stethoscope, notificationGateKey: "medical" },
          { title: "Medicine", href: "/alarms/medicine", icon: Pill, notificationGateKey: "medicine" },
          { title: "Events", href: "/alarms/events", icon: CalendarDays, notificationGateKey: "events" },
          { title: "Insurance", href: "/alarms/insurance", icon: Shield, notificationGateKey: "insurance" },
          { title: "Payments", href: "/alarms/payments", icon: DollarSign, notificationGateKey: "payments" },
          { title: "Requests", href: "/alarms/requests", icon: Send },
          { title: "Messages", href: "/alarms/msg", icon: MessageSquare, badgeKey: "unreadMessages" },
          { title: "Others", href: "/alarms/others", icon: AlertTriangle },
          { title: "Contracts", href: "/alarms/contracts", icon: FileText },
        ],
      },
      { title: "New Academic Year", href: "/settings/new-year", icon: GraduationCap, legacyPage: "newyear.php" },
    ],
  },
]

const teacherNav: NavSection[] = [
  { label: "Today", icon: Sun, href: "/today" },
  {
    label: "Daily Operations",
    icon: FileText,
    children: [
      { title: "Daily Reports", href: "/daily-reports", icon: FileText, badgeKey: "missingReports", legacyPage: "dailyreports.php" },
      { title: "Drafts", href: "/daily-reports/drafts", icon: FileEdit, legacyPage: "dailyreportsd.php" },
      { title: "Absent Reports", href: "/absent-reports", icon: CalendarDays, legacyPage: "absentreports.php" },
    ],
  },
  {
    label: "Children",
    icon: Baby,
    children: [
      { title: "Children Listing", href: "/children", icon: Baby, legacyPage: "children.php" },
    ],
  },
  {
    label: "Communication",
    icon: Inbox,
    children: [
      { title: "Messages", href: "/messages/inbox", icon: Inbox, badgeKey: "unreadMessages" },
      { title: "Notifications", href: "/alarms", icon: Bell, badgeKey: "activeAlarms", notificationGateKey: "general", legacyPage: "Alarms.php" },
    ],
  },
]

const nurseNav: NavSection[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", legacyPage: "index.php" },
  {
    label: "Health",
    icon: Stethoscope,
    legacyPage: "medical_reports.php",
    children: [
      { title: "General Info", href: "/medical/general", icon: Stethoscope },
      { title: "Vaccinations", href: "/medical/vaccinations", icon: Syringe },
      { title: "Accidents", href: "/medical/accidents", icon: AlertTriangle },
      { title: "Conditions", href: "/medical/conditions", icon: Pill },
    ],
  },
  {
    label: "Children",
    icon: Baby,
    children: [
      { title: "All Children", href: "/children", icon: Baby, legacyPage: "children.php" },
    ],
  },
  {
    label: "Communication",
    icon: Inbox,
    children: [
      { title: "Messages", href: "/messages/inbox", icon: Inbox, badgeKey: "unreadMessages" },
      { title: "Notifications", href: "/alarms", icon: Bell, badgeKey: "activeAlarms", notificationGateKey: "general", legacyPage: "Alarms.php" },
    ],
  },
]

function getNavForRole(
  role: UserRole,
  classes?: SidebarClassInfo[],
  branches?: SidebarBranchInfo[],
  notificationGates?: LegacyNotificationGateVisibility | null,
  legacyPagePermissions?: LegacyPagePermissionMap | null
): NavSection[] {
  let sections: NavSection[]
  switch (role) {
    case "TEACHER":
      sections = [...teacherNav]
      break
    case "NURSE":
    case "DOCTOR":
      sections = [...nurseNav]
      break
    case "ADMIN":
    case "MANAGER":
    default:
      sections = [...adminNav]
      break
  }

  // Insert dynamic "Classes" section for admin/manager
  if ((role === "ADMIN" || role === "MANAGER") && classes && classes.length > 0) {
    // Group classes by branch
    const byBranch = new Map<string, { branchId: string; branchName: string; items: NavLeaf[] }>()
    for (const c of classes) {
      let group = byBranch.get(c.branch.id)
      if (!group) {
        group = { branchId: c.branch.id, branchName: c.branch.name, items: [] }
        byBranch.set(c.branch.id, group)
      }
      group.items.push({ title: c.name, href: `/classes/${c.id}`, icon: School })
    }

    const classChildren: NavItem[] = []
    for (const group of byBranch.values()) {
      if (byBranch.size === 1) {
        // Single branch — flatten
        classChildren.push(...group.items)
      } else {
        classChildren.push({
          title: group.branchName,
          icon: Building2,
          children: group.items,
        })
      }
    }

    const classesSection: NavSection = {
      label: "Classes",
      icon: School,
      children: classChildren,
    }

    // Insert after "Garderie Management" (index 1 in admin nav)
    const garderieIdx = sections.findIndex((s) => s.label === "Garderie Management")
    if (garderieIdx !== -1) {
      sections.splice(garderieIdx + 1, 0, classesSection)
    } else {
      sections.push(classesSection)
    }
  }

  if ((role === "ADMIN" || role === "MANAGER") && branches && branches.length > 0) {
    sections = sections.map((section) => {
      if (!isSectionAccordion(section) || section.label !== "Food Management") {
        return section
      }

      return {
        ...section,
        children: section.children.map((item) => {
          if (isAccordion(item) || item.title !== "Food Calendar") {
            return item
          }

          return {
            title: "Food Calendar",
            icon: Calendar,
            legacyPage: "food_calendar.php",
            children: branches.map((branch) => ({
              title: branch.name,
              href: `/food/calendar?branch=${encodeURIComponent(branch.id)}`,
              icon: Building2,
              legacyPage: "food_calendar.php",
            })),
          }
        }),
      }
    })
  }

  return filterNavSections(sections, notificationGates, legacyPagePermissions)
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
// Quick actions per role
// ---------------------------------------------------------------------------

interface QuickAction {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

function getQuickActionsForRole(role: UserRole): QuickAction[] {
  switch (role) {
    case "TEACHER":
      return [{ title: "New Daily Report", icon: Plus, href: "/daily-reports/new" }]
    case "NURSE":
    case "DOCTOR":
      return [{ title: "Log Accident", icon: Plus, href: "/medical/accidents" }]
    case "ADMIN":
    case "MANAGER":
    default:
      return [{ title: "New Daily Report", icon: Plus, href: "/daily-reports/new" }]
  }
}

// ---------------------------------------------------------------------------
// Recursive rendering components
// ---------------------------------------------------------------------------

function NavBadge({ badgeKey, badges }: { badgeKey?: keyof SidebarBadges; badges?: SidebarBadges }) {
  if (!badgeKey || !badges) return null
  const count = badges[badgeKey]
  if (!count || count <= 0) return null
  return (
    <Badge
      variant="secondary"
      className={`ml-auto min-w-5 h-5 justify-center rounded-full border px-1.5 py-0 text-[10px] font-bold tabular-nums ${badgeColors[badgeKey]}`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  )
}

/** Renders a leaf or nested accordion inside SidebarMenuSub */
function NavItemRenderer({
  item,
  pathname,
  searchParams,
  badges,
}: {
  item: NavItem
  pathname: string
  searchParams: URLSearchParams
  badges?: SidebarBadges
}) {
  if (!isAccordion(item)) {
    // Leaf item
    const active = isLeafActive(item.href, pathname, searchParams)
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          size="sm"
          isActive={active}
          className={
            active
              ? "font-medium text-white bg-[#3e4b5c] border-l-4 border-l-[#1caf9a] rounded-none"
              : "hover:bg-[#2c3542] rounded-none"
          }
        >
          <Link href={item.href}>
            {item.icon && <item.icon className="size-3.5 shrink-0" />}
            <span className="truncate">{item.title}</span>
            <NavBadge badgeKey={item.badgeKey} badges={badges} />
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  // Nested accordion (depth 2+)
  const isOpen = hasActiveChild(item.children, pathname, searchParams)
  return (
    <SidebarMenuSubItem>
      <Collapsible defaultOpen={isOpen} className="group/subcollapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            size="sm"
            className="cursor-pointer w-full hover:bg-[#2c3542] rounded-none"
          >
            {item.icon && <item.icon className="size-3.5 shrink-0" />}
            <span className="flex-1 truncate">{item.title}</span>
            <ChevronRight className="ml-auto size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-0 pl-3 border-l-0">
            {item.children.map((child) => (
              <NavItemRenderer
                key={isAccordion(child) ? child.title : child.href}
                item={child}
                pathname={pathname}
                searchParams={searchParams}
                badges={badges}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  )
}

/** Renders a top-level nav section: flat link or accordion */
function NavSectionRenderer({
  section,
  pathname,
  searchParams,
  badges,
}: {
  section: NavSection
  pathname: string
  searchParams: URLSearchParams
  badges?: SidebarBadges
}) {
  if (!isSectionAccordion(section)) {
    // Flat top-level link
    const active = isLeafActive(section.href, pathname, searchParams)
    return (
      <SidebarMenuItem className="border-t border-[#3f4b5a]">
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={section.label}
          className={
            active
              ? "relative bg-[#1caf9a] text-white font-medium rounded-none transition-all duration-200"
              : "relative text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-[#2c3542] rounded-none transition-all duration-200"
          }
        >
          <Link href={section.href}>
            <section.icon
              className={`size-[18px] shrink-0 ${
                active ? "text-white" : "text-[#606c7d]"
              }`}
            />
            <span className="flex-1 truncate text-[13px]">{section.label}</span>
            {"badgeKey" in section && section.badgeKey && (
              <NavBadge badgeKey={section.badgeKey} badges={badges} />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Accordion section
  const isOpen = hasActiveChild(section.children, pathname, searchParams)
  return (
    <Collapsible defaultOpen={isOpen} asChild className="group/collapsible">
      <SidebarMenuItem className="border-t border-[#3f4b5a]">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.label}
            className="relative text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-[#2c3542] rounded-none transition-all duration-200"
          >
            <section.icon className="size-[18px] shrink-0 text-[#606c7d]" />
            <span className="flex-1 truncate text-[13px]">{section.label}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {section.children.map((item) => (
              <NavItemRenderer
                key={isAccordion(item) ? item.title : item.href}
                item={item}
                pathname={pathname}
                searchParams={searchParams}
                badges={badges}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  userRole: UserRole
  badges?: SidebarBadges
  classes?: SidebarClassInfo[]
  branches?: SidebarBranchInfo[]
  notificationGates?: LegacyNotificationGateVisibility | null
  legacyPagePermissions?: LegacyPagePermissionMap | null
}

const TABLET_MAX = 1024

export function AppSidebar({
  userRole,
  badges,
  classes,
  branches,
  notificationGates,
  legacyPagePermissions,
}: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { setOpen } = useSidebar()
  const sections = getNavForRole(
    userRole,
    classes,
    branches,
    notificationGates,
    legacyPagePermissions
  )
  const quickActions = getQuickActionsForRole(userRole)
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
      className="top-(--navbar-height) h-[calc(100svh-var(--navbar-height))]"
      aria-label="Main navigation"
    >
      {/* ── Brand header ── */}
      <SidebarHeader className="px-4 py-4 bg-[#2b3643]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold shadow-md ring-1 ring-white/10 transition-shadow duration-200 group-hover:shadow-sm group-hover:ring-white/20">
            K
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-[15px] font-bold leading-tight text-sidebar-accent-foreground tracking-tight">
              KiddzOnline
            </span>
            <span className="text-[10px] font-medium leading-none text-sidebar-foreground/70 tracking-wider uppercase">
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
                    className="text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary rounded-none transition-all duration-200 border border-sidebar-primary/20 border-dashed"
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
        <SidebarGroup className="py-1">
          <SidebarMenu className="space-y-0">
            {sections.map((section) => (
              <NavSectionRenderer
                key={section.label}
                section={section}
                pathname={pathname}
                searchParams={searchParams}
                badges={badges}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      {/* ── Footer: Quick Actions + User ── */}
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 bg-[#2b3643]">
        {/* Quick Actions shortcut */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Actions ⌘K"
              aria-label="Quick Actions (⌘K)"
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-[#2c3542] rounded-none transition-all duration-200"
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                )
              }}
            >
              <Search className="size-[18px] shrink-0" />
              <span className="text-[13px]">Quick Actions</span>
              <kbd className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/70 border border-sidebar-border">
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
                  className="rounded-none hover:bg-[#2c3542] transition-all duration-200 data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                    {userInitial}
                  </div>
                  <div className="flex flex-col flex-1 text-left leading-tight">
                    <span className="text-[13px] font-medium text-sidebar-accent-foreground truncate">
                      {userName}
                    </span>
                    <span className="text-[11px] text-sidebar-foreground/70 truncate">
                      {roleLabels[userRole]}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/70" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-sm"
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
                  <Link href="/settings.php">Settings</Link>
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

// Export types and helpers for mobile nav
export { getNavForRole, type NavSection, type NavItem, type NavLeaf, type NavAccordionItem, type UserRole, isAccordion, isSectionAccordion, hasActiveChild, sectionHasActiveChild, isLeafActive, legacyPageAllows, badgeColors }
