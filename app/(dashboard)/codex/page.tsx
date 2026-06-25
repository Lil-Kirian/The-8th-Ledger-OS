// app/(dashboard)/codex/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, X, ChevronRight, Lightbulb,
  HelpCircle, ArrowRight, Sparkles, Crown
} from "lucide-react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   THE 8TH LEDGER CODEX
   ============================================================ */

type Entry = { term: string; def: string; highlight?: boolean };
type Section = { id: string; title: string; subtitle: string; accent: string; entries: Entry[] };

const CODEX: Section[] = [
  {
    id: "start",
    title: "What Is This?",
    subtitle: "The empire in one breath",
    accent: "from-cyan-500/20 to-blue-500/5 border-cyan-500/20 text-cyan-400",
    entries: [
      { term: "The 8th Ledger", def: "A sovereign financial empire where you commit capital to own real-world assets — houses, farms, solar plants, restaurants, even sports teams. You do not buy shares. You own the asset. Forever. Through a Perpetual Asset Contract (PAC).", highlight: true },
      { term: "The Rule", def: "The community writes the law. The protocol enforces it. No one spends what they do not own. No one sees what they did not buy. Everyone earns what they invested." },
      { term: "Your Ledger ID", def: "Your unique identity across the entire empire (e.g., LED-8X2P-9LQ3). This is your passport, your wallet address, and your voting badge. Guard it." },
      { term: "Perpetual Ownership", def: "Once you own a PAC, you earn monthly dividends from that asset for as long as it operates. There is no expiration date. It is literally perpetual." },
    ],
  },
  {
    id: "identity",
    title: "Who You Are",
    subtitle: "Your rank in the empire",
    accent: "from-violet-500/20 to-purple-500/5 border-violet-500/20 text-violet-400",
    entries: [
      { term: "Visitor", def: "You just arrived. You can browse pools, read the Agora, and play the Oracle. You cannot commit money or buy anything. Verify your identity to ascend." },
      { term: "Sovereign", def: "First KYC tier unlocked. You can now commit to pools, vote in halls, and withdraw up to $500 instantly. You are no longer a guest — you are a subject of the empire." },
      { term: "Verified", def: "Full identity confirmed. You can buy PACs on the Ownership Exchange, sell your ownership, and withdraw up to $5,000 (24-hour delay). The real game starts here." },
      { term: "Whale", def: "The highest tier. Unlimited withdrawals (72-hour delay), reduced marketplace fees, early access to new pools, and priority support. You are a sovereign of sovereigns." },
      { term: "Trust Score", def: "Starts at 100. Drops if you break rules, spam, or act in bad faith. A high score unlocks privileges. A low score restricts you. Behave like an owner." },
    ],
  },
  {
    id: "assets",
    title: "How You Own Things",
    subtitle: "From money to asset in 4 steps",
    accent: "from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-400",
    entries: [
      { term: "The Pool", def: "A capital pool that buys a real-world asset. You commit money into it. When the pool hits 100% filled, it closes. The asset is acquired. You become an owner.", highlight: true },
      { term: "The Commitment", def: "Your money held in escrow until the pool fills. Minimum is usually $1. If the pool never fills, you get 100% of your money back. No risk of loss on unfilled pools." },
      { term: "The PAC", def: "Perpetual Asset Contract. Your legal proof of ownership. It is not a stock. It is not crypto. It is a real legal contract tied to a real asset. You own a percentage of that asset.", highlight: true },
      { term: "The Ghost Hall", def: "The 14-day window after a pool fills. All committers must vote to elect the Executive Cabinet (Speaker, Treasurer, Warden, Scribe). No cabinet = no live hall." },
      { term: "The Live Hall", def: "Your digital parliament. Revenue flows in. Dividends pay out automatically every month. You propose votes, govern the asset, and watch it grow." },
      { term: "The Vertical", def: "The industry of your asset. LedgerProp (real estate), LedgerAgri (farms), LedgerBiz (restaurants), LedgerEnergy (solar), LedgerSport (sports teams), and more." },
    ],
  },
  {
    id: "money",
    title: "How Money Moves",
    subtitle: "Where every dollar goes",
    accent: "from-emerald-500/20 to-teal-500/5 border-emerald-500/20 text-emerald-400",
    entries: [
      { term: "Gross Revenue", def: "All the money the asset makes. Rent from tenants. Crop sales. Restaurant revenue. Ticket sales. Charter fees. This is the raw income." },
      { term: "8th Ledger Tithe (20%)", def: "The empire takes 20% of gross revenue. This funds insurance, legal, maintenance, payroll, protocol development, and the team that keeps everything running. Forever.", highlight: true },
      { term: "Payroll", def: "If your hall has workers (managers, chefs, farmhands), their salaries are paid from gross revenue BEFORE dividends. The 8th Ledger hires, pays, and manages them. You never see a salary." },
      { term: "IHCP Repayment", def: "Internal Hall Contribution Pool. If the hall borrowed money from owners for an upgrade or inventory, that debt is repaid from revenue BEFORE dividends. 5% priority return to contributors." },
      { term: "Net Hall Revenue", def: "What is left after tithe, payroll, and IHCP. This is the pie that gets split among owners by ownership percentage. Your 5% ownership = 5% of net revenue.", highlight: true },
      { term: "Your Dividend", def: "Paid automatically to your wallet every month. No one approves it. No one delays it. The protocol calculates it and sends it. You just wake up richer.", highlight: true },
    ],
  },
  {
    id: "markets",
    title: "The Markets",
    subtitle: "Buy, sell, and trade",
    accent: "from-rose-500/20 to-red-500/5 border-rose-500/20 text-rose-400",
    entries: [
      { term: "Ownership Exchange", def: "Sell your PAC to another user. Full sale (leave the hall) = 1% fee. Fractional sale (keep some ownership) = 2% fee. You set the price. The 8th Ledger sets the floor.", highlight: true },
      { term: "Dynamic Valuation", def: "The real calculated value of your PAC. Based on asset book value + all dividends ever paid + asset health premium + hall reputation bonus - any debts. This is your floor price. You cannot sell below it without hall approval.", highlight: true },
      { term: "Forge Exchange", def: "The public inventory market. Buy physical products from halls — crops, restaurant meals, electronics, sports merchandise. Anyone can buy. 5% platform fee. Revenue goes to the hall treasury, then to owners as dividends." },
      { term: "48-Hour Escrow", def: "When you buy a PAC, your money is held for 48 hours. Either party can flag for review. After 48 hours, ownership transfers automatically and the seller gets paid. Safe. Clean. Trustless." },
      { term: "KYC Gate", def: "To buy a PAC, your KYC tier must match or exceed the seller's tier. A Whale seller cannot sell to a Visitor. This prevents fraud and protects the ecosystem." },
    ],
  },
  {
    id: "governance",
    title: "How You Govern",
    subtitle: "Democracy, weighted by ownership",
    accent: "from-indigo-500/20 to-blue-500/5 border-indigo-500/20 text-indigo-400",
    entries: [
      { term: "The Speaker", def: "Elected every 6 months. Proposes strategies and appeals to the 8th Ledger for execution. Cannot spend money. Only proposes.", highlight: true },
      { term: "The Treasurer", def: "Elected every 6 months. Read-only treasury oversight. Flags anomalies. Holds one multi-sig key. Cannot spend. Only watches." },
      { term: "The Warden", def: "Elected every 6 months. Monitors insurance, maintenance, security, and staffing. Proposes repairs and safety upgrades." },
      { term: "The Scribe", def: "Elected every 6 months. Handles communications, publishes reports, coordinates messaging. Proposes marketing and outreach." },
      { term: "Proposals", def: "The only way to spend hall money. Any owner can propose. Requires 51% capital-weighted vote to pass. 'Lease the building' = proposal. 'Fix the roof' = proposal. 'Hire a manager' = proposal." },
      { term: "Sovereign Stream", def: "Not a chat room. A structured decision thread. Only proposals, reports, appeals, and 8th Ledger updates. Threaded. Searchable. Immutable. No memes. No spam. Only governance." },
      { term: "Vote Weight", def: "Your voting power equals your ownership percentage. Own 10%? Your vote counts as 10%. Own 1%? Your vote counts as 1%. The more skin you have in the game, the more say you have." },
    ],
  },
  {
    id: "health",
    title: "Asset Health",
    subtitle: "Know what you own",
    accent: "from-sky-500/20 to-cyan-500/5 border-sky-500/20 text-sky-400",
    entries: [
      { term: "SRI — Sovereign Reputation Index", def: "A hall's governance health score (0-100). Measures voter turnout, revenue consistency, on-time dividends, proposal quality, inactive owners, and marketplace turnover. Higher = better privileges.", highlight: true },
      { term: "AHGI — Asset Health Growth Index", def: "The asset's physical and financial condition (0-100). Thriving (80-100) means expansion is possible. Critical (0-19) for 3 months triggers automatic closure and liquidation. You are protected.", highlight: true },
      { term: "Platinum Hall", def: "SRI 90-100. Featured in the Agora. Reduced marketplace fees (0.25%). Early access to new pools. This is the elite tier of halls." },
      { term: "At Risk Hall", def: "SRI 0-39. 8th Ledger oversight mode. Dividends paused until governance reforms are completed. The empire steps in to protect your capital." },
      { term: "Closure Protocol", def: "If an asset fails for 3 consecutive months, the 8th Ledger automatically sells it, pays all debts, pays worker severance, and distributes the remaining proceeds to all owners by percentage. You never lose everything.", highlight: true },
    ],
  },
  {
    id: "cycles",
    title: "The Meridian Cycle",
    subtitle: "How new assets are born",
    accent: "from-fuchsia-500/20 to-pink-500/5 border-fuchsia-500/20 text-fuchsia-400",
    entries: [
      { term: "The Hush (48 hours)", def: "Darkness. A continent is announced. No pools visible. Just a pulsing dot and a countdown. The empire is watching. The world is waiting." },
      { term: "The Unveil (24 hours)", def: "Blurred cards slide in. Location hints only. 'West African Coast.' 'East Asian Plains.' The Oracle opens for predictions. Guess the winner. Earn standing." },
      { term: "The Reveal (24 hours)", def: "Full data explodes into view. One vote per user. Winner determined by votes + Architect's Hand tiebreaker. The chosen pool is forged." },
      { term: "The Forge (6 hours)", def: "The winner pool opens for commitment. First 100 committers earn 'Early Ledger' status. The race begins." },
      { term: "Continent Lock", def: "The winning continent cannot source the next pool for 2 cycles. This forces global spread. The empire does not concentrate. It expands." },
    ],
  },
  {
    id: "oracle",
    title: "The Oracle",
    subtitle: "Predict. Earn standing. No money required.",
    accent: "from-yellow-500/20 to-amber-500/5 border-yellow-500/20 text-yellow-400",
    entries: [
      { term: "Forecast", def: "Predict which vertical + country will win the next Meridian Cycle. No money. No stakes. Just foresight. Correct predictions earn Oracle Standing points." },
      { term: "Seer", def: "10 correct predictions. Bronze icon. Codex access. You are beginning to see patterns." },
      { term: "Oracle", def: "50 correct predictions. Silver icon. Early pool access (24 hours before the public). You are respected." },
      { term: "Prophet", def: "100 correct predictions. Gold icon. Your name appears on pool cards. You may be invited to the Council. You are legendary." },
    ],
  },
  {
    id: "agora",
    title: "The Agora",
    subtitle: "The public square",
    accent: "from-teal-500/20 to-emerald-500/5 border-teal-500/20 text-teal-400",
    entries: [
      { term: "The Stoa", def: "Suggest assets for future pools. Propose a location. Justify it. The community upvotes and downvotes. Top suggestions become real pools. You shape the empire." },
      { term: "The Archives", def: "Q&A. The Scribe (AI) answers instantly. The Architect answers strategic questions rarely. Everything is recorded. Everything is searchable." },
      { term: "The Relay", def: "Read-only hall transparency. See what halls voted on without seeing internals, amounts, or names. 'Hall #2847 voted to lease to corporate tenant — passed 73%.' Public accountability." },
      { term: "The Pulse", def: "System health dashboard. Active pools. Total committed. Dividends distributed this month. Empire status: BEATING (green) / FLAT (red) / RACING (yellow)." },
    ],
  },
];

