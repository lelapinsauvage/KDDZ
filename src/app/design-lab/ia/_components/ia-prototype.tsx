"use client"

import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  DoorOpen,
  FileBarChart,
  ListTodo,
  Menu,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type RoleId = "admin" | "manager" | "teacher" | "nurse" | "doctor"
type DomainId = "today" | "children" | "rooms" | "team" | "messages" | "finance" | "reports" | "settings"

type DomainDefinition = {
  label: string
  shortLabel: string
  purpose: string
  icon: typeof CalendarDays
  views: string[]
  records: string[]
}

type TaskDefinition = {
  id: string
  label: string
  context: string
  consequence: string
  domain: DomainId
  path: string
  due: string
  status: "urgent" | "forecast" | "required" | "waiting"
  roles: RoleId[]
}

const roleLabels: Record<RoleId, string> = {
  admin: "Administrator",
  manager: "Manager",
  teacher: "Teacher",
  nurse: "Nurse",
  doctor: "Doctor",
}

const domains: Record<DomainId, DomainDefinition> = {
  today: {
    label: "Today",
    shortLabel: "Today",
    purpose: "Understand the nursery now and resolve the most consequential current work.",
    icon: CalendarDays,
    views: ["Opening", "Live rooms", "My work", "Handover", "Recently handled"],
    records: ["Readiness event", "Room state", "Owned work", "Handover"],
  },
  children: {
    label: "Children",
    shortLabel: "Children",
    purpose: "Find a child or cohort, see current restrictions and work, then enter the right record.",
    icon: UsersRound,
    views: ["All children", "Attendance unknown", "Care incomplete", "Health and safety", "Assessment due", "Drafts"],
    records: ["Child", "Attendance", "Care report", "Absence", "Incident", "Assessment"],
  },
  rooms: {
    label: "Rooms",
    shortLabel: "Rooms",
    purpose: "Operate rosters, ratios, coverage, planning, capacity, menus, and branch evidence.",
    icon: DoorOpen,
    views: ["Live rooms", "Attendance", "Coverage", "Capacity and occupancy", "Planning", "Compliance"],
    records: ["Branch", "Room", "Ratio snapshot", "Cover assignment", "Menu", "Evidence item"],
  },
  team: {
    label: "Team",
    shortLabel: "Team",
    purpose: "Understand staff availability, qualification, schedule, attendance, and lifecycle.",
    icon: UserRoundCheck,
    views: ["All staff", "On duty", "Absent", "Coverage needed", "Schedules", "Expiring evidence"],
    records: ["Staff member", "Shift", "Qualification", "Attendance event", "Document"],
  },
  messages: {
    label: "Messages",
    shortLabel: "Messages",
    purpose: "Communicate with parents and staff while preserving audience, delivery, reply, and follow-up.",
    icon: MessageCircle,
    views: ["Inbox", "Needs reply", "Sent", "Drafts", "Calls", "Compose"],
    records: ["Thread", "Message", "Call", "Recipient group", "Delivery event"],
  },
  finance: {
    label: "Finance",
    shortLabel: "Finance",
    purpose: "Understand balances, reconcile payments, issue invoices, and resolve discrepancies.",
    icon: WalletCards,
    views: ["Overview", "Needs allocation", "Overdue", "Invoices", "Payments", "Families", "Exports"],
    records: ["Family account", "Invoice", "Payment", "Allocation", "Ledger event", "Receipt"],
  },
  reports: {
    label: "Reports",
    shortLabel: "Reports",
    purpose: "Answer a named historical, compliance, occupancy, care, finance, or inspection question.",
    icon: FileBarChart,
    views: ["Saved reports", "Attendance", "Occupancy", "Staffing", "Finance", "Compliance", "Inspection exports"],
    records: ["Report definition", "Export job", "Evidence manifest", "Generated package"],
  },
  settings: {
    label: "Settings",
    shortLabel: "Settings",
    purpose: "Change nursery, access, calendar, notification, storage, and legacy behavior intentionally.",
    icon: Settings,
    views: ["Nursery", "Organizations", "Access and roles", "Parent accounts", "Notifications", "School years", "Advanced"],
    records: ["Organization", "Capability", "User", "Policy", "Calendar", "System setting"],
  },
}

const roleNavigation: Record<RoleId, DomainId[]> = {
  admin: ["today", "children", "rooms", "team", "messages", "finance", "reports", "settings"],
  manager: ["today", "children", "rooms", "team", "messages", "finance", "reports", "settings"],
  teacher: ["today", "children", "messages"],
  nurse: ["today", "children", "messages"],
  doctor: ["today", "children", "messages"],
}

