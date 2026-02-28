"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Baby,
  FileText,
  Loader2,
  UserCheck,
  Plus,
  ClipboardList,
  AlertTriangle,
  Stethoscope,
  DollarSign,
  Inbox,
  Zap,
  Clock,
  Sparkles,
  Search,
  ArrowRight,
  Calendar,
  Hash,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { globalSearch, type GlobalSearchResult } from "@/lib/actions/search"
import { getInitials, getAvatarColor } from "@/components/children/children-columns"

// ── localStorage keys ──────────────────────────

const RECENT_KEY = "garderie-recent-pages"
const RECENT_SEARCHES_KEY = "garderie-recent-searches"
const MAX_RECENT = 5
const MAX_RECENT_SEARCHES = 5

function getRecentPages(): Array<{ name: string; href: string }> {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentPage(name: string, href: string) {
  if (typeof window === "undefined") return
  try {
    const recent = getRecentPages().filter((p) => p.href !== href)
    recent.unshift({ name, href })
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {
    // ignore
  }
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  if (typeof window === "undefined") return
  const trimmed = query.trim()
  if (trimmed.length < 2) return
  try {
    const recent = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
    recent.unshift(trimmed)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)))
  } catch {
    // ignore
  }
}

// ── Static data ────────────────────────────────

const quickActions = [
  { name: "New Daily Report", href: "/daily-reports/new", icon: FileText, keywords: "create add report daily" },
  { name: "Batch Daily Reports", href: "/daily-reports/batch", icon: ClipboardList, keywords: "batch bulk class reports start" },
  { name: "Report Absence", href: "/absent-reports/new", icon: AlertTriangle, keywords: "create add absence absent" },
  { name: "Record Accident", href: "/medical/accidents", icon: AlertTriangle, keywords: "create add accident incident injury" },
  { name: "Add Medical Record", href: "/medical/general", icon: Stethoscope, keywords: "create add medical health record" },
  { name: "Compose Message", href: "/messages/compose", icon: Inbox, keywords: "create send write message email" },
  { name: "New Payment", href: "/accounting", icon: DollarSign, keywords: "create add payment invoice fee" },
  { name: "Register Child", href: "/children/new", icon: Plus, keywords: "create add new child enroll register" },
  { name: "View Calendar", href: "/food/calendar", icon: Calendar, keywords: "calendar food menu schedule" },
]

const workflowShortcuts = [
  { name: "Start my day", href: "/today", icon: Sparkles, keywords: "start day morning begin" },
  { name: "Quick attendance", href: "/today", icon: Sparkles, keywords: "attendance check mark present" },
  { name: "Reports for class", href: "/daily-reports/batch", icon: Sparkles, keywords: "reports class batch group" },
]

const pages = [
  { name: "Today", href: "/today", group: "Overview" },
  { name: "Dashboard", href: "/dashboard", group: "Overview" },
  { name: "All Children", href: "/children", group: "Children" },
  { name: "Parent Users", href: "/settings/parent-users", group: "Children" },
  { name: "Daily Reports", href: "/daily-reports", group: "Daily Ops" },
  { name: "Attendance & Absences", href: "/absent-reports", group: "Daily Ops" },
  { name: "Food Calendar", href: "/food/calendar", group: "Daily Ops" },
  { name: "Medical Records", href: "/medical/general", group: "Health" },
  { name: "Medical Conditions", href: "/medical/conditions", group: "Health" },
  { name: "Medical Visits", href: "/medical/visits", group: "Health" },
  { name: "Vaccinations", href: "/medical/vaccinations", group: "Health" },
  { name: "Accidents", href: "/medical/accidents", group: "Health" },
  { name: "Accounting", href: "/accounting", group: "Finance" },
  { name: "Staff", href: "/employees/staff", group: "Staff & Setup" },
  { name: "Branches & Classes", href: "/branches", group: "Staff & Setup" },
  { name: "Assessments", href: "/assessments", group: "Staff & Setup" },
  { name: "Messages", href: "/messages/inbox", group: "Staff & Setup" },
  { name: "Sent Messages", href: "/messages/sent", group: "Staff & Setup" },
  { name: "Notifications", href: "/alarms", group: "Staff & Setup" },
  { name: "Settings", href: "/settings/nursery", group: "Staff & Setup" },
]

// ── Staff role colors ──────────────────────────

const ROLE_COLORS: Record<string, string> = {
  teacher: "bg-amber-500",
  nurse: "bg-emerald-500",
  doctor: "bg-blue-500",
  manager: "bg-violet-500",
}

