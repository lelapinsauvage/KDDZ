"use client"

export function Footer() {
  return (
    <footer className="footer-bar flex items-center justify-center px-6 py-2.5 text-xs text-muted-foreground/60">
      <span>&copy; {new Date().getFullYear()} KiddzOnline</span>
    </footer>
  )
}
