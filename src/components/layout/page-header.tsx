"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ChevronRight, ArrowLeft } from "lucide-react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs: Breadcrumb[]
  actions?: ReactNode
  /** Show back button on mobile (for detail pages). Defaults to true if breadcrumbs has items. */
  showMobileBack?: boolean
}

/** Map route segments to human-readable labels for auto-generated breadcrumbs */
const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  today: "Today",
  "daily-reports": "Daily Reports",
  batch: "Batch",
  new: "New",
  drafts: "Drafts",
  "absent-reports": "Attendance",
  children: "Children",
  food: "Food",
  calendar: "Calendar",
  medical: "Health",
  general: "Medical Records",
  conditions: "Conditions",
  visits: "Visits",
  vaccinations: "Vaccinations",
  accidents: "Accidents",
  suffering: "Suffering",
  messages: "Messages",
  inbox: "Inbox",
  sent: "Sent",
  compose: "Compose",
  alarms: "Notifications",
  accounting: "Accounting",
  assessments: "Assessments",
  dates: "Dates",
  branches: "Branches",
  classes: "Classes",
  employees: "Employees",
  staff: "Staff",
  teachers: "Teachers",
  nurses: "Nurses",
  doctors: "Doctors",
  managers: "Managers",
  attendance: "Attendance",
  heatmap: "Heatmap",
  settings: "Settings",
  "parent-users": "Parent Users",
  export: "Export",
  holidays: "Holidays",
  "new-year": "New Academic Year",
  events: "Events",
  nursery: "Nursery",
  organizations: "Organizations",
  regions: "Regions",
  zones: "Zones",
  areas: "Areas",
  notifications: "Notification Settings",
  profile: "Profile",
  reports: "Reports",
  monthly: "Monthly",
  "monthly-branch": "Branch Report",
  "attendance-logs": "Attendance Logs",
}

/** Build breadcrumb trail from the current URL when explicit breadcrumbs are provided */
function buildFullBreadcrumbs(pathname: string, explicit: Breadcrumb[]): Breadcrumb[] {
  if (explicit.length === 0) return []

  // Derive parent segments from the pathname to fill in gaps
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return explicit

  const parentCrumbs: Breadcrumb[] = []
  let path = ""

  // Build breadcrumbs for all parent segments (not including the final one which is the current page)
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    path += `/${seg}`

    // Skip dynamic segments (UUIDs, numbers)
    if (/^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg)) continue

    const label = segmentLabels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

    // Don't duplicate if already in the explicit breadcrumbs
    const alreadyInExplicit = explicit.some((b) => b.href === path || b.label === label)
    if (!alreadyInExplicit) {
      parentCrumbs.push({ label, href: path })
    }
  }

  // Merge: parent auto-crumbs first, then the explicit ones
  // But avoid duplicates — if the first explicit crumb matches a parent, skip it
  const merged: Breadcrumb[] = [...parentCrumbs]
  for (const crumb of explicit) {
    const isDuplicate = merged.some((m) => m.href === crumb.href && m.label === crumb.label)
    if (!isDuplicate) {
      merged.push(crumb)
    }
  }

  return merged
}

export function PageHeader({ title, description, breadcrumbs, actions, showMobileBack }: PageHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const shouldShowBack = showMobileBack ?? breadcrumbs.length > 0

  // Build the full breadcrumb trail — always showing the path back
  const fullBreadcrumbs = buildFullBreadcrumbs(pathname, breadcrumbs)

  return (
    <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5">
      {/* Breadcrumbs — always show when there are items */}
      {fullBreadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 hidden items-center gap-1 text-[13px] text-muted-foreground sm:flex">
          <Link href="/dashboard" className="transition-colors hover:text-primary">
            Home
          </Link>
          {fullBreadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground/50" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile back button */}
          {shouldShowBack && (
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:hidden"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
