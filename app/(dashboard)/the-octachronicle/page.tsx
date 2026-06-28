// app/(dashboard)/codex/page.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scroll,
  Crown,
  Shield,
  Scale,
  Landmark,
  Cpu,
  Globe,
  Infinity,
  ChevronRight,
  Lock,
  Users,
  Vote,
  Wallet,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Gem,
  Eye,
  Flame,
  Droplets,
  Zap,
  Building2,
  Car,
  Smartphone,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plane,
  Sprout,
  Trophy,
  Radio,
  Factory,
  ArrowRight,
  X,
} from "lucide-react";

/*  Types  */
interface Ledger {
  order: number;
  name: string;
  latin: string;
  era: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  flaw: string;
}

interface Vertical {
  key: string;
  name: string;
  icon: React.ReactNode;
  class: "I" | "II" | "III";
  strategy: string;
  revenue: string;
  color: string;
}

/*  Data: The Seven Ages  */
const SEVEN_LEDGERS: Ledger[] = [
  {
    order: 1,
    name: "The Oral Ledger",
    latin: "Mos Memoriae",
    era: "Before 3200 BC",
    icon: <Users className="w-5 h-5" />,
    color: "text-stone-400",
    description:
      "Before writing, wealth was memory. Tribes remembered who owned the cattle, who owed the grain, who held the hunting rights. If the elder died, half the economy died with him. Trust was blood-deep and geography-locked.",
    flaw: "Wealth died with the mind that held it.",
  },
  {
    order: 2,
    name: "The Clay Ledger",
    latin: "Tabulae Cuneatae",
    era: "Sumer, 3200 BC",
    icon: <Scroll className="w-5 h-5" />,
    color: "text-amber-600",
    description:
      "Cuneiform tablets recorded sheep, barley, and debt. For the first time, wealth could outlive the human mind. But it was static—carved in stone, literally. You could record ownership, but you could not trade it.",
    flaw: "Recorded, but immovable.",
  },
  {
    order: 3,
    name: "The Papyrus Ledger",
    latin: "Volumina Aegyptia",
    era: "Egypt, Greece, Rome",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-yellow-500",
    description:
      "Scrolls enabled contracts, loans, and cross-border commerce. Wealth became portable. But it required scribes, temples, and trust in institutions. The ledger served the powerful, not the people.",
    flaw: "Wealth served the temple, not the citizen.",
  },
  {
    order: 4,
    name: "The Banking Ledger",
    latin: "Liber Mediceus",
    era: "Florence, 1400s",
    icon: <Landmark className="w-5 h-5" />,
    color: "text-emerald-500",
    description:
      "Double-entry bookkeeping. For the first time, wealth could multiply itself through debt and interest. Banks became the gatekeepers of the ledger. If you were outside the gate, you were invisible.",
    flaw: "The gatekeepers became the gods of money.",
  },
  {
    order: 5,
    name: "The Stock Ledger",
    latin: "Chartae Mercatoriae",
    era: "Amsterdam, 1602",
    icon: <Scale className="w-5 h-5" />,
    color: "text-blue-400",
    description:
      "Paper certificates let strangers own pieces of companies together. Wealth became divisible. But only the big players could list. The minimum ticket to play was still a fortune.",
    flaw: "Divisible, but only for the already-rich.",
  },
  {
    order: 6,
    name: "The Digital Ledger",
    latin: "Machina Computatrix",
    era: "1960s – 2000s",
    icon: <Cpu className="w-5 h-5" />,
    color: "text-cyan-400",
    description:
      "Banks moved to computers. Transactions became instant, but the ledger remained private, centralized, and permissioned. You did not own your record—the bank did.",
    flaw: "Instant, but still owned by someone else.",
  },
  {
    order: 7,
    name: "The Blockchain Ledger",
    latin: "Catena Cryptographica",
    era: "2009 – Present",
    icon: <Globe className="w-5 h-5" />,
    color: "text-violet-400",
    description:
      "The ledger became public, distributed, and trustless. But it solved the wrong problem: it tokenized speculation, not production. Crypto proved the technology. Now someone had to prove the use case.",
    flaw: "Public, but empty of real assets.",
  },
];

