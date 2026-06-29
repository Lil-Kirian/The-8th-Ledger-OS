// app/page.tsx
// 8th Ledger — The Ancient Tome
// "The book sits on the desk. The ledger waits."

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint,
  ChevronRight,
  Lock,
  Crown,
  BookOpen,
  Compass,
  Feather,
  Hexagon,
  Star,
  Flame,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   DESK SURFACE — Dark wood table beneath the book
   ============================================================ */
function DeskSurface() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep walnut desk */}
      <div className="absolute inset-0 bg-[#0a0806]" />

      {/* Wood grain — horizontal desk planks */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015 0.08' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)'/%3E%3C/svg%3E")`,
          backgroundSize: "400px 60px",
        }}
      />

      {/* Desk vignette — darker at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(6,4,2,0.9) 100%)",
        }}
      />

      {/* Subtle desk reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: "linear-gradient(to top, rgba(139,90,43,0.02) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   CANDLE GLOW — Warm light from above the book
   ============================================================ */
function CandleGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        animate={{
          opacity: [0.12, 0.18, 0.14, 0.2, 0.12],
          scale: [1, 1.02, 0.99, 1.01, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,90,43,0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   THE BOOK — Centered, leather-bound, distinct object
   ============================================================ */
function TheBook({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      className="relative"
    >
      {/* Book shadow — cast on desk */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[95%] h-8 rounded-full blur-xl"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-4 rounded-full blur-lg"
        style={{ background: "rgba(0,0,0,0.4)" }}
      />

      {/* Book spine shadow (left side depth) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 rounded-l-sm"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
        }}
      />

      {/* Book cover — leather texture */}
      <div
        className="relative rounded-sm overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1c1410 0%, #15100c 50%, #1a120e 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Leather grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23leather)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Book border frame */}
        <div className="absolute inset-2 md:inset-3 border border-[#3d2b1f]/30 rounded-sm" />
        <div className="absolute inset-3 md:inset-4 border border-[#2a1f15]/20 rounded-sm" />

        {/* Corner ornaments */}
        {[
          { pos: "top-1 left-1", rotate: "0deg" },
          { pos: "top-1 right-1", rotate: "90deg" },
          { pos: "bottom-1 left-1", rotate: "270deg" },
          { pos: "bottom-1 right-1", rotate: "180deg" },
        ].map((corner, i) => (
          <svg
            key={i}
            className={`absolute ${corner.pos} w-8 h-8 md:w-10 md:h-10`}
            style={{ transform: `rotate(${corner.rotate})` }}
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M0 0 L20 0 L20 3 L3 3 L3 20 L0 20 Z"
              fill="#5c4033"
              opacity="0.5"
            />
            <path
              d="M0 0 L14 0 L14 1.5 L1.5 1.5 L1.5 14 L0 14 Z"
              fill="#8b6914"
              opacity="0.35"
            />
            <circle cx="6" cy="6" r="2" fill="#6b5415" opacity="0.5" />
          </svg>
        ))}

        {/* Top center ornament */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-6 h-px bg-[#3d2b1f]/30" />
          <Hexagon className="w-2 h-2 text-[#5c4033]/40" strokeWidth={1} />
          <div className="w-6 h-px bg-[#3d2b1f]/30" />
        </div>

        {/* Bottom center ornament */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-6 h-px bg-[#3d2b1f]/30" />
          <Star className="w-2 h-2 text-[#5c4033]/30" strokeWidth={1} />
          <div className="w-6 h-px bg-[#3d2b1f]/30" />
        </div>

        {/* Side dots */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 flex flex-col gap-1.5 opacity-30">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`l-${i}`}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5, delay: i * 0.9, repeat: Infinity }}
              className="w-0.5 h-0.5 rounded-full bg-[#8b6914]"
            />
          ))}
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1.5 opacity-30">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`r-${i}`}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5, delay: i * 0.9 + 2.5, repeat: Infinity }}
              className="w-0.5 h-0.5 rounded-full bg-[#8b6914]"
            />
          ))}
        </div>

        {/* Content area */}
        <div className="relative z-10 px-8 py-10 md:px-14 md:py-14 flex flex-col items-center">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   THE SEAL — Centered inside the book — BIGGER
   ============================================================ */
function TheSeal() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Outer ring — scaled up */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
        className="absolute w-[200px] h-[200px] md:w-[260px] md:h-[260px]"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#3d2b1f"
            strokeWidth="0.5"
            opacity="0.4"
            strokeDasharray="3 6"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#5c4033"
            strokeWidth="0.5"
            opacity="0.25"
          />
        </svg>
      </motion.div>

      {/* Inner ring — scaled up */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute w-[185px] h-[185px] md:w-[245px] md:h-[245px]"
      >
        <svg viewBox="0 0 185 185" className="w-full h-full">
          <circle
            cx="92.5"
            cy="92.5"
            r="88"
            fill="none"
            stroke="#2a1f15"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="1 4"
          />
        </svg>
      </motion.div>

      {/* Logo — BIGGER */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
        className="relative z-10 w-40 h-40 md:w-52 md:h-52"
      >
        <div
          className="absolute inset-0 rounded-full blur-[30px]"
          style={{ background: "rgba(139,90,43,0.08)" }}
        />
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/logo/logo.PNG"
            alt="8th Ledger"
            fill
            className="object-contain drop-shadow-[0_0_20px_rgba(139,90,43,0.15)]"
            priority
            draggable={false}
          />
        </div>
      </motion.div>

      {/* Crown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute -top-2"
      >
        <Crown className="w-4 h-4 md:w-5 md:h-5 text-[#5c4033]/40" strokeWidth={1} />
      </motion.div>
    </div>
  );
}

/* ============================================================
   THE TITLE — One line with superscript th
   ============================================================ */
function TheTitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1 }}
      className="text-center mt-5 md:mt-6"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-8 h-px bg-[#3d2b1f]/35" />
        <Compass className="w-2 h-2 text-[#5c4033]/35" strokeWidth={1.5} />
        <div className="w-8 h-px bg-[#3d2b1f]/35" />
      </div>

      <h1 className="leading-none">
        <span className="block text-xl md:text-3xl font-black text-[#e8dcc8] tracking-[0.15em] uppercase">
          The 8<sup className="text-[0.45em] align-super text-[#c4a86c]">th</sup> Ledger
        </span>
      </h1>

      <p className="mt-2 text-[9px] md:text-[10px] text-[#8a7a5a] uppercase tracking-[0.3em] font-medium">
        Perpetual Ownership Protocol
      </p>

      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-6 h-px bg-[#3d2b1f]/25" />
        <Feather className="w-2 h-2 text-[#5c4033]/25" strokeWidth={1.5} />
        <div className="w-6 h-px bg-[#3d2b1f]/25" />
      </div>
    </motion.div>
  );
}

/* ============================================================
   THE PROCLAMATION — Brightened text
   ============================================================ */
function TheProclamation() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.8 }}
      className="text-center mt-4 md:mt-5 px-4"
    >
      <p className="text-[11px] md:text-xs text-[#a09070] leading-relaxed tracking-wide">
        Commit capital. Own real assets. Govern through halls. Earn forever.
      </p>

      <div className="flex items-center justify-center gap-4 md:gap-6 mt-4">
        {[
          { icon: BookOpen, label: "Commit" },
          { icon: Lock, label: "Own" },
          { icon: Crown, label: "Govern" },
          { icon: Flame, label: "Earn" },
        ].map((mark, i) => (
          <motion.div
            key={mark.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 + i * 0.1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded border border-[#3d2b1f]/20 bg-[#15100c]/40 flex items-center justify-center">
              <mark.icon className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#5c4033]/45" strokeWidth={1.5} />
            </div>
            <span className="text-[8px] text-[#3d2b1f]/35 uppercase tracking-wider font-medium">
              {mark.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ============================================================
   THE ACTIONS — Glowing button with white swipe, NO icon on Initiate
   ============================================================ */
function TheActions() {
  const { isAuthenticated, user } = useAuth();

  const getPath = () => {
    if (!user) return "/enter";
    if (user.isPrimaryAdmin) return "/architect";
    if (user.role === "admin") return "/admin";
    return "/dashboard";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.9, duration: 0.5 }}
      className="mt-5 md:mt-6"
    >
      <Link
        href={getPath()}
        className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-[#f5e6c8] text-sm font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:scale-105"
      >
        {/* Base background */}
        <div className="absolute inset-0 rounded-lg bg-[#3a2e1a] border border-[#c4a86c]/50 transition-all duration-500 group-hover:bg-[#4a3e2a] group-hover:border-[#d4b87c]/70" />

        {/* Inner warm glow */}
        <div className="absolute inset-0 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" style={{
          background: "radial-gradient(circle at 50% 50%, rgba(196,168,108,0.25) 0%, rgba(196,168,108,0.05) 50%, transparent 70%)",
        }} />

        {/* Strong outer glow */}
        <div className="absolute -inset-1 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 blur-md" style={{
          background: "radial-gradient(circle at center, rgba(196,168,108,0.3) 0%, rgba(180,140,80,0.15) 40%, transparent 70%)",
        }} />

        {/* Pulsing ring */}
        <motion.div
          className="absolute -inset-2 rounded-xl pointer-events-none"
          style={{ boxShadow: "0 0 20px rgba(196,168,108,0.25), 0 0 40px rgba(196,168,108,0.1), inset 0 0 15px rgba(196,168,108,0.05)" }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -inset-3 rounded-xl pointer-events-none"
          style={{ boxShadow: "0 0 30px rgba(196,168,108,0.15), 0 0 60px rgba(180,140,80,0.08)" }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.25 }}
        />

        {/* White swipe / shimmer effect */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <motion.div
            className="absolute top-0 -left-[100%] w-[50%] h-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)",
              transform: "skewX(-20deg)",
            }}
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
        </div>

        <span className="relative z-10 flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <Fingerprint className="w-4 h-4" strokeWidth={1.5} />
              Enter
            </>
          ) : (
            <>
              {/* NO ICON — just text */}
              Initiate
            </>
          )}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
        </span>
      </Link>
    </motion.div>
  );
}

/* ============================================================
   THE FOOT — Bottom of screen, outside the book
   ============================================================ */
function TheFoot() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.2 }}
      className="absolute bottom-0 left-0 right-0 z-20 px-6 py-3 flex items-center justify-between text-[9px] text-[#2a1f15]/35 font-mono uppercase tracking-wider"
    >
      <span className="flex items-center gap-1.5">
        <Lock className="w-2.5 h-2.5" strokeWidth={1.5} />
        256-bit
      </span>
      <span className="flex items-center gap-1.5">
        <BookOpen className="w-2.5 h-2.5" strokeWidth={1.5} />
        v3.2
      </span>
      <span className="flex items-center gap-1.5">
        <Compass className="w-2.5 h-2.5" strokeWidth={1.5} />
        {new Date().getFullYear()}
      </span>
    </motion.div>
  );
}

/* ============================================================
   MAIN — Book centered on desk
   ============================================================ */
export default function LandingPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0806] text-[#c9b896] overflow-hidden select-none">
      <DeskSurface />
      <CandleGlow />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center"
            >
              {/* Genesis mark — above book */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-5 md:mb-6"
              >
                <span className="text-[9px] text-[#3d2b1f]/35 uppercase tracking-[0.3em] font-mono">
                  Genesis 00000000
                </span>
              </motion.div>

              {/* The Book — centered, not full screen */}
              <TheBook>
                <TheSeal />
                <TheTitle />
                <TheProclamation />
                <TheActions />
              </TheBook>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TheFoot />
    </div>
  );
}