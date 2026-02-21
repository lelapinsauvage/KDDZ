import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "KiddzOnline \u2014 Daycare Management",
  description: "Daycare and nursery management platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} antialiased`}>
        <SessionProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