const FAQS = [
  {
    q: "How do I actually make money?",
    a: "Commit to a pool. When it fills, you become a legal co-owner. Every month, the asset generates revenue. After the 20% tithe, payroll, and any debts, the remaining profit is split by ownership percentage and paid to your wallet automatically. You can also sell your PAC on the Ownership Exchange at its true dynamic value — often higher than what you paid.",
  },
  {
    q: "What if the pool never fills?",
    a: "Your commitment is held in escrow. If the pool does not reach 100% within the campaign window, you get 100% of your money back. No fees. No penalties. The empire does not take what is not earned.",
  },
  {
    q: "Can I lose money?",
    a: "Only if the asset itself fails. But even then, the Closure Protocol protects you. If an asset is unprofitable for 3 months, the 8th Ledger automatically sells it, pays all obligations, and distributes the remaining proceeds to owners. You may not get your full investment back, but you will never be trapped in a dead asset. The Sanctuary fund exists specifically to smooth dividends during downturns.",
  },
  {
    q: "Who manages the asset?",
    a: "The 8th Ledger Holdings Ltd. handles everything — insurance, legal, maintenance, tenant screening, payroll, tax, and compliance. The hall (you and the other owners) governs strategy through votes. You propose. The empire executes. You never manage day-to-day operations.",
  },
  {
    q: "How is this different from crypto or stocks?",
    a: "You do not own a token. You do not own a share of a company. You own a real, physical asset — a house, a farm, a solar plant, a restaurant. Your PAC is a legal contract tied to that asset. It is not speculative. It generates real revenue from real customers. And it is perpetual — it does not expire.",
  },
  {
    q: "What is the minimum to start?",
    a: "Usually $1. Some pools have higher minimums set by the Architect. But the empire is designed to be accessible. You can start with a single dollar and own a fraction of a real asset.",
  },
  {
    q: "How do I sell my ownership?",
    a: "Go to the Ownership Exchange. List your PAC at any price above the Dynamic Valuation floor. A buyer with matching KYC tier can purchase it. Funds are held in 48-hour escrow, then released to you. Ownership transfers instantly. You can sell 100% (leave the hall) or a fraction (stay with reduced ownership).",
  },
  {
    q: "What is the 8th Ledger Tithe?",
    a: "20% of gross revenue goes to the 8th Ledger. This is not profit for a person. It funds the infrastructure that protects your asset — insurance, legal, maintenance, payroll, protocol development, and the Closure Protocol reserve. You are paying for the empire to protect your capital forever.",
  },
  {
    q: "Can I propose a new asset?",
    a: "Yes. Go to the Agora → The Stoa. Suggest an asset type, location, and justification. The community votes. If it rises to the top, the Architect may include it in a future Meridian Cycle. You literally shape what the empire builds next.",
  },
  {
    q: "What happens if I stop logging in?",
    a: "Year 1: Warnings. Your PACs still earn dividends. Year 2: Dormancy Vault. Your PACs are held in trust. You can reclaim them instantly by logging back in. Year 3: Auction. Your PACs are listed at 120% of Dynamic Valuation. 80% of proceeds go to your wallet if you return. 20% goes to the empire as a dormancy fee. Stay active.",
  },
];

