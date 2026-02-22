import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "KiddzOnline — Daycare Management",
  description: "Daycare and nursery management platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        <SessionProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