// ── Component ──────────────────────────────────

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult>({ children: [], employees: [] })
  const [loading, setLoading] = useState(false)
  const [recentPages, setRecentPages] = useState<Array<{ name: string; href: string }>>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Load recents on open
  useEffect(() => {
    if (open) {
      setRecentPages(getRecentPages())
      setRecentSearches(getRecentSearches())
    }
  }, [open])

  // CMD+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  // Debounced entity search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setResults({ children: [], employees: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query)
        setResults(data)
      } catch {
        setResults({ children: [], employees: [] })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelect = useCallback(
    (href: string, name?: string) => {
      if (name) addRecentPage(name, href)
      if (query.trim().length >= 2) addRecentSearch(query.trim())
      onOpenChange(false)
      setQuery("")
      setResults({ children: [], employees: [] })
      router.push(href)
    },
    [router, onOpenChange, query],
  )

  const handleRecentSearchSelect = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery)
    },
    [],
  )

  const handleOpenChange = useCallback((value: boolean) => {
    onOpenChange(value)
    if (!value) {
      setQuery("")
      setResults({ children: [], employees: [] })
    }
  }, [onOpenChange])

  const hasEntityResults = results.children.length > 0 || results.employees.length > 0
  const isEmptyQuery = query.trim().length === 0
  const isSearching = query.trim().length >= 2
  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search pages, children, employees, or run quick actions"
      className="sm:max-w-[560px]"
    >
      <CommandInput
        placeholder="Search children, staff, pages, or actions..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {/* Custom empty state — only when searching and done loading */}
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Searching...</span>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a child&apos;s name, staff member, or page name
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {[
                  { label: "All Children", href: "/children" },
                  { label: "Staff", href: "/employees/staff" },
                  { label: "Daily Reports", href: "/daily-reports" },
                ].map((s) => (
                  <button
                    key={s.href}
                    onClick={() => handleSelect(s.href, s.label)}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s.label}
                    <ArrowRight className="size-3" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            "Type to search..."
          )}
        </CommandEmpty>

        {/* ── Recent searches — shown with empty query ── */}
        {isEmptyQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((s) => (
                <CommandItem
                  key={`rs-${s}`}
                  value={`recent-search ${s}`}
                  onSelect={() => handleRecentSearchSelect(s)}
                >
                  <Search className="size-4 text-muted-foreground/60" />
                  <span>{s}</span>
                  <ArrowRight className="ml-auto size-3 text-muted-foreground/40" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Recent pages — shown with empty query ── */}
        {isEmptyQuery && recentPages.length > 0 && (
          <>
            <CommandGroup heading="Recently Visited">
              {recentPages.map((page) => (
                <CommandItem
                  key={`recent-${page.href}`}
                  value={`recent ${page.name}`}
                  onSelect={() => handleSelect(page.href, page.name)}
                >
                  <Clock className="size-4 text-muted-foreground/60" />
                  <span>{page.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Loading skeletons — while fetching search results ── */}
        {loading && isSearching && !hasEntityResults && (
          <>
            <CommandGroup heading="Children">
              {[1, 2, 3].map((i) => (
                <CommandItem key={`skel-child-${i}`} disabled value={`loading-child-${i}`} className="gap-3">
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Staff">
              {[1, 2].map((i) => (
                <CommandItem key={`skel-staff-${i}`} disabled value={`loading-staff-${i}`} className="gap-3">
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ── Children results with avatars ── */}
        {results.children.length > 0 && (
          <>
            <CommandGroup heading="Children">
              {results.children.map((child) => {
                const nameParts = child.name.split(" ")
                const firstName = nameParts[0] || ""
                const lastName = nameParts.slice(1).join(" ") || ""
                const initials = getInitials(firstName, lastName)
                const avatarBg = getAvatarColor(child.name)

                return (
                  <CommandItem
                    key={child.id}
                    value={`child ${child.name} ${child.description}`}
                    onSelect={() => handleSelect(child.href, child.name)}
                    className="gap-3 py-2.5"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarBg}`}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{child.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{child.description}</span>
                    </div>
                    <Baby className="size-4 shrink-0 text-muted-foreground/40" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Staff results with avatars ── */}
        {results.employees.length > 0 && (
          <>
            <CommandGroup heading="Staff">
              {results.employees.map((emp) => {
                const nameParts = emp.name.split(" ")
                const firstName = nameParts[0] || ""
                const lastName = nameParts.slice(1).join(" ") || ""
                const initials = getInitials(firstName, lastName)
                const roleBg = ROLE_COLORS[emp.type] || "bg-muted-foreground"

                return (
                  <CommandItem
                    key={`${emp.type}-${emp.id}`}
                    value={`employee ${emp.name} ${emp.description}`}
                    onSelect={() => handleSelect(emp.href, emp.name)}
                    className="gap-3 py-2.5"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${roleBg}`}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{emp.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{emp.description}</span>
                    </div>
                    <UserCheck className="size-4 shrink-0 text-muted-foreground/40" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Quick Actions ── */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={`action ${action.name} ${action.keywords}`}
              onSelect={() => handleSelect(action.href, action.name)}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="size-3.5 text-primary" />
              </div>
              <span>{action.name}</span>
              <Zap className="ml-auto size-3 text-muted-foreground/40" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* ── Workflow shortcuts ── */}
        <CommandGroup heading="Workflows">
          {workflowShortcuts.map((shortcut) => (
            <CommandItem
              key={`workflow-${shortcut.name}`}
              value={`workflow ${shortcut.name} ${shortcut.keywords}`}
              onSelect={() => handleSelect(shortcut.href, shortcut.name)}
            >
              <shortcut.icon className="size-4 text-primary/70" />
              <span>{shortcut.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* ── Static pages ── */}
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={`${page.name} ${page.group}`}
              onSelect={() => handleSelect(page.href, page.name)}
            >
              <Hash className="size-4 text-muted-foreground/50" />
              <span>{page.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground/50">{page.group}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* ── Footer hint ── */}
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 text-[10px] font-medium">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 text-[10px] font-medium">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 text-[10px] font-medium">esc</kbd>
            close
          </span>
        </div>
      </div>
    </CommandDialog>
  )
}