/*  Data: The 11 Verticals (with SportLedger)  */
const VERTICALS: Vertical[] = [
  {
    key: "prop",
    name: "LedgerProp",
    icon: <Building2 className="w-4 h-4" />,
    class: "I",
    strategy: "Long-term lease to operator",
    revenue: "Monthly rent, lease premiums, occupancy fees",
    color: "text-emerald-400",
  },
  {
    key: "auto",
    name: "LedgerAuto",
    icon: <Car className="w-4 h-4" />,
    class: "I",
    strategy: "Lease to drivers / fleet operators",
    revenue: "Per-mile lease, maintenance retainers, fleet subscriptions",
    color: "text-blue-400",
  },
  {
    key: "energy",
    name: "LedgerEnergy",
    icon: <Zap className="w-4 h-4" />,
    class: "I",
    strategy: "Power Purchase Agreements & grid feed-in",
    revenue: "kWh sales, carbon credits, capacity payments",
    color: "text-yellow-400",
  },
  {
    key: "access",
    name: "LedgerAccess",
    icon: <Radio className="w-4 h-4" />,
    class: "I",
    strategy: "Long-term lease to telecom / utility operators",
    revenue: "Tower leases, bandwidth fees, usage charges",
    color: "text-purple-400",
  },
  {
    key: "health",
    name: "LedgerHealth",
    icon: <HeartPulse className="w-4 h-4" />,
    class: "II",
    strategy: "License to clinics / per-scan operations",
    revenue: "Per-scan fees, equipment lease, therapy sessions",
    color: "text-rose-400",
  },
  {
    key: "edu",
    name: "LedgerEdu",
    icon: <GraduationCap className="w-4 h-4" />,
    class: "II",
    strategy: "License to institutions / training operators",
    revenue: "Tuition share, certification fees, corporate training",
    color: "text-orange-400",
  },
  {
    key: "travel",
    name: "LedgerTravel",
    icon: <Plane className="w-4 h-4" />,
    class: "II",
    strategy: "Charter and lease to operators",
    revenue: "Charter fees, subscriptions, event packages",
    color: "text-sky-400",
  },
  {
    key: "biz",
    name: "LedgerBiz",
    icon: <Briefcase className="w-4 h-4" />,
    class: "III",
    strategy: "Direct operation — daily revenue",
    revenue: "Daily sales, service margins, contract revenue",
    color: "text-indigo-400",
  },
  {
    key: "agri",
    name: "LedgerAgri",
    icon: <Sprout className="w-4 h-4" />,
    class: "III",
    strategy: "Direct operation — grow, harvest, sell",
    revenue: "Crop sales, livestock, agritourism, processing",
    color: "text-green-400",
  },
  {
    key: "tech",
    name: "LedgerTech",
    icon: <Smartphone className="w-4 h-4" />,
    class: "III",
    strategy: "Direct operation — fast turnover inventory",
    revenue: "Hardware margin, repair services, tech licensing",
    color: "text-cyan-400",
  },
  {
    key: "sport",
    name: "SportLedger",
    icon: <Trophy className="w-4 h-4" />,
    class: "III",
    strategy: "Direct operation — matchday & franchise revenue",
    revenue: "Tickets, sponsorships, media rights, transfers, merchandise",
    color: "text-amber-400",
  },
];

/*  Data: The Three Classes  */
const HALL_CLASSES = [
  {
    class: "I",
    title: "Class I — Passive",
    subtitle: "The Silent Halls",
    description:
      "8th Ledger manages everything. Minimal hall input. No workers hired by hall. Owners govern lease terms, major repairs, and sale votes. Revenue flows automatically.",
    verticals: ["LedgerProp", "LedgerAuto", "LedgerEnergy", "LedgerAccess"],
    color: "border-emerald-500/30 bg-emerald-950/20",
    accent: "text-emerald-400",
  },
  {
    class: "II",
    title: "Class II — Managed",
    subtitle: "The Stewarded Halls",
    description:
      "Hall hires and approves operators. 8th Ledger executes. Limited staff through licensed operators. Owners vote on operator selection, service standards, and pricing tiers.",
    verticals: ["LedgerHealth", "LedgerEdu", "LedgerTravel"],
    color: "border-blue-500/30 bg-blue-950/20",
    accent: "text-blue-400",
  },
  {
    class: "III",
    title: "Class III — Active",
    subtitle: "The Sovereign Halls",
    description:
      "Hall runs operations daily. Full staffing, inventory, and pricing control. Owners propose hires, approve candidates, review performance, and manage supply chains. 8th Ledger provides infrastructure and executes payroll.",
    verticals: ["LedgerBiz", "LedgerAgri", "LedgerTech", "SportLedger"],
    color: "border-amber-500/30 bg-amber-950/20",
    accent: "text-amber-400",
  },
];

