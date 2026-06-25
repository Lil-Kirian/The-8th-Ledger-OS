import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "8th Ledger — Where Assets Live Forever",
    template: "%s | 8th Ledger",
  },
  description:
    "A sovereign financial empire where you commit capital to own real-world assets, govern them through a digital parliament, and earn monthly dividends forever. The 8th Ledger manages insurance, legal, maintenance, payroll, and dynamic valuation — so sovereigns focus on governance and earnings.",
  keywords: [
    "8th Ledger",
    "Perpetual Ownership Protocol",
    "real world assets",
    "fractional ownership",
    "PAC",
    "Perpetual Asset Contract",
    "LedgerProp", "LedgerAuto", "LedgerEdu", "LedgerAccess", "LedgerHealth",
    "LedgerBiz", "LedgerTech", "LedgerTravel", "LedgerAgri", "LedgerEnergy",
    "PIR", "Protocol Infrastructure Reserve",
    "Quantum Merit Consensus",
    "Sovereign Parliament",
    "Meridian Cycle",
    "Oracle Standing",
    "Agora",
  ],
  authors: [{ name: "8th Ledger Holdings Ltd.", url: "https://8thledger.io" }],
  creator: "8th Ledger Holdings Ltd.",
  publisher: "8th Ledger Holdings Ltd.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://8thledger.io",
    siteName: "8th Ledger — The Perpetual Ownership Protocol",
    title: "8th Ledger — Where Assets Live Forever",
    description: "Commit capital. Own real assets. Govern through a digital parliament. Earn monthly dividends forever. The 8th Ledger protects every asset.",
  },
  twitter: {
    card: "summary_large_image",
    title: "8th Ledger — Where Assets Live Forever",
    description: "A sovereign financial empire for real-world asset ownership. 10 verticals. Perpetual dividends. The 8th Ledger protects every asset.",
    creator: "@8thledger",
  },
  alternates: { canonical: "https://8thledger.io" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020204" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#020204] text-slate-100 antialiased selection:bg-cyan-500/25 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}