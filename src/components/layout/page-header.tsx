import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs: Breadcrumb[]
}

export function PageHeader({ title, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h1>
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
