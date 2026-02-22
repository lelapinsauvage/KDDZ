"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNavForRole, type UserRole } from "./app-sidebar"

interface MobileMoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: UserRole
}

export function MobileMoreSheet({ open, onOpenChange, userRole }: MobileMoreSheetProps) {
  const pathname = usePathname()
  const sections = getNavForRole(userRole)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">Navigation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-57px)]">
          <div className="space-y-5 p-4">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 font-semibold text-primary border-l-[3px] border-primary rounded-l-none"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