const roleBranches: Record<RoleId, string[]> = {
  admin: ["All branches", "Riverside", "Hamra"],
  manager: ["Riverside", "Hamra"],
  teacher: ["Riverside"],
  nurse: ["Riverside"],
  doctor: ["Riverside"],
}

const tasks: TaskDefinition[] = [
  {
    id: "accident-review",
    label: "Review Leo's playground accident",
    context: "Leo Dubois · Studio · submitted 08:44",
    consequence: "Parent acknowledgment remains pending until the manager review is recorded.",
    domain: "children",
    path: "Children / Leo Dubois / Health and safety / Accident 1047",
    due: "Review by 10:00",
    status: "urgent",
    roles: ["admin", "manager", "nurse", "doctor"],
  },
  {
    id: "meadow-cover",
    label: "Assign qualified cover to Meadow",
    context: "Meadow · Lina's break at 12:30",
    consequence: "The room is safe now but would be one qualified practitioner short.",
    domain: "rooms",
    path: "Rooms / Meadow / Coverage / 12:30-13:00",
    due: "Forecast in 3 hr 12 min",
    status: "forecast",
    roles: ["admin", "manager"],
  },
  {
    id: "care-reports",
    label: "Complete four daily care reports",
    context: "Meadow and Studio · two drafts, two not started",
    consequence: "The room handover cannot close until factual care reports are submitted.",
    domain: "children",
    path: "Children / Care incomplete / Today",
    due: "Before handover",
    status: "required",
    roles: ["admin", "manager", "teacher"],
  },
  {
    id: "unknown-arrival",
    label: "Confirm Alma's arrival",
    context: "Alma Reyes · Orchard · expected 09:00",
    consequence: "Orchard's live ratio remains provisional while attendance is unknown.",
    domain: "children",
    path: "Children / Attendance unknown / Alma Reyes",
    due: "Now",
    status: "urgent",
    roles: ["admin", "manager", "teacher", "nurse", "doctor"],
  },
  {
    id: "unallocated-payment",
    label: "Allocate EUR 240 payment",
    context: "Martin family · recorded yesterday",
    consequence: "The payment exists but no invoice balance has been reduced.",
    domain: "finance",
    path: "Finance / Needs allocation / Martin family",
    due: "Finance follow-up",
    status: "waiting",
    roles: ["admin", "manager"],
  },
  {
    id: "inspection-preflight",
    label: "Run Riverside inspection preflight",
    context: "Riverside · current school year",
    consequence: "Three staff evidence items expire within 30 days.",
    domain: "reports",
    path: "Reports / Compliance / Inspection preflight",
    due: "Due Friday",
    status: "required",
    roles: ["admin", "manager"],
  },
  {
    id: "parent-reply",
    label: "Reply to Theo's parent",
    context: "Theo Martin · food preference question",
    consequence: "The message is linked to today's lunch care record.",
    domain: "messages",
    path: "Messages / Needs reply / Martin family",
    due: "Received 24 min ago",
    status: "waiting",
    roles: ["admin", "manager", "teacher"],
  },
]

function isRoleAllowed(task: TaskDefinition, role: RoleId) {
  return task.roles.includes(role)
}

