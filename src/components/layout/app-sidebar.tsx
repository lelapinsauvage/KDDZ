"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  LayoutDashboard,
  Building2,
  Inbox,
  Users,
  UtensilsCrossed,
  GraduationCap,
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
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { BranchYearSelector } from "./branch-year-selector"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER"

interface NavSubItem {
  title: string
  href: string
}

interface NavSubCollapsible {
  title: string
  items: NavSubItem[]
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  items?: (NavSubItem | NavSubCollapsible)[]
  /** Which roles can see this item. If omitted, all roles can see it. */
  roles?: UserRole[]
}

interface NavGroup {
  label: string
  items: NavItem[]
  /** Which roles can see this group. If omitted, all roles can see it. */
  roles?: UserRole[]
}

function isSubCollapsible(item: NavSubItem | NavSubCollapsible): item is NavSubCollapsible {
  return "items" in item
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Today",
        icon: LayoutDashboard,
        href: "/today",
        roles: ["TEACHER"],
      },
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["ADMIN", "MANAGER", "NURSE", "DOCTOR"],
      },
    ],
  },
  {
    label: "Children",
    items: [
      {
        title: "Children",
        icon: Baby,
        items: [
          { title: "All Children", href: "/children" },
          { title: "Parent Users", href: "/settings/parent-users" },
        ],
        roles: ["ADMIN", "MANAGER", "NURSE", "DOCTOR"],
      },
      {
        title: "My Class",
        icon: Baby,
        href: "/children",
        roles: ["TEACHER"],
      },
      {
        title: "Daily Reports",
        icon: FileText,
        href: "/daily-reports",
      },
      {
        title: "Absences",
        icon: CalendarDays,
        href: "/absent-reports",
      },
    ],
  },
  {
    label: "Health",
    items: [
      {
        title: "Medical Records",
        icon: Stethoscope,
        items: [
          { title: "General", href: "/medical/general" },
          { title: "Conditions", href: "/medical/conditions" },
          { title: "Visits", href: "/medical/visits" },
        ],
      },
      {
        title: "Vaccinations",
        icon: Syringe,
        href: "/medical/vaccinations",
      },
      {
        title: "Accidents",
        icon: AlertTriangle,
        href: "/medical/accidents",
      },
    ],
    roles: ["ADMIN", "MANAGER", "NURSE", "DOCTOR"],
  },
  {
    label: "Communication",
    items: [
      {
        title: "Messages",
        icon: Inbox,
        items: [
          { title: "Inbox", href: "/messages/inbox" },
          { title: "Compose", href: "/messages/compose" },
          { title: "Sent", href: "/messages/sent" },
        ],
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Nursery",
        icon: Building2,
        items: [
          { title: "Branches", href: "/branches" },
          { title: "Classes", href: "/classes" },
          { title: "Monthly Attendance", href: "/reports/monthly" },
        ],
      },
      {
        title: "Staff",
        icon: UserCheck,
        href: "/employees/staff",
      },
      {
        title: "Accounting",
        icon: DollarSign,
        href: "/accounting",
      },
      {
        title: "Food & Menu",
        icon: UtensilsCrossed,
        items: [
          { title: "Food Listing", href: "/food" },
          { title: "Food Calendar", href: "/food/calendar" },
        ],
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Food Calendar",
        icon: UtensilsCrossed,
        href: "/food/calendar",
        roles: ["TEACHER"],
      },
      {
        title: "Assessments",
        icon: ClipboardList,
        href: "/assessments",
      },
    ],
    roles: ["ADMIN", "MANAGER", "TEACHER"],
  },
  {
    label: "System",
    items: [
      {
        title: "Notifications",
        icon: Bell,
        href: "/alarms",
      },
      {
        title: "Settings",
        icon: Settings,
        items: [
          { title: "Nursery", href: "/settings/nursery" },
          { title: "Holidays", href: "/settings/holidays" },
          { title: "Events", href: "/settings/events" },
          { title: "Zones", href: "/settings/zones" },
          { title: "Areas", href: "/settings/areas" },
          { title: "Regions", href: "/settings/regions" },
          { title: "Export", href: "/settings/export" },
        ],
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
]

/**
 * Filter nav groups and items based on user role.
 */
function getFilteredNav(role: UserRole): NavGroup[] {
  return navGroups
    .filter((group) => !group.roles || group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}

interface AppSidebarProps {
  userRole: UserRole
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname()
  const filteredGroups = getFilteredNav(userRole)

  return (
    <Sidebar
      collapsible="icon"
      className="top-[56px] h-[calc(100svh-56px)] border-r border-border"
    >
      <SidebarHeader className="pt-3">
        <BranchYearSelector />
      </SidebarHeader>
      <SidebarContent className="pt-1">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-semibold text-muted-foreground/70 px-3">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.href ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.title}
                      className={
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <CollapsibleNavItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                  />
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const isGroupActive = item.items?.some((sub) => {
    if (isSubCollapsible(sub)) {
      return sub.items.some((s) => pathname === s.href)
    }
    return pathname === sub.href || pathname.startsWith(sub.href + "/")
  })

  return (
    <Collapsible defaultOpen={isGroupActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={
              isGroupActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            <item.icon className="size-4" />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((sub) =>
              isSubCollapsible(sub) ? (
                <SubCollapsibleItem
                  key={sub.title}
                  sub={sub}
                  pathname={pathname}
                />
              ) : (
                <SidebarMenuSubItem key={sub.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === sub.href || pathname.startsWith(sub.href + "/")}
                    className={
                      pathname === sub.href || pathname.startsWith(sub.href + "/")
                        ? "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    <Link href={sub.href}>{sub.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SubCollapsibleItem({
  sub,
  pathname,
}: {
  sub: NavSubCollapsible
  pathname: string
}) {
  const isActive = sub.items.some((s) => pathname === s.href)

  return (
    <SidebarMenuSubItem>
      <Collapsible defaultOpen={isActive} className="group/sub-collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton className="cursor-pointer text-muted-foreground hover:text-foreground">
            <span>{sub.title}</span>
            <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {sub.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === subItem.href}
                  className={
                    pathname === subItem.href
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Link href={subItem.href}>{subItem.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  )
}
