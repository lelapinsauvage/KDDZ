"use client"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="footer-bar flex items-center justify-between px-6 py-3 text-sm">
      <span>{new Date().getFullYear()} &copy; KiddzOnline</span>
      <button
        onClick={scrollToTop}
        className="font-medium text-primary/70 transition-colors hover:text-primary"
      >
        Back to top
      </button>
    </footer>
  )
}
