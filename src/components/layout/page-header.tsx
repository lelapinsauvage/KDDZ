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
    <div className="flex flex-col gap-1 border-b border-[#e1e5ec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <h1 className="text-lg font-semibold text-[#333] sm:text-xl">{title}</h1>
      <nav className="hidden items-center gap-1 text-sm text-[#6f7b8a] sm:flex">
        <Link href="/dashboard" className="transition-colors hover:text-[#333]">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-[#333]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[#333]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  )
}
