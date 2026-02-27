"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export function PageHeader({ title, description, breadcrumbs, actions, showMobileBack }: PageHeaderProps) {
  const router = useRouter()
  const shouldShowBack = showMobileBack ?? breadcrumbs.length > 0

  return (
    <div className="flex flex-col gap-2 border-b border-border/60 bg-card/50 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile back button */}
          {shouldShowBack && (
            <button
              onClick={() => router.back()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
            <Link href="/dashboard" className="transition-colors hover:text-primary">
              Home
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                <ChevronRight className="size-3.5" />
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
        </div>
      </div>
    </div>
  )
}
