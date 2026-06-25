"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  ArrowLeft,
  Flame,
  TrendingUp,
  Users,
  Shield,
  Globe,
  Clock,
  Zap,
  ChevronRight,
  Landmark,
  DollarSign,
  Activity,
  Star,
  Target,
  BarChart3,
  Swords,
  Radio,
  Shirt,
  Ticket,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SPORT LEDGER — THE 11TH VERTICAL
   Class III — Active Operation
   ============================================================ */

const SPORT_ASSETS = [
  {
    icon: Swords,
    name: "Football Club",
    description: "Own a piece of a professional or semi-professional football club. Revenue from matchday tickets, broadcasting, and player transfers.",
    minValue: 250000,
    revenueStreams: ["Ticket Sales", "Broadcasting", "Sponsorships", "Player Transfers"],
    risk: "Moderate",
    yield: "12-18%",
  },
  {
    icon: Medal,
    name: "Basketball Franchise",
    description: "Fractional ownership of basketball teams and training facilities. Revenue from game tickets, merchandise, and league distributions.",
    minValue: 300000,
    revenueStreams: ["Game Tickets", "Merchandise", "League Revenue", "Food & Beverage"],
    risk: "Moderate",
    yield: "10-16%",
  },
  {
    icon: Target,
    name: "Tennis Academy",
    description: "Own tennis training facilities and academies. Revenue from coaching fees, tournament hosting, and court rentals.",
    minValue: 50000,
    revenueStreams: ["Coaching Fees", "Court Rentals", "Tournaments", "Pro Shop"],
    risk: "Low",
    yield: "8-14%",
  },
  {
    icon: Radio,
    name: "Esports Organization",
    description: "Invest in competitive gaming teams and streaming facilities. Revenue from tournament prizes, streaming, and brand deals.",
    minValue: 75000,
    revenueStreams: ["Tournament Prizes", "Streaming", "Brand Deals", "Merch Sales"],
    risk: "High",
    yield: "15-25%",
  },
  {
    icon: Shirt,
    name: "Racing Team",
    description: "Fractional ownership of motorsport teams. Revenue from prize money, sponsorships, and licensing.",
    minValue: 400000,
    revenueStreams: ["Prize Money", "Sponsorships", "Licensing", "Hospitality"],
    risk: "High",
    yield: "14-22%",
  },
  {
    icon: Ticket,
    name: "Multi-Sport Complex",
    description: "Own multi-purpose sports facilities hosting various events. Revenue from event hosting, memberships, and concessions.",
    minValue: 150000,
    revenueStreams: ["Event Hosting", "Memberships", "Concessions", "Parking"],
    risk: "Low",
    yield: "9-13%",
  },
];

const FEATURES = [
  {
    icon: Trophy,
    title: "Team Performance",
    desc: "Track win rates, player stats, and league standings in real-time.",
  },
  {
    icon: DollarSign,
    title: "Revenue Streams",
    desc: "Ticket sales, merchandise, sponsorships, media rights, and player transfers.",
  },
  {
    icon: Users,
    title: "Fan Engagement",
    desc: "Fan token mechanics, voting on team decisions, and exclusive access.",
  },
  {
    icon: Shield,
    title: "Asset Protection",
    desc: "PIR covers player insurance, venue liability, and force majeure.",
  },
  {
    icon: Activity,
    title: "Live Metrics",
    desc: "Real-time attendance, revenue per match, and player valuation tracking.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    desc: "Sports assets across football, basketball, tennis, esports, and motorsport.",
  },
];

const HALL_CLASS_INFO = {
  class: "III",
  label: "Active",
  description: "Hall runs operations daily. 8th Ledger provides infrastructure. Full staffing — coaches, players, managers, medical staff.",
  governance: [
    "Hall votes on player acquisitions and sales",
    "Hall approves coaching staff and medical team",
    "Hall sets ticket pricing and merchandise strategy",
    "Hall votes on sponsorship deals and media rights",
    "Hall proposes facility upgrades and expansions",
  ],
};

