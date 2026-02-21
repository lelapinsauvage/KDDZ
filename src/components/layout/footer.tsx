"use client"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="footer-bar flex items-center justify-between px-6 py-3 text-sm">
      <span>2025 &copy; KiddzOnline</span>
      <button
        onClick={scrollToTop}
        className="transition-colors hover:text-white"
      >
        Go To Top
      </button>
    </footer>
  )
}
