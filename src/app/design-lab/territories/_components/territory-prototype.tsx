"use client"

import Link from "next/link"
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  HeartPulse,
  Menu,
  Search,
  Settings,
  UsersRound,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CareView, ChildrenView, ReviewView } from "./shared-views"
import { TodayView } from "./today-views"
import {
  territoryMeta,
  viewLabels,
  type PrototypeView,
  type TerritoryId,
} from "../_data"

const primaryNavigation: Array<{
  id: PrototypeView
  icon: typeof CalendarDays
}> = [
  { id: "today", icon: CalendarDays },
  { id: "children", icon: UsersRound },
  { id: "care", icon: ClipboardCheck },
  { id: "review", icon: HeartPulse },
]

export function TerritoryPrototype({ territory }: { territory: TerritoryId }) {
  const [activeView, setActiveView] = useState<PrototypeView>("today")
  const [selectedRoomId, setSelectedRoomId] = useState("meadow")
  const [coverAssigned, setCoverAssigned] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const meta = territoryMeta[territory]

  const statusMessage = useMemo(
    () => coverAssigned ? "Qualified cover assigned to Meadow from 12:30 to 13:00." : "",
    [coverAssigned],
  )

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    menuCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileMenu, mobileMenuOpen])

  const openView = (view: PrototypeView) => {
    setActiveView(view)
    if (mobileMenuOpen) closeMobileMenu()
  }

  return (
    <div className="territory-lab" data-territory={territory}>
      <aside className={`territory-sidebar${mobileMenuOpen ? " is-open" : ""}`}>
        <div className="territory-brand-row">
          <KiddzWordmark />
          <button
            className="territory-icon-button territory-sidebar-close"
            onClick={closeMobileMenu}
            ref={menuCloseRef}
            aria-label="Close navigation"
            type="button"
          >
            <Menu aria-hidden="true" />
          </button>
        </div>

        <div className="territory-branch-mini">
          <span className="territory-branch-mini__icon"><Building2 aria-hidden="true" /></span>
          <span><strong>Riverside</strong><small>Live branch</small></span>
          <ChevronDown aria-hidden="true" />
        </div>

        <nav className="territory-primary-nav" aria-label="Prototype views">
          {primaryNavigation.map(({ id, icon: Icon }) => (
            <button
              aria-current={activeView === id ? "page" : undefined}
              className={activeView === id ? "is-active" : undefined}
              key={id}
              onClick={() => openView(id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{viewLabels[id]}</span>
              {id === "review" && <span className="territory-nav-count">1</span>}
            </button>
          ))}
        </nav>

        <div className="territory-sidebar-spacer" />

        <nav className="territory-secondary-nav" aria-label="Territory switcher">
          <span className="territory-nav-label">Creative direction</span>
          {(Object.keys(territoryMeta) as TerritoryId[]).map((id) => (
            <Link aria-current={territory === id ? "page" : undefined} href={`/design-lab/territories/${id}`} key={id}>
              <span className={`territory-dot territory-dot--${id}`} />
              {territoryMeta[id].name}
            </Link>
          ))}
        </nav>

        <button className="territory-settings-link" type="button">
          <Settings aria-hidden="true" />
          <span>Settings</span>
        </button>
      </aside>

      {mobileMenuOpen && <button className="territory-mobile-scrim" aria-label="Close navigation" onClick={closeMobileMenu} type="button" />}

      <div className="territory-workspace">
        <header className="territory-topbar">
          <button
            className="territory-icon-button territory-mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            ref={menuTriggerRef}
            aria-label="Open navigation"
            type="button"
          >
            <Menu aria-hidden="true" />
          </button>

          <div className="territory-page-identity">
            <span>{meta.name}</span>
            <strong>{viewLabels[activeView]}</strong>
          </div>

          <div className="territory-context">
            <span className="territory-live-dot" />
            <span>Live</span>
            <span className="territory-context-divider" />
            <time dateTime="2026-07-14T09:18:00+02:00">Tue 14 Jul · 09:18</time>
          </div>

          <div className="territory-topbar-actions">
            <button className="territory-search" aria-label="Search" type="button">
              <Search aria-hidden="true" />
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="territory-icon-button territory-notification-button" aria-label="Open notifications, one unread" type="button">
              <Bell aria-hidden="true" />
              <span>1</span>
            </button>
            <button className="territory-avatar-button" aria-label="Open profile menu" type="button">KS</button>
          </div>
        </header>

        <main className="territory-main">
          {activeView === "today" && (
            <TodayView
              territory={territory}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
              coverAssigned={coverAssigned}
              onAssignCover={() => setCoverAssigned(true)}
              onOpenView={openView}
            />
          )}
          {activeView === "children" && <ChildrenView territory={territory} />}
          {activeView === "care" && <CareView territory={territory} />}
          {activeView === "review" && <ReviewView territory={territory} />}
        </main>

        <nav className="territory-mobile-nav" aria-label="Prototype views">
          {primaryNavigation.map(({ id, icon: Icon }) => (
            <button
              aria-current={activeView === id ? "page" : undefined}
              className={activeView === id ? "is-active" : undefined}
              key={id}
              onClick={() => openView(id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{viewLabels[id]}</span>
            </button>
          ))}
        </nav>

        <p className="territory-sr-status" aria-live="polite">{statusMessage}</p>
      </div>
    </div>
  )
}

function KiddzWordmark() {
  return (
    <span className="territory-wordmark" role="img" aria-label="Kiddz Online">
      <span className="territory-wordmark__kiddz">Kiddz</span>
      <span className="territory-wordmark__online">
        <span className="territory-wordmark__o" aria-hidden="true"><span /></span>
        <span>nline</span>
      </span>
    </span>
  )
}