export function IaPrototype() {
  const [activeRole, setActiveRole] = useState<RoleId>("manager")
  const [activeDomain, setActiveDomain] = useState<DomainId>("today")
  const [activeBranch, setActiveBranch] = useState("Riverside")
  const [selectedTaskId, setSelectedTaskId] = useState("meadow-cover")
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const queueTriggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const availableDomains = roleNavigation[activeRole]
  const availableTasks = useMemo(() => tasks.filter((task) => isRoleAllowed(task, activeRole)), [activeRole])
  const selectedTask = availableTasks.find((task) => task.id === selectedTaskId) ?? availableTasks[0]
  const currentDomain = domains[activeDomain]

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return availableTasks.slice(0, 5)
    return availableTasks.filter((task) =>
      [task.label, task.context, task.path, domains[task.domain].label].some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [availableTasks, query])

  const closeMobileNavigation = useCallback(() => {
    setMobileOpen(false)
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setQuery("")
    window.requestAnimationFrame(() => searchTriggerRef.current?.focus())
  }, [])

  const closeQueue = useCallback(() => {
    setQueueOpen(false)
    window.requestAnimationFrame(() => queueTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (searchOpen) closeSearch()
      else if (queueOpen) closeQueue()
      else if (mobileOpen) closeMobileNavigation()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileNavigation, closeQueue, closeSearch, mobileOpen, queueOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (mobileOpen) menuCloseRef.current?.focus()
  }, [mobileOpen])

  const navigateToDomain = (domain: DomainId, message?: string) => {
    setActiveDomain(domain)
    setMobileOpen(false)
    setSearchOpen(false)
    setQueueOpen(false)
    setQuery("")
    setAnnouncement(message ?? `${domains[domain].label} opened`)
  }

  const openTask = (task: TaskDefinition) => {
    setSelectedTaskId(task.id)
    navigateToDomain(task.domain, `${task.label} opened in ${domains[task.domain].label}`)
  }

  const switchRole = (role: RoleId) => {
    setActiveRole(role)
    const nextDomains = roleNavigation[role]
    if (!nextDomains.includes(activeDomain)) setActiveDomain("today")
    if (!roleBranches[role].includes(activeBranch)) setActiveBranch(roleBranches[role][0])
    const nextTask = tasks.find((task) => isRoleAllowed(task, role))
    if (nextTask) setSelectedTaskId(nextTask.id)
    setAnnouncement(`${roleLabels[role]} projection loaded`)
  }

  const DomainIcon = currentDomain.icon

  return (
    <div className="ia-lab">
      <aside className={`ia-sidebar${mobileOpen ? " is-open" : ""}`} aria-label="Architecture navigation">
        <div className="ia-wordmark-row">
          <span className="ia-wordmark">Kiddz <span>Online</span></span>
          <button className="ia-icon-button ia-sidebar-close" type="button" aria-label="Close navigation" onClick={closeMobileNavigation} ref={menuCloseRef}>
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="ia-lab-label"><ShieldCheck aria-hidden="true" /><span><strong>Architecture lab</strong><small>Not a visual direction</small></span></div>

        <nav className="ia-primary-nav" aria-label="Proposed domains">
          {availableDomains.filter((domain) => domain !== "settings").map((domain) => {
            const definition = domains[domain]
            const Icon = definition.icon
            return (
              <button className={activeDomain === domain ? "is-active" : undefined} aria-current={activeDomain === domain ? "page" : undefined} key={domain} onClick={() => navigateToDomain(domain)} type="button">
                <Icon aria-hidden="true" />
                <span>{definition.label}</span>
                {domain === "today" && <span className="ia-nav-count">{availableTasks.length}</span>}
              </button>
            )
          })}
        </nav>

        <div className="ia-sidebar-spacer" />
        {availableDomains.includes("settings") && (
          <button className={`ia-settings-button${activeDomain === "settings" ? " is-active" : ""}`} onClick={() => navigateToDomain("settings")} type="button">
            <Settings aria-hidden="true" /><span>Settings</span>
          </button>
        )}
      </aside>

      {mobileOpen && <button className="ia-scrim" aria-label="Close navigation" onClick={closeMobileNavigation} type="button" />}

      <div className="ia-workspace">
        <header className="ia-topbar">
          <button className="ia-icon-button ia-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} ref={menuTriggerRef}>
            <Menu aria-hidden="true" />
          </button>

          <label className="ia-context-select">
            <Building2 aria-hidden="true" />
            <span className="ia-visually-hidden">Active branch</span>
            <select value={activeBranch} onChange={(event) => setActiveBranch(event.target.value)}>
              {roleBranches[activeRole].map((branch) => <option key={branch}>{branch}</option>)}
            </select>
          </label>
          <span className="ia-live-state"><span />Live · Tue 14 Jul · 09:18</span>

          <div className="ia-role-switch" aria-label="Role projection">
            {(Object.keys(roleLabels) as RoleId[]).map((role) => (
              <button className={activeRole === role ? "is-active" : undefined} onClick={() => switchRole(role)} key={role} type="button">{roleLabels[role]}</button>
            ))}
          </div>

          <div className="ia-top-actions">
            <button className="ia-search-button" aria-label="Open global search" onClick={() => setSearchOpen(true)} ref={searchTriggerRef} type="button">
              <Search aria-hidden="true" /><span>Search people, work, or records</span><kbd>⌘ K</kbd>
            </button>
            <button className="ia-icon-button ia-queue-button" aria-label={`Open work queue, ${availableTasks.length} items`} onClick={() => setQueueOpen(true)} ref={queueTriggerRef} type="button">
              <ListTodo aria-hidden="true" /><span>{availableTasks.length}</span>
            </button>
            <button className="ia-icon-button" aria-label="Open notifications" type="button"><Bell aria-hidden="true" /></button>
          </div>
        </header>

        <main className="ia-main">
          <section className="ia-heading">
            <div className="ia-heading-icon"><DomainIcon aria-hidden="true" /></div>
            <div><span>{roleLabels[activeRole]} projection · {activeBranch}</span><h1>{currentDomain.label}</h1><p>{currentDomain.purpose}</p></div>
          </section>

          {activeDomain === "today" && (
            <section className="ia-readiness" aria-labelledby="ia-readiness-title">
              <div><span>Live readiness</span><h2 id="ia-readiness-title">Riverside is safe now.</h2><p>Meadow needs qualified cover before 12:30. Orchard has one attendance state to confirm.</p></div>
              <div className="ia-readiness-facts"><span><strong>41</strong> present</span><span><strong>11</strong> staff</span><span><strong>2</strong> open items</span></div>
            </section>
          )}

          <div className="ia-content-grid">
            <section className="ia-domain-panel" aria-labelledby="ia-domain-views">
              <header><span>Domain anatomy</span><h2 id="ia-domain-views">Core views</h2></header>
              <div className="ia-view-list">
                {currentDomain.views.map((view, index) => <button type="button" key={view}><span>{String(index + 1).padStart(2, "0")}</span><strong>{view}</strong><ChevronRight aria-hidden="true" /></button>)}
              </div>
              <footer><span>Canonical records</span><p>{currentDomain.records.join(" · ")}</p></footer>
            </section>

            <section className="ia-task-panel" aria-labelledby="ia-task-heading">
              <header><span>First-click validation</span><h2 id="ia-task-heading">Where daily work lands</h2></header>
              <div className="ia-task-list">
                {availableTasks.filter((task) => activeDomain === "today" || task.domain === activeDomain).map((task) => (
                  <article className={selectedTask?.id === task.id ? "is-selected" : undefined} key={task.id}>
                    <button className="ia-task-select" onClick={() => setSelectedTaskId(task.id)} type="button">
                      <span className={`ia-task-status is-${task.status}`}>{task.due}</span>
                      <strong>{task.label}</strong>
                      <small>{task.context}</small>
                    </button>
                    <button className="ia-task-open" onClick={() => openTask(task)} aria-label={`Open ${task.label}`} type="button"><ChevronRight aria-hidden="true" /></button>
                  </article>
                ))}
                {availableTasks.filter((task) => activeDomain === "today" || task.domain === activeDomain).length === 0 && <div className="ia-empty"><strong>No live work in this sample</strong><span>Use the domain views to inspect records and history.</span></div>}
              </div>
            </section>
          </div>

          {selectedTask && (
            <section className="ia-path-preview" aria-labelledby="ia-path-heading">
              <div><span>Canonical path</span><h2 id="ia-path-heading">{selectedTask.label}</h2><p>{selectedTask.path}</p></div>
              <div><span>Why it stays open</span><p>{selectedTask.consequence}</p></div>
              <button type="button" onClick={() => openTask(selectedTask)}>Open in {domains[selectedTask.domain].label}<ChevronRight aria-hidden="true" /></button>
            </section>
          )}
        </main>
        <p className="ia-announcement" aria-live="polite">{announcement}</p>
      </div>

      {searchOpen && (
        <div className="ia-overlay" role="presentation">
          <button className="ia-overlay-dismiss" aria-label="Close search" onClick={closeSearch} type="button" />
          <section className="ia-search-dialog" role="dialog" aria-modal="true" aria-label="Global search">
            <label><Search aria-hidden="true" /><span className="ia-visually-hidden">Search people, work, or records</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, work, or records" /><kbd>Esc</kbd></label>
            <div className="ia-search-results">
              <span>{query ? `${searchResults.length} matching tasks` : "Suggested work"}</span>
              {searchResults.map((task) => <button onClick={() => openTask(task)} key={task.id} type="button"><span><strong>{task.label}</strong><small>{task.path}</small></span><span>{domains[task.domain].label}<ChevronRight aria-hidden="true" /></span></button>)}
              {searchResults.length === 0 && <div className="ia-empty"><strong>No accessible result</strong><span>Try a child, room, work state, record, or command.</span></div>}
            </div>
          </section>
        </div>
      )}

      {queueOpen && (
        <div className="ia-overlay" role="presentation">
          <button className="ia-overlay-dismiss" aria-label="Close work queue" onClick={closeQueue} type="button" />
          <aside className="ia-queue-drawer" role="dialog" aria-modal="true" aria-label="Work queue">
            <header><div><span>Owned work</span><h2>{availableTasks.length} items for {roleLabels[activeRole].toLowerCase()}</h2></div><button className="ia-icon-button" aria-label="Close work queue" onClick={closeQueue} type="button"><X aria-hidden="true" /></button></header>
            <div className="ia-queue-tabs"><button className="is-active" type="button">Mine</button><button type="button">Branch</button><button type="button">Waiting</button><button type="button">Recently handled</button></div>
            <div className="ia-queue-list">{availableTasks.map((task) => <button onClick={() => openTask(task)} key={task.id} type="button"><span className={`ia-task-status is-${task.status}`}>{task.due}</span><strong>{task.label}</strong><small>{task.context}</small><span>{domains[task.domain].label}<ChevronRight aria-hidden="true" /></span></button>)}</div>
          </aside>
        </div>
      )}
    </div>
  )
}
