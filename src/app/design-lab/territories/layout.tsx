import type { Metadata } from "next"
import { Fredoka, Inter, Newsreader } from "next/font/google"
import "./territories.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--territory-font-product",
  display: "swap",
})

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--territory-font-display",
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--territory-font-editorial",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Kiddz Online Creative Territories",
  description: "Isolated brand and product territory prototypes.",
}

export default function TerritoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${fredoka.variable} ${newsreader.variable}`}>
      {children}
    </div>
  )
}
