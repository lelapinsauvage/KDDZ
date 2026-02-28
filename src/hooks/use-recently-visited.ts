"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface RecentPage {
  href: string
  title: string
  visitedAt: number
}

const STORAGE_KEY = "kiddz-recently-visited"
const MAX_PAGES = 8

/** Map pathname segments to human-readable titles */
function pathToTitle(pathname: string): string | null {
  // Skip root and non-meaningful paths
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/today") return null

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  // Skip detail pages with dynamic IDs (UUIDs, numbers)
  const lastSegment = segments[segments.length - 1]
  if (/^[0-9a-f-]{8,}$/i.test(lastSegment) || /^\d+$/.test(lastSegment)) return null

  const titleMap: Record<string, string> = {
    "daily-reports": "Daily Reports",
    "daily-reports/batch": "Batch Reports",
    "daily-reports/new": "New Daily Report",
    "daily-reports/drafts": "Report Drafts",
    "absent-reports": "Attendance",
    "absent-reports/new": "New Absence",
    children: "All Children",
    "children/new": "New Child",
    "children/drafts": "Child Drafts",
    "food/calendar": "Food Calendar",
    food: "Food Items",
    "medical/general": "Medical Records",
    "medical/conditions": "Conditions",
    "medical/visits": "Medical Visits",
    "medical/vaccinations": "Vaccinations",
    "medical/accidents": "Accidents",
    "messages/inbox": "Inbox",
    "messages/sent": "Sent Messages",
    "messages/compose": "New Message",
    alarms: "Notifications",
    accounting: "Accounting",
    assessments: "Assessments",
    branches: "Branches & Classes",
    "employees/staff": "Staff",
    "employees/teachers": "Teachers",
    "employees/nurses": "Nurses",
    "employees/doctors": "Doctors",
    "employees/managers": "Managers",
    settings: "Settings",
    "settings/parent-users": "Parent Users",
    "settings/export": "Data Export",
    profile: "Profile",
  }

  // Try longest match first
  const path = segments.join("/")
  if (titleMap[path]) return titleMap[path]

  // Fall back to last meaningful segment, titlecased
  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function loadFromStorage(): RecentPage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(pages: RecentPage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function useRecentlyVisited() {
  const pathname = usePathname()
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])

  // Load on mount
  useEffect(() => {
    setRecentPages(loadFromStorage())
  }, [])

  // Track page visits
  useEffect(() => {
    const title = pathToTitle(pathname)
    if (!title) return

    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.href !== pathname)
      const updated = [{ href: pathname, title, visitedAt: Date.now() }, ...filtered].slice(0, MAX_PAGES)
      saveToStorage(updated)
      return updated
    })
  }, [pathname])

  const clearRecent = useCallback(() => {
    setRecentPages([])
    saveToStorage([])
  }, [])

  return { recentPages, clearRecent }
}