export default function SportLedgerPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "governance">("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <Link
            href="/verticals"
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All Verticals
          </Link>

          <div className="flex items-start gap-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
              <Trophy className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">SportLedger</h1>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  CLASS III
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-lg text-white/40 max-w-2xl">
                Own professional sports teams, academies, and facilities. Govern player transfers, 
                ticket pricing, and sponsorship deals. Earn from matchday revenue, merchandise, 
                media rights, and player trading.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: "Min Asset Value", value: "$50K", icon: DollarSign },
              { label: "Est. Yield", value: "8-25%", icon: TrendingUp },
              { label: "Hall Class", value: "III — Active", icon: Users },
              { label: "Risk Profile", value: "Low to High", icon: Shield },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 text-red-400" />
                  <span className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1">
          {[
            { id: "overview" as const, label: "Overview", icon: Activity },
            { id: "assets" as const, label: "Asset Types", icon: Trophy },
            { id: "governance" as const, label: "Governance", icon: Landmark },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all relative",
                activeTab === tab.id
                  ? "text-red-400"
                  : "text-white/30 hover:text-white/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="sport-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Features Grid */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Why SportLedger?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-red-500/10 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 mb-4 group-hover:bg-red-500/20 transition-all">
                      <feature.icon className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs text-white/30 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Revenue Flow */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-6">Revenue Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { step: "1", label: "Matchday Revenue", desc: "Tickets, concessions, parking", pct: "35%" },
                  { step: "2", label: "Sponsorships", desc: "Kit deals, stadium ads, partnerships", pct: "25%" },
                  { step: "3", label: "Media Rights", desc: "Broadcasting, streaming, highlights", pct: "20%" },
                  { step: "4", label: "Merchandise", desc: "Kit sales, fan gear, digital collectibles", pct: "12%" },
                  { step: "5", label: "Player Trading", desc: "Transfer fees, loan income, sell-on clauses", pct: "8%" },
                ].map((item, i) => (
                  <div key={item.step} className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                        {item.step}
                      </div>
                      {i < 4 && (
                        <ChevronRight className="h-4 w-4 text-white/10 absolute right-0 hidden md:block" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                    <p className="text-[10px] text-white/30 mb-2">{item.desc}</p>
                    <span className="text-xs font-bold text-red-400">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Info */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <Users className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Hall Class III — Active Operation</h2>
                  <p className="text-xs text-white/30">Full staffing. Daily operations. Maximum governance.</p>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-4">
                {HALL_CLASS_INFO.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HALL_CLASS_INFO.governance.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-3">
                    <Zap className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "assets" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Sport Asset Types</h2>
              <span className="text-xs text-white/30">6 asset classes available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPORT_ASSETS.map((asset, i) => (
                <motion.div
                  key={asset.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-red-500/10 transition-all group"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-all">
                        <asset.icon className="h-6 w-6 text-red-400" />
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold border",
                        asset.risk === "Low" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        asset.risk === "Moderate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {asset.risk} Risk
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{asset.name}</h3>
                    <p className="text-xs text-white/30 leading-relaxed mb-4">
                      {asset.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-white/20">Min Value</span>
                        <span className="text-sm font-mono text-white">${asset.minValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-white/20">Est. Yield</span>
                        <span className="text-sm font-mono text-emerald-400">{asset.yield}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/20 mb-2">Revenue Streams</p>
                      <div className="flex flex-wrap gap-1.5">
                        {asset.revenueStreams.map((stream) => (
                          <span
                            key={stream}
                            className="px-2 py-1 rounded-md bg-white/5 text-white/40 text-[10px] font-medium"
                          >
                            {stream}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
                    <Link
                      href="/pools"
                      className="flex items-center justify-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Explore {asset.name} Pools
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "governance" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-6">SportLedger Governance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 text-red-400" />
                    Executive Cabinet Powers
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Speaker proposes player acquisitions and coaching changes",
                      "Treasurer reviews matchday revenue and sponsorship contracts",
                      "Warden monitors player fitness and medical protocols",
                      "Scribe manages fan communications and media relations",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-3">
                        <Zap className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-white/50">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-400" />
                    Hall Vote Requirements
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Player Transfer", threshold: "66%", desc: "Major acquisitions or sales" },
                      { label: "Ticket Pricing", threshold: "51%", desc: "Season ticket and matchday prices" },
                      { label: "Sponsorship Deal", threshold: "51%", desc: "Kit sponsor and stadium naming" },
                      { label: "Staff Hire / Fire", threshold: "51%", desc: "Coaches, medical, backroom staff" },
                      { label: "Facility Upgrade", threshold: "51%", desc: "Stadium improvements, training ground" },
                      { label: "Inventory Enable", threshold: "51%", desc: "Merchandise and fan products" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3">
                        <div>
                          <p className="text-xs font-medium text-white">{item.label}</p>
                          <p className="text-[10px] text-white/30">{item.desc}</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                          {item.threshold}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Forge Ledger — Staffing</h2>
              <p className="text-sm text-white/40 mb-6">
                SportLedger halls employ players, coaches, medical staff, and operations teams. 
                All workers are 8th Ledger employees. Halls vote on staffing levels and performance reviews.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { role: "Head Coach", salary: "$8,000/mo", type: "Full-time" },
                  { role: "Players (Squad)", salary: "$3,000-15K/mo", type: "Contracts" },
                  { role: "Medical Team", salary: "$4,000/mo", type: "Full-time" },
                  { role: "Operations", salary: "$2,500/mo", type: "Full-time" },
                ].map((staff) => (
                  <div key={staff.role} className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs font-semibold text-white mb-1">{staff.role}</p>
                    <p className="text-[10px] text-white/30">{staff.salary}</p>
                    <p className="text-[10px] text-red-400 mt-1">{staff.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}