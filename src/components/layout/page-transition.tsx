"use client"

import { usePathname } from "next/navigation"
import { useRef, useEffect } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.animation = "none"
    // Force reflow to restart animation
    void el.offsetHeight
    el.style.animation = ""
  }, [pathname])

  return (
    <div ref={ref} className="animate-[page-fade-in_150ms_ease-out]">
      {children}
    </div>
  )
}
