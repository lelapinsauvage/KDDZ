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
  MapPin,
  Baby,
  Send,
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { BranchYearSelector } from "./branch-year-selector"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
}

interface NavGroup {
  label: string
  items: NavItem[]
}

function isSubCollapsible(item: NavSubItem | NavSubCollapsible): item is NavSubCollapsible {
  return "items" in item
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
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
          { title: "Drafts", href: "/children/drafts" },
          { title: "Parent Users", href: "/settings/parent-users" },
        ],
      },
      {
        title: "Daily Reports",
        icon: FileText,
        items: [
          { title: "All Reports", href: "/daily-reports" },
          { title: "Drafts", href: "/daily-reports/drafts" },
        ],
      },
      {
        title: "Absences",
        icon: CalendarDays,
        items: [
          { title: "Absence Reports", href: "/absent-reports" },
          { title: "Drafts", href: "/absent-reports/drafts" },
        ],
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
          { title: "Direct Message", href: "/messages/compose/direct" },
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
        items: [
          { title: "Nurses", href: "/employees/nurses" },
          { title: "Doctors", href: "/employees/doctors" },
          { title: "Managers", href: "/employees/managers" },
          { title: "Teachers", href: "/employees/teachers" },
          { title: "Calendar", href: "/employees/calendar" },
          { title: "Upload Attendance", href: "/employees/attendance" },
          { title: "Attendance Logs", href: "/employees/attendance-logs" },
        ],
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
      },
      {
        title: "Assessments",
        icon: ClipboardList,
        items: [
          { title: "1-3 Months", href: "/assessments/1" },
          { title: "4-7 Months", href: "/assessments/2" },
          { title: "8-12 Months", href: "/assessments/3" },
          { title: "12-24 Months", href: "/assessments/4" },
          { title: "24-36 Months", href: "/assessments/5" },
          { title: "36-48 Months", href: "/assessments/6" },
          { title: "48-60 Months", href: "/assessments/7" },
          { title: "Assessment Dates", href: "/assessments/dates" },
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Settings",
        icon: Settings,
        items: [
          { title: "Holidays", href: "/settings/holidays" },
          { title: "Events", href: "/settings/events" },
          { title: "Zones", href: "/settings/zones" },
          { title: "Areas", href: "/settings/areas" },
          { title: "Regions", href: "/settings/regions" },
        ],
      },
      {
        title: "Notifications",
        icon: Bell,
        items: [
          { title: "Overview", href: "/alarms" },
          { title: "Birthday", href: "/alarms/birthdays" },
          { title: "Assessment", href: "/alarms/assessments" },
          { title: "Vaccinations", href: "/alarms/vaccinations" },
          { title: "Medical", href: "/alarms/medical" },
          { title: "Medicine", href: "/alarms/medicine" },
          { title: "Events", href: "/alarms/events" },
          { title: "Insurance", href: "/alarms/insurance" },
          { title: "Payments", href: "/alarms/payments" },
          { title: "Requests", href: "/alarms/requests" },
          { title: "Others", href: "/alarms/others" },
          { title: "Contracts", href: "/alarms/contracts" },
          { title: "Settings", href: "/alarms/settings" },
        ],
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="icon"
      className="top-[56px] h-[calc(100svh-56px)] border-r border-border"
    >
      <SidebarHeader className="pt-3">
        <BranchYearSelector />
      </SidebarHeader>
      <SidebarContent className="pt-1">
        {navGroups.map((group) => (
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
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className={
                        pathname === item.href
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
    return pathname === sub.href
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
                    isActive={pathname === sub.href}
                    className={
                      pathname === sub.href
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
