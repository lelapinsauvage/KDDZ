import type { Metadata } from "next"
import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  Fredoka,
  Geist,
  Instrument_Sans,
  Inter,
  Newsreader,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google"
import "./brand-directions.css"
import "./evaluation/evaluation.css"

const inter = Inter({ subsets: ["latin"], variable: "--brand-font-inter", display: "swap" })
const fredoka = Fredoka({ subsets: ["latin"], variable: "--brand-font-fredoka", display: "swap" })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--brand-font-bricolage", display: "swap" })
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--brand-font-instrument", display: "swap" })
const newsreader = Newsreader({ subsets: ["latin"], variable: "--brand-font-newsreader", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--brand-font-space", display: "swap" })
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--brand-font-source", display: "swap" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--brand-font-fraunces", display: "swap" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--brand-font-dm", display: "swap" })
const geist = Geist({ subsets: ["latin"], variable: "--brand-font-geist", display: "swap" })

export const metadata: Metadata = {
  title: "Kiddz Online Brand Directions",
  description: "Six strategic identity and product-expression directions for Kiddz Online.",
}

const fontVariables = [
  inter.variable,
  fredoka.variable,
  bricolage.variable,
  instrument.variable,
  newsreader.variable,
  spaceGrotesk.variable,
  sourceSans.variable,
  fraunces.variable,
  dmSans.variable,
  geist.variable,
].join(" ")

export default function BrandDirectionsLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVariables}>{children}</div>
}