/*  Animation Variants  */
const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

/*  Components  */

function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-slate-100 bg-clip-text text-transparent"
      >
        {children}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-3 text-slate-400 text-sm uppercase tracking-[0.2em]"
        >
          {subtitle}
        </motion.p>
      )}
      <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </div>
  );
}

function LedgerCard({ ledger, index }: { ledger: Ledger; index: number }) {
  const isEven = index % 2 === 0;
  return (
    <motion.div
      custom={index}
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`relative flex flex-col md:flex-row gap-6 md:gap-10 items-start ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Timeline node */}
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 hidden md:block" />
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-6 w-3 h-3 rounded-full bg-slate-900 border-2 border-cyan-500/50 hidden md:block" />

      {/* Number badge */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl border border-slate-700/50 bg-slate-900/80 flex items-center justify-center ${ledger.color} font-serif text-lg font-bold backdrop-blur-sm z-10`}
      >
        {ledger.order}
      </div>

      {/* Card */}
      <div
        className={`flex-1 rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-6 md:p-8 hover:border-slate-600/50 transition-colors duration-500 group ${
          isEven ? "md:mr-16" : "md:ml-16"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-slate-300">
            {ledger.icon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {ledger.name}
            </h3>
            <p className="text-xs text-slate-500 font-serif italic">
              {ledger.latin} · {ledger.era}
            </p>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base">
          {ledger.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-400/80">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>The Fatal Flaw: {ledger.flaw}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ClassCard({
  cls,
  index,
}: {
  cls: (typeof HALL_CLASSES)[number];
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`rounded-2xl border ${cls.color} p-6 md:p-8 backdrop-blur-sm relative overflow-hidden group hover:border-opacity-60 transition-all duration-500`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Factory className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${cls.color.replace(
              "bg-",
              "border-"
            )} ${cls.accent}`}
          >
            {cls.class}
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{cls.title}</h3>
            <p className="text-xs text-slate-400 italic font-serif">
              {cls.subtitle}
            </p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-5">
          {cls.description}
        </p>
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Verticals
          </p>
          <div className="flex flex-wrap gap-2">
            {cls.verticals.map((v) => (
              <span
                key={v}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 border border-slate-700/40 text-slate-300"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VerticalGrid() {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "I" | "II" | "III">(
    "ALL"
  );

  const filtered =
    activeFilter === "ALL"
      ? VERTICALS
      : VERTICALS.filter((v) => v.class === activeFilter);

  return (
    <div>
      <div className="flex justify-center gap-2 mb-8">
        {(["ALL", "I", "II", "III"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
              activeFilter === f
                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                : "bg-slate-900/40 border-slate-700/30 text-slate-500 hover:text-slate-300"
            }`}
          >
            {f === "ALL" ? "All Verticals" : `Class ${f}`}
          </button>
        ))}
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((v) => (
            <motion.div
              key={v.key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-5 hover:border-slate-600/40 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`${v.color}`}>{v.icon}</span>
                  <span className="font-semibold text-slate-100 text-sm">
                    {v.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    v.class === "I"
                      ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/20"
                      : v.class === "II"
                      ? "border-blue-500/20 text-blue-400 bg-blue-950/20"
                      : "border-amber-500/20 text-amber-400 bg-amber-950/20"
                  }`}
                >
                  C{v.class}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{v.strategy}</p>
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <TrendingUp className="w-3 h-3 mt-0.5 text-slate-600" />
                <span>{v.revenue}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StatPillar({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm"
    >
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-cyan-400 mb-3">
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-slate-100 font-serif">
        {value}
      </p>
      <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
        {label}
      </p>
    </motion.div>
  );
}

/*  Main Page  */
export default function OctachroniclePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/*  HERO  */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-24 md:mb-32"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-semibold uppercase tracking-[0.2em] mb-8">
            <BookOpen className="w-3.5 h-3.5" />
            The Sacred Record
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-b from-slate-100 via-slate-200 to-slate-500 bg-clip-text text-transparent font-serif">
              The Octachronicle
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
            <span className="text-cyan-400 font-medium">
              Codex of the Eight Ages.
            </span>{" "}
            A complete history of how humanity recorded wealth — from the memory
            of elders to the perpetual ownership protocol of the 8th Ledger.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 border border-slate-800/60 rounded-lg px-4 py-2 bg-slate-900/30">
              <Crown className="w-3.5 h-3.5 text-amber-500/60" />
              <span>8th Ledger Holdings Ltd.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 border border-slate-800/60 rounded-lg px-4 py-2 bg-slate-900/30">
              <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
              <span>Cayman Islands</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 border border-slate-800/60 rounded-lg px-4 py-2 bg-slate-900/30">
              <Lock className="w-3.5 h-3.5 text-cyan-500/60" />
              <span>Perpetual Asset Contracts</span>
            </div>
          </div>
        </motion.section>

        {/*  THE PROBLEM  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="Why the 8th Age Had to Come">
            The Crisis of the Seven Ages
          </SectionTitle>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              variants={scaleIn}
              className="rounded-2xl border border-rose-900/20 bg-rose-950/10 p-8 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-950/30 border border-rose-800/20 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-3">
                The Extraction Machine
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                For 5,000 years, banks and intermediaries have inserted
                themselves between people and productive assets. They create
                money from nothing, lend it at interest, and keep the upside
                while you take the risk. The 7th Ledger proved we could
                decentralize the record. But it forgot to decentralize the{" "}
                <span className="text-slate-200">asset</span>.
              </p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className="rounded-2xl border border-amber-900/20 bg-amber-950/10 p-8 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-950/30 border border-amber-800/20 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-3">
                The Ownership Gap
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                A teenager in Manila with $5 cannot buy a fraction of a German
                wind farm. A teacher in Nairobi cannot own a piece of a London
                apartment. The minimum ticket to wealth has always been a
                fortune. The 8th Ledger removes the minimum.{" "}
                <span className="text-slate-200">$1 is enough.</span>
              </p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className="rounded-2xl border border-cyan-900/20 bg-cyan-950/10 p-8 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950/30 border border-cyan-800/20 flex items-center justify-center mb-5">
                <Flame className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-3">
                The Dead Asset Trap
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Traditional systems trap owners in failing assets. Stocks go to
                zero and you lose everything. Real estate decays and you pay to
                maintain it. The 8th Ledger introduces the{" "}
                <span className="text-slate-200">Closure Protocol</span> — if an
                asset fails, it is liquidated cleanly, everyone is paid, and
                capital is freed to flow into productive things again.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/*  THE SEVEN LEDGERS  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="A History Written in Stone, Papyrus, and Code">
            The Seven Ages That Came Before
          </SectionTitle>

          <div className="relative space-y-12 md:space-y-16">
            {SEVEN_LEDGERS.map((ledger, i) => (
              <LedgerCard key={ledger.order} ledger={ledger} index={i} />
            ))}
          </div>
        </section>

        {/*  THE EIGHTH LEDGER  */}
        <section className="mb-24 md:mb-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-transparent to-transparent rounded-3xl -z-10" />

          <SectionTitle subtitle="The Age of Perpetual Ownership">
            The 8th Ledger
          </SectionTitle>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 mb-8">
              <Infinity className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6 font-serif">
              "The ledger stops recording money and starts recording ownership
              of real, productive things."
            </h3>
            <p className="text-slate-400 leading-relaxed text-base md:text-lg">
              Not coins. Not speculation. Not debt.{" "}
              <span className="text-cyan-300 font-medium">
                Assets that generate revenue.
              </span>{" "}
              Wind farms, apartment blocks, football clubs, farmland, logistics
              hubs — owned fractionally by thousands, governed democratically,
              traded instantly, and closed mathematically when they fail.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          >
            <StatPillar
              icon={<Wallet className="w-5 h-5" />}
              value="$1"
              label="Minimum Commitment"
            />
            <StatPillar
              icon={<Vote className="w-5 h-5" />}
              value="51%"
              label="Democratic Threshold"
            />
            <StatPillar
              icon={<Gem className="w-5 h-5" />}
              value="11"
              label="Verticals"
            />
            <StatPillar
              icon={<Globe className="w-5 h-5" />}
              value="∞"
              label="Global Access"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm p-8 md:p-12"
          >
            <h4 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-cyan-400" />
              What the 8th Ledger Is
            </h4>
            <ul className="space-y-4 text-sm md:text-base text-slate-300">
              {[
                "A sovereign financial empire where people commit capital into asset pools and become legal co-owners through Perpetual Asset Contracts (PACs).",
                "A democratic parliament where owners govern their assets through halls, elect executives, and vote on every major decision.",
                "A protocol that manages insurance, legal structure, maintenance, tax, payroll, staffing, and dynamic valuation — so owners focus on governance and earnings.",
                "An exchange where ownership is liquid. Sell your PAC at its true dynamic value anytime. Never below floor price without democratic approval.",
                "A closure protocol that protects capital. If an asset fails, it is liquidated cleanly, workers get severance, and owners receive their proportional payout.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/60 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <h4 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <X className="w-5 h-5 text-rose-400" />
                What the 8th Ledger Is Not
              </h4>
              <ul className="space-y-4 text-sm md:text-base text-slate-400">
                {[
                  "A platform where random people spend pool money. Only democratic votes can allocate capital.",
                  "A crypto token scheme. There is no speculative coin. Only real assets, real revenue, real dividends.",
                  "A gambling den. The Oracle is a forecast system for standing and reputation — no money, no stakes.",
                  "A place where PACs are sold at fantasy prices. Dynamic Valuation Engine calculates the real floor price from asset performance.",
                  "A system that traps owners in dead assets. The Closure Protocol guarantees clean exit.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500/60 flex-shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </section>

        {/*  HALL CLASSES  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="The Three Orders of Sovereignty">
            The Hall Classes
          </SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HALL_CLASSES.map((cls, i) => (
              <ClassCard key={cls.class} cls={cls} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 rounded-xl border border-amber-500/10 bg-amber-950/10 p-6 flex items-start gap-4"
          >
            <Trophy className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">
                SportLedger — Class III Active
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                SportLedger operates football clubs, basketball franchises,
                tennis academies, esports teams, and racing teams. Owners vote
                on player transfers, ticket pricing, sponsorship deals, and
                staffing. Revenue flows from matchday tickets, media rights,
                merchandise, and player transfers — all governed by the hall and
                executed by the 8th Ledger.
              </p>
            </div>
          </motion.div>
        </section>

        {/*  THE 11 VERTICALS  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="The Eleven Pillars of the Empire">
            The Verticals
          </SectionTitle>
          <VerticalGrid />
        </section>

        {/*  THE PROTOCOL INFRASTRUCTURE RESERVE  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="The Vault of the Empire">
            The Protocol Infrastructure Reserve
          </SectionTitle>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-slate-800/50 bg-slate-900/20 p-8 md:p-12 backdrop-blur-sm"
          >
            <p className="text-slate-300 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
              The PIR is the capital allocation that transforms raw acquisition
              cost into a fully legal, insured, governed, income-producing
              asset. It is not profit. It is infrastructure. The public knows it
              exists and what it protects, but never sees its contents.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "The Shield",
                  pct: "25%",
                  desc: "Lloyd's coverage, casualty, liability, force majeure",
                  icon: <Shield className="w-4 h-4" />,
                },
                {
                  name: "The Seal",
                  pct: "20%",
                  desc: "Entity registration, SPV formation, beneficial interest documents",
                  icon: <Lock className="w-4 h-4" />,
                },
                {
                  name: "The Forge",
                  pct: "20%",
                  desc: "Repairs, upkeep, vendor contracts, management fees, payroll",
                  icon: <Flame className="w-4 h-4" />,
                },
                {
                  name: "The Spire",
                  pct: "15%",
                  desc: "Protocol development, infrastructure, API, audits",
                  icon: <Cpu className="w-4 h-4" />,
                },
                {
                  name: "The Vanguard",
                  pct: "12%",
                  desc: "New vertical R&D, geographic expansion, ecosystem grants",
                  icon: <ArrowRight className="w-4 h-4" />,
                },
                {
                  name: "The Sanctuary",
                  pct: "8%",
                  desc: "Vacancy coverage, dividend smoothing, closure protection",
                  icon: <Droplets className="w-4 h-4" />,
                },
              ].map((pillar) => (
                <div
                  key={pillar.name}
                  className="rounded-xl border border-slate-800/40 bg-slate-900/40 p-5 hover:border-slate-600/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-300 font-semibold text-sm">
                      {pillar.name}
                    </span>
                    <span className="text-cyan-400 font-bold text-sm font-mono">
                      {pillar.pct}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-xl border border-cyan-500/10 bg-cyan-950/10">
              <p className="text-sm text-cyan-300/80 text-center font-medium">
                True Acquisition Cost: $100,000 + PIR: $100,000 = Total Pool
                Target: $200,000
              </p>
            </div>
          </motion.div>
        </section>

        {/*  THE COUNCIL  */}
        <section className="mb-24 md:mb-32">
          <SectionTitle subtitle="The Three Who Govern the Empire">
            The Council of the Eighth Ledger
          </SectionTitle>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "The Architect",
                role: "CEO & Keeper of the Blueprint",
                desc: "Operational control, pool design, strategic direction. Sets True Acquisition Cost and Pool Target. Proposes pools for the Meridian Cycle. Replaceable by Council vote.",
                icon: <Crown className="w-6 h-6" />,
                color: "text-amber-400",
                border: "border-amber-500/20",
                bg: "bg-amber-950/10",
              },
              {
                title: "The Warden",
                role: "Guardian of Compliance",
                desc: "Audit oversight, PIR release signatory, compliance enforcement. Independent. Ensures every asset is insured, every worker is legal, every dividend is correct.",
                icon: <Shield className="w-6 h-6" />,
                color: "text-emerald-400",
                border: "border-emerald-500/20",
                bg: "bg-emerald-950/10",
              },
              {
                title: "The Scribe",
                role: "Recorder of the Ledger",
                desc: "Platform security, infrastructure, disaster recovery. Ensures the protocol runs forever. Maintains the immutable record of ownership, votes, and transfers.",
                icon: <Scroll className="w-6 h-6" />,
                color: "text-cyan-400",
                border: "border-cyan-500/20",
                bg: "bg-cyan-950/10",
              },
            ].map((council) => (
              <motion.div
                key={council.title}
                variants={scaleIn}
                className={`rounded-2xl border ${council.border} ${council.bg} p-8 backdrop-blur-sm`}
              >
                <div
                  className={`w-14 h-14 rounded-xl border ${council.border} bg-slate-900/40 flex items-center justify-center mb-5 ${council.color}`}
                >
                  {council.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-1">
                  {council.title}
                </h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                  {council.role}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {council.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-slate-500 italic font-serif">
              "No single hand holds the scepter. The 8th Ledger commands the
              system. The Council governs the empire. The protocol enforces the
              law."
            </p>
          </motion.div>
        </section>

        {/*  THE ONE SENTENCE  */}
        <section className="mb-24 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl border border-cyan-500/10 bg-gradient-to-b from-cyan-950/20 to-slate-900/20 p-10 md:p-16 text-center backdrop-blur-sm"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              <Gem className="w-3 h-3" />
              The Immutable Declaration
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl text-slate-100 leading-relaxed font-serif max-w-5xl mx-auto">
              "8th Ledger is a sovereign financial empire where you commit
              capital to own real-world assets across{" "}
              <span className="text-cyan-300">eleven verticals</span> — from
              real estate to{" "}
              <span className="text-amber-300">sports teams</span> — govern them
              through a digital parliament, hire workers through the 8th Ledger
              to operate them, earn monthly dividends forever, and sell your
              ownership at its true dynamic value anytime on the 8th Ledger
              Exchange. If an asset fails, the 8th Ledger closes it cleanly,
              pays everyone, and protects your capital."
            </p>
            <div className="mt-8 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <p className="mt-6 text-sm text-slate-500 font-medium">
              The 8th Ledger protects every asset. The community writes the law.
              The protocol enforces it.
            </p>
          </motion.div>
        </section>

        {/*  FOOTER  */}
        <footer className="text-center pb-12">
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 uppercase tracking-[0.3em]">
            <Infinity className="w-3 h-3" />
            The 8th Ledger Awaits
            <Infinity className="w-3 h-3" />
          </div>
          <p className="mt-3 text-[10px] text-slate-700">
            8th Ledger Holdings Ltd. · Cayman Islands · The Perpetual Ownership
            Protocol
          </p>
        </footer>
      </div>
    </div>
  );
}