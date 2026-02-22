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

const quickActions = [
  { name: "New Daily Report", href: "/daily-reports/new", icon: FileText, keywords: "create add report daily" },
  { name: "Batch Daily Reports", href: "/daily-reports/batch", icon: ClipboardList, keywords: "batch bulk class reports start" },
  { name: "Report Absence", href: "/absent-reports/new", icon: AlertTriangle, keywords: "create add absence absent" },
  { name: "Record Accident", href: "/medical/accidents", icon: AlertTriangle, keywords: "create add accident incident injury" },
  { name: "Add Medical Record", href: "/medical/general", icon: Stethoscope, keywords: "create add medical health record" },
  { name: "Compose Message", href: "/messages/compose", icon: Inbox, keywords: "create send write message email" },
  { name: "New Payment", href: "/accounting", icon: DollarSign, keywords: "create add payment invoice fee" },
  { name: "Register Child", href: "/children/new", icon: Plus, keywords: "create add new child enroll register" },
]

const pages = [
  { name: "Today", href: "/today", group: "Overview" },
  { name: "Dashboard", href: "/dashboard", group: "Overview" },
  { name: "All Children", href: "/children", group: "Children" },
  { name: "Daily Reports", href: "/daily-reports", group: "Children" },
  { name: "Absence Reports", href: "/absent-reports", group: "Children" },
  { name: "Medical Records", href: "/medical/general", group: "Health" },
  { name: "Medical Conditions", href: "/medical/conditions", group: "Health" },
  { name: "Medical Visits", href: "/medical/visits", group: "Health" },
  { name: "Vaccinations", href: "/medical/vaccinations", group: "Health" },
  { name: "Accidents", href: "/medical/accidents", group: "Health" },
  { name: "Messages Inbox", href: "/messages/inbox", group: "Communication" },
  { name: "Sent Messages", href: "/messages/sent", group: "Communication" },
  { name: "Branches", href: "/branches", group: "Management" },
  { name: "Classes", href: "/classes", group: "Management" },
  { name: "Staff", href: "/employees/staff", group: "Management" },
  { name: "Accounting", href: "/accounting", group: "Management" },
  { name: "Food Listing", href: "/food", group: "Management" },
  { name: "Food Calendar", href: "/food/calendar", group: "Management" },
  { name: "Assessments", href: "/assessments", group: "Management" },
  { name: "Notifications", href: "/alarms", group: "System" },
  { name: "Settings", href: "/settings/nursery", group: "System" },
]

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult>({ children: [], employees: [] })
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

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
    (href: string) => {
      onOpenChange(false)
      setQuery("")
      setResults({ children: [], employees: [] })
      router.push(href)
    },
    [router, onOpenChange],
  )

  const handleOpenChange = useCallback((value: boolean) => {
    onOpenChange(value)
    if (!value) {
      setQuery("")
      setResults({ children: [], employees: [] })
    }
  }, [onOpenChange])

  const hasEntityResults = results.children.length > 0 || results.employees.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search pages, children, employees, or run quick actions"
    >
      <CommandInput
        placeholder="Search or type an action..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {/* Quick Actions — shown prominently at top */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={`action ${action.name} ${action.keywords}`}
              onSelect={() => handleSelect(action.href)}
            >
              <action.icon className="size-4 text-primary" />
              <span>{action.name}</span>
              <Zap className="ml-auto size-3 text-muted-foreground/50" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Children results */}
        {results.children.length > 0 && (
          <CommandGroup heading="Children">
            {results.children.map((child) => (
              <CommandItem
                key={child.id}
                value={`child ${child.name} ${child.description}`}
                onSelect={() => handleSelect(child.href)}
              >
                <Baby className="size-4 text-muted-foreground" />
                <span>{child.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{child.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Employee results */}
        {results.employees.length > 0 && (
          <CommandGroup heading="Employees">
            {results.employees.map((emp) => (
              <CommandItem
                key={`${emp.type}-${emp.id}`}
                value={`employee ${emp.name} ${emp.description}`}
                onSelect={() => handleSelect(emp.href)}
              >
                <UserCheck className="size-4 text-muted-foreground" />
                <span>{emp.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{emp.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Loading indicator when there are page results but entities still loading */}
        {loading && !hasEntityResults && query.trim().length >= 2 && (
          <CommandGroup heading="Searching...">
            <CommandItem disabled value="loading">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-muted-foreground">Looking for matches...</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Static pages */}
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={`${page.name} ${page.group}`}
              onSelect={() => handleSelect(page.href)}
            >
              <FileText className="size-4 text-muted-foreground" />
              <span>{page.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{page.group}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
