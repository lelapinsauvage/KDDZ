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

function isSubCollapsible(item: NavSubItem | NavSubCollapsible): item is NavSubCollapsible {
  return "items" in item
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Garderie Management",
    icon: Building2,
    items: [
      { title: "Branches Management", href: "/branches" },
      { title: "Classes Management", href: "/classes" },
      { title: "Accounting Management", href: "/accounting" },
      { title: "Monthly Attendance", href: "/reports/monthly" },
    ],
  },
  {
    title: "Messages",
    icon: Inbox,
    items: [
      { title: "Inbox", href: "/messages/inbox" },
      { title: "Messages Portal", href: "/messages/compose" },
      { title: "Direct Message", href: "/messages/compose/direct" },
      { title: "Sent Messages", href: "/messages/sent" },
    ],
  },
  {
    title: "Children Management",
    icon: Users,
    items: [
      { title: "Children Listing", href: "/children" },
      { title: "Children Drafts", href: "/children/drafts" },
      { title: "Daily Reports", href: "/daily-reports" },
      { title: "Draft Daily Reports", href: "/daily-reports/drafts" },
      { title: "Absent Reports", href: "/absent-reports" },
      { title: "Draft Absent Reports", href: "/absent-reports/drafts" },
      { title: "Medical General", href: "/medical/general" },
      { title: "Medical Conditions", href: "/medical/conditions" },
      { title: "Medical Visits", href: "/medical/visits" },
      { title: "Vaccinations", href: "/medical/vaccinations" },
      { title: "Accident Reports", href: "/medical/accidents" },
      { title: "Parent Users", href: "/settings/parent-users" },
    ],
  },
  {
    title: "Food Management",
    icon: UtensilsCrossed,
    items: [
      { title: "Food Listing", href: "/food" },
      { title: "Food Calendar", href: "/food/calendar" },
    ],
  },
  {
    title: "Employees",
    icon: GraduationCap,
    items: [
      { title: "Nurses", href: "/employees/nurses" },
      { title: "Doctors", href: "/employees/doctors" },
      { title: "Managers", href: "/employees/managers" },
      { title: "Teachers", href: "/employees/teachers" },
      { title: "Teachers Calendar", href: "/employees/calendar" },
      { title: "Upload Attendance", href: "/employees/attendance" },
      { title: "Attendance Logs", href: "/employees/attendance-logs" },
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
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "Holiday Calendar", href: "/settings/holidays" },
      { title: "Events Calendar", href: "/settings/events" },
      { title: "Zones (Mouhafaza)", href: "/settings/zones" },
      { title: "Areas (Quadaa)", href: "/settings/areas" },
      { title: "Regions", href: "/settings/regions" },
      {
        title: "Alarms",
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
      className="top-[46px] h-[calc(100svh-46px)]"
    >
      <SidebarHeader className="pt-3">
        <BranchYearSelector />
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs tracking-wider text-[#6f7b8a] font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) =>
              item.href ? (
                /* Simple link item (Dashboard) */
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={
                      pathname === item.href
                        ? "bg-[#1caf9a] text-white hover:bg-[#1caf9a] hover:text-white"
                        : ""
                    }
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                /* Collapsible group */
                <CollapsibleNavItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                />
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
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
  /* Check if any sub-item is active to auto-expand */
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
          <SidebarMenuButton tooltip={item.title}>
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
                        ? "bg-[#1caf9a] text-white hover:bg-[#1caf9a] hover:text-white"
                        : ""
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
          <SidebarMenuSubButton className="cursor-pointer">
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
                      ? "bg-[#1caf9a] text-white hover:bg-[#1caf9a] hover:text-white"
                      : ""
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