/* ============================================================
   COMPONENTS
   ============================================================ */

function SectionCard({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-500 overflow-hidden backdrop-blur-sm",
      isOpen
        ? "border-white/[0.08] bg-white/[0.02]"
        : "border-white/[0.03] bg-white/[0.005] hover:border-white/[0.06]"
    )}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left group">
        <div className={cn(
          "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 bg-gradient-to-br",
          section.accent
        )}>
          <span className="text-sm font-black">{section.title.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-sm font-bold transition-colors", isOpen ? "text-white" : "text-white/60 group-hover:text-white/80")}>
            {section.title}
          </h3>
          <p className="text-[11px] text-white/25 mt-0.5">{section.subtitle}</p>
        </div>
        <ChevronRight className={cn("h-4 w-4 text-white/15 transition-transform duration-300 shrink-0", isOpen && "rotate-90")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {section.entries.map((entry, i) => (
                <motion.div
                  key={entry.term}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    entry.highlight
                      ? "border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.04]"
                      : "border-white/[0.03] bg-transparent hover:bg-white/[0.015]"
                  )}
                >
                  <h4 className={cn("text-sm font-bold mb-1.5", entry.highlight ? "text-white" : "text-white/70")}>
                    {entry.term}
                  </h4>
                  <p className="text-[13px] text-white/35 leading-relaxed">{entry.def}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      "rounded-xl border transition-all duration-300 overflow-hidden",
      isOpen ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.03] bg-white/[0.005] hover:border-white/[0.06]"
    )}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left group">
        <HelpCircle className={cn("h-4 w-4 shrink-0 transition-colors", isOpen ? "text-cyan-400" : "text-white/15 group-hover:text-white/30")} />
        <span className={cn("text-sm font-semibold flex-1", isOpen ? "text-white" : "text-white/50 group-hover:text-white/70")}>{q}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 text-white/15 transition-transform duration-200 shrink-0", isOpen && "rotate-90")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-11">
              <p className="text-[13px] text-white/40 leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function CodexPage() {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("start");
  const [openFaq, setOpenFaq] = useState<string | null>("How do I actually make money?");
  const [showGuide, setShowGuide] = useState(true);

  const filtered = useMemo(() => {
    if (!search.trim()) return CODEX;
    const q = search.toLowerCase();
    return CODEX.map((s) => ({
      ...s,
      entries: s.entries.filter((e) => e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q)),
    })).filter((s) => s.entries.length > 0);
  }, [search]);

  const totalTerms = CODEX.reduce((a, s) => a + s.entries.length, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-cyan-500/[0.02] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-500/[0.015] rounded-full blur-[180px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-amber-500/[0.01] rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                The <span className="text-amber-400">Codex</span>
              </h1>
              <p className="text-[11px] text-white/25 font-mono tracking-wide">THE COMPLETE HANDBOOK • {totalTerms} TERMS DEFINED</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/15" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search terms, slang, concepts..."
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/10 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded text-white/15 hover:text-white/30 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all shrink-0",
                showGuide ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
              )}
            >
              <Lightbulb className="h-4 w-4" />
              Quick Start
            </button>
          </div>
        </motion.div>

        {/* Quick Start Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-3xl" />
                <h3 className="text-sm font-bold text-amber-300 mb-1 flex items-center gap-2 relative z-10">
                  <Sparkles className="h-4 w-4" />
                  New to the Empire? Start Here.
                </h3>
                <p className="text-xs text-white/30 mb-5 relative z-10">Three steps from visitor to sovereign owner.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                  {[
                    { step: "01", title: "Verify Identity", desc: "Complete SIV/KYC to become Sovereign. You cannot own anything as a Visitor.", color: "cyan" },
                    { step: "02", title: "Commit to a Pool", desc: "Browse active pools, pick an asset, and commit capital. Minimum is usually $1. No risk if it doesn't fill.", color: "emerald" },
                    { step: "03", title: "Govern & Earn", desc: "When the pool fills, vote in your Ghost Hall. Then earn monthly dividends forever. Sell anytime on the Exchange.", color: "amber" },
                  ].map((s) => (
                    <div key={s.step} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] transition-colors group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30", `group-hover:text-${s.color}-400 group-hover:bg-${s.color}-500/10`)}>
                          {s.step}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                      <p className="text-xs text-white/30 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] relative z-10">
                  <h4 className="text-xs font-bold text-white/50 mb-2 flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-amber-400/60" />
                    How to Make Money
                  </h4>
                  <p className="text-xs text-white/30 leading-relaxed">
                    <span className="text-white/60 font-semibold">Passive Income:</span> Own a PAC and receive monthly dividends automatically. The more you own, the more you earn.
                    <span className="mx-1 text-white/10">|</span>
                    <span className="text-white/60 font-semibold">Active Trading:</span> Buy PACs below their Dynamic Valuation, hold while the asset appreciates, then sell above your cost on the Ownership Exchange.
                    <span className="mx-1 text-white/10">|</span>
                    <span className="text-white/60 font-semibold">Inventory:</span> If your hall has products (crops, meals, merch), the public buys them and revenue flows to the hall treasury → your dividends.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results count */}
        {search && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/20 mb-4 font-mono">
            Found {filtered.reduce((a, s) => a + s.entries.length, 0)} result{filtered.reduce((a, s) => a + s.entries.length, 0) !== 1 ? "s" : ""} across {filtered.length} section{filtered.length !== 1 ? "s" : ""}
          </motion.p>
        )}

        {/* Codex Sections */}
        <div className="space-y-3 mb-12">
          {filtered.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/20 text-sm">No terms match "{search}"</p>
              <button onClick={() => setSearch("")} className="text-xs text-amber-400/60 hover:text-amber-400 mt-2">Clear search</button>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Frequently Asked</h2>
              <p className="text-[11px] text-white/25">The questions everyone asks first</p>
            </div>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <FaqItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === faq.q}
                onToggle={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
              />
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] text-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            The 8th Ledger Protocol • Live & Immutable
          </div>
        </motion.div>
      </div>
    </div>
  );
}