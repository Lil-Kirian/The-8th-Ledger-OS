import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import "../globals.css";

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
  title: "8th Ledger — Enter the Protocol",
  description:
    "Access the 8th Ledger protocol. 10 sovereign verticals. Perpetual Asset Contracts. Protocol Infrastructure Reserve. Publicly auditable ownership engine.",
  keywords: [
    "8th Ledger",
    "Perpetual Ownership Protocol",
    "PAC",
    "PIR",
    "real world assets",
    "fractional ownership",
    "LedgerProp",
    "LedgerAuto",
    "LedgerEdu",
    "LedgerAccess",
    "LedgerHealth",
    "LedgerBiz",
    "LedgerTech",
    "LedgerTravel",
    "LedgerAgri",
    "LedgerEnergy",
  ],
  authors: [{ name: "8th Ledger Holdings Ltd." }],
  openGraph: {
    title: "8th Ledger — Enter the Protocol",
    description: "The ownership engine the world has never seen.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0806",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0806] text-[#c9b896] antialiased selection:bg-[#c4a86c]/30 selection:text-[#e8dcc8]">
      {/* ===== AMBIENT DESK BACKGROUND ===== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0806]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015 0.08' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 60px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,90,43,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(6,4,2,0.85) 100%)",
          }}
        />
      </div>

      {/* ===== TOP HEADER — Just the Logo ===== */}
      <header className="fixed top-0 z-50 w-full border-b border-[#3d2b1f]/20 bg-[#0a0806]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Big Logo — No text */}
          <div className="flex items-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full blur-lg"
                style={{ background: "rgba(196,168,108,0.2)" }}
              />
              <div
                className="absolute inset-0 rounded-full blur-md"
                style={{ background: "rgba(139,90,43,0.15)" }}
              />
              <Image
                src="/logo/logo.PNG"
                alt="8th Ledger"
                width={56}
                height={56}
                className="relative z-10 object-contain drop-shadow-[0_0_12px_rgba(139,90,43,0.4)]"
                priority
                draggable={false}
              />
            </div>
          </div>

          {/* Status indicators */}
          <div className="hidden items-center gap-4 text-xs font-medium text-[#5c4033]/50 sm:flex">
            <span className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "#8b6914", boxShadow: "0 0 6px rgba(139,105,20,0.5)" }}
              />
              Protocol Live
            </span>
            <span className="h-3 w-px bg-[#3d2b1f]/20" />
            <span className="font-mono text-[#8a7a5a]/80">312 Halls Active</span>
            <span className="h-3 w-px bg-[#3d2b1f]/20" />
            <span className="font-mono text-[#c4a86c]/80">LED $1.00</span>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-12">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="fixed bottom-0 z-50 w-full border-t border-[#3d2b1f]/15 bg-[#0a0806]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <p className="text-[10px] text-[#5c4033]/40 sm:text-xs font-mono tracking-wide">
            Every transaction, ownership transfer, and revenue distribution is publicly auditable.
          </p>
          <a
            href="/audit"
            className="text-[10px] font-medium text-[#8a7a5a] hover:text-[#c4a86c] transition-colors sm:text-xs tracking-wide"
          >
            View Public Ledger →
          </a>
        </div>
      </footer>
    </div>
  );
}