"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  getNavForRole,
  isAccordion,
  isSectionAccordion,
  isLeafActive,
  hasActiveChild,
  badgeColors,
  type UserRole,
  type NavItem,
  type NavSection,
  type SidebarClassInfo,
} from "./app-sidebar"
import type { SidebarBadges } from "@/lib/actions/sidebar"

interface MobileMoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: UserRole
  classes?: SidebarClassInfo[]
  badges?: SidebarBadges
}

export function MobileMoreSheet({ open, onOpenChange, userRole, classes, badges }: MobileMoreSheetProps) {
  const pathname = usePathname()
  const sections = getNavForRole(userRole, classes)

  // Track which accordions are open by label/title key
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    // Auto-open sections/items that contain the active page
    const keys = new Set<string>()
    for (const section of sections) {
      if (isSectionAccordion(section) && hasActiveChild(section.children, pathname)) {
        keys.add(`section:${section.label}`)
        // Also check nested items
        for (const item of section.children) {
          if (isAccordion(item) && hasActiveChild(item.children, pathname)) {
            keys.add(`item:${item.title}`)
          }
        }
      }
    }
    return keys
  })

  const toggleKey = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">Navigation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-57px)]">
          <div className="space-y-1 p-4">
            {sections.map((section) => (
              <MobileSectionRenderer
                key={section.label}
                section={section}
                pathname={pathname}
                badges={badges}
                openKeys={openKeys}
                toggleKey={toggleKey}
                onNavigate={() => onOpenChange(false)}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function MobileSectionRenderer({
  section,
  pathname,
  badges,
  openKeys,
  toggleKey,
  onNavigate,
}: {
  section: NavSection
  pathname: string
  badges?: SidebarBadges
  openKeys: Set<string>
  toggleKey: (key: string) => void
  onNavigate: () => void
}) {
  if (!isSectionAccordion(section)) {
    // Flat link section
    const active = isLeafActive(section.href, pathname)
    return (
      <Link
        href={section.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm transition-colors ${
          active
            ? "bg-primary/10 font-semibold text-primary border-l-[3px] border-primary rounded-l-none"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <section.icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <span>{section.label}</span>
        {"badgeKey" in section && section.badgeKey && badges && (
          <MobileBadge badgeKey={section.badgeKey} badges={badges} />
        )}
      </Link>
    )
  }

  // Accordion section
  const sectionKey = `section:${section.label}`
  const isOpen = openKeys.has(sectionKey)

  return (
    <div>
      <button
        onClick={() => toggleKey(sectionKey)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-foreground hover:bg-muted transition-colors"
      >
        <section.icon className="size-4 text-muted-foreground" />
        <span className="flex-1 text-left font-medium">{section.label}</span>
        <ChevronRight
          className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-3 space-y-0.5 border-l border-border/50 pl-3">
          {section.children.map((item) => (
            <MobileNavItemRenderer
              key={isAccordion(item) ? item.title : item.href}
              item={item}
              pathname={pathname}
              badges={badges}
              openKeys={openKeys}
              toggleKey={toggleKey}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MobileNavItemRenderer({
  item,
  pathname,
  badges,
  openKeys,
  toggleKey,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  badges?: SidebarBadges
  openKeys: Set<string>
  toggleKey: (key: string) => void
  onNavigate: () => void
}) {
  if (!isAccordion(item)) {
    // Leaf
    const active = isLeafActive(item.href, pathname)
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 min-h-[40px] text-sm transition-colors ${
          active
            ? "bg-primary/10 font-semibold text-primary"
            : "text-foreground hover:bg-muted"
        }`}
      >
        {item.icon && <item.icon className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />}
        <span>{item.title}</span>
        <MobileBadge badgeKey={item.badgeKey} badges={badges} />
      </Link>
    )
  }

  // Nested accordion
  const itemKey = `item:${item.title}`
  const isOpen = openKeys.has(itemKey)

  return (
    <div>
      <button
        onClick={() => toggleKey(itemKey)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 min-h-[40px] text-sm text-foreground hover:bg-muted transition-colors"
      >
        {item.icon && <item.icon className="size-3.5 text-muted-foreground" />}
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronRight
          className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-3 space-y-0.5 border-l border-border/50 pl-3">
          {item.children.map((child) => (
            <MobileNavItemRenderer
              key={isAccordion(child) ? child.title : child.href}
              item={child}
              pathname={pathname}
              badges={badges}
              openKeys={openKeys}
              toggleKey={toggleKey}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MobileBadge({ badgeKey, badges }: { badgeKey?: keyof SidebarBadges; badges?: SidebarBadges }) {
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
