"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, ArrowLeft } from "lucide-react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs: Breadcrumb[]
  /** Show back button on mobile (for detail pages). Defaults to true if breadcrumbs has items. */
  showMobileBack?: boolean
}

export function PageHeader({ title, breadcrumbs, showMobileBack }: PageHeaderProps) {
  const router = useRouter()
  const shouldShowBack = showMobileBack ?? breadcrumbs.length > 0

  return (
    <div className="flex flex-col gap-1 border-b border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <div className="flex items-center gap-2">
        {/* Mobile back button */}
        {shouldShowBack && (
          <button
            onClick={() => router.back()}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h1>
      </div>
      <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-foreground"
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
  )
}
