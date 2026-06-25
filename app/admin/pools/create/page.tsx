"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Landmark,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp,
  Hexagon,
  Plane,
  Sprout,
  Sun,
  ArrowRight,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ImageIcon,
  ArrowLeft,
  Server,
  Percent,
  Diamond,
  Shield,
  Upload,
  Trash2,
  Play,
  Eye,
  EyeOff,
  Link2,
  MapPin,
  Smile,
  Sparkles,
  Ghost,
  Calculator,
  Wallet,
  FileText,
  ChevronDown,
  X,
  PiggyBank,
  Swords,
} from "lucide-react";

/* ============================================================
   VERTICALS — ONLY LEDGERPROP IS ACTIVE
   ============================================================ */
const ACTIVE_VERTICALS = [
  { id: "ledgerprop", name: "LedgerProp", label: "Real Estate", icon: Landmark, color: "emerald", emojis: ["🏠", "🏢", "🔑", "🏗️", "🌆"] },
];

const INACTIVE_VERTICALS = [
  { id: "ledgerauto", name: "LedgerAuto", label: "Automotive", icon: Zap, color: "cyan", emojis: ["🚗", "🏎️", "🚙", "🔋", "🏁"] },
  { id: "ledgeredu", name: "LedgerEdu", label: "Education", icon: Crown, color: "violet", emojis: ["🎓", "📚", "🏫", "✏️", "🧠"] },
  { id: "ledgeraccess", name: "LedgerAccess", label: "Access", icon: Lock, color: "amber", emojis: ["🎫", "🚪", "🎟️", "🔓", "🏟️"] },
  { id: "ledgerhealth", name: "LedgerHealth", label: "Health", icon: HeartPulse, color: "rose", emojis: ["🏥", "💊", "🩺", "💉", "🧬"] },
  { id: "ledgerbiz", name: "LedgerBiz", label: "Business", icon: TrendingUp, color: "orange", emojis: ["💼", "📈", "🏢", "🤝", "📊"] },
  { id: "ledgertech", name: "LedgerTech", label: "Technology", icon: Hexagon, color: "indigo", emojis: ["💻", "⚡", "🔌", "🤖", "🌐"] },
  { id: "ledgertravel", name: "LedgerTravel", label: "Travel", icon: Plane, color: "sky", emojis: ["✈️", "🌍", "🏨", "🗺️", "🧳"] },
  { id: "ledgeragri", name: "LedgerAgri", label: "Agriculture", icon: Sprout, color: "green", emojis: ["🌾", "🚜", "🍃", "🌱", "🍎"] },
  { id: "ledgerenergy", name: "LedgerEnergy", label: "Energy", icon: Sun, color: "yellow", emojis: ["☀️", "⚡", "🔋", "🌬️", "💡"] },
  { id: "ledgersport", name: "LedgerSport", label: "Sport", icon: Swords, color: "rose", emojis: ["⚽", "🏟️", "🏆", "🏋️", "🎽"] },
];

const ALL_VERTICALS = [...ACTIVE_VERTICALS, ...INACTIVE_VERTICALS];

const CMAP: Record<string, { text: string; bg: string; border: string; ring: string; gradient: string; glow: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", ring: "ring-emerald-500/20", gradient: "from-emerald-500/20 to-emerald-900/5", glow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", ring: "ring-cyan-500/20", gradient: "from-cyan-500/20 to-cyan-900/5", glow: "shadow-[0_0_30px_-10px_rgba(6,182,212,0.2)]" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", ring: "ring-violet-500/20", gradient: "from-violet-500/20 to-violet-900/5", glow: "shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)]" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "ring-amber-500/20", gradient: "from-amber-500/20 to-amber-900/5", glow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", ring: "ring-rose-500/20", gradient: "from-rose-500/20 to-rose-900/5", glow: "shadow-[0_0_30px_-10px_rgba(244,63,94,0.2)]" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", ring: "ring-orange-500/20", gradient: "from-orange-500/20 to-orange-900/5", glow: "shadow-[0_0_30px_-10px_rgba(249,115,22,0.2)]" },
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", ring: "ring-indigo-500/20", gradient: "from-indigo-500/20 to-indigo-900/5", glow: "shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", ring: "ring-sky-500/20", gradient: "from-sky-500/20 to-sky-900/5", glow: "shadow-[0_0_30px_-10px_rgba(14,165,233,0.2)]" },
  green: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", ring: "ring-green-500/20", gradient: "from-green-500/20 to-green-900/5", glow: "shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", ring: "ring-yellow-500/20", gradient: "from-yellow-500/20 to-yellow-900/5", glow: "shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]" },
};

const APPLICABLE_VERTICALS = ["ledgerbiz", "ledgeragri", "ledgeraccess", "ledgertravel", "ledgersport"];

/* ============================================================
   HALL CLASS MAPPING
   ============================================================ */
const HALL_CLASS_MAP: Record<string, string> = {
  ledgerprop: "I",
  ledgerauto: "I",
  ledgerenergy: "I",
  ledgeraccess: "I",
  ledgerhealth: "II",
  ledgeredu: "II",
  ledgertravel: "II",
  ledgerbiz: "III",
  ledgeragri: "III",
  ledgertech: "III",
  ledgersport: "III",
};

const HALL_CLASS_LABEL: Record<string, string> = {
  "I": "Class I — Passive",
  "II": "Class II — Managed",
  "III": "Class III — Active",
};

function getHallClass(verticalId: string): string {
  return HALL_CLASS_MAP[verticalId] || "I";
}

/* ============================================================
   LOCATION OPTION TYPE
   ============================================================ */
type LocationOptionInput = {
  name: string;
  address: string;
  lat: string;
  lng: string;
  cost: string;
  image: string;
  description: string;
};

/* ============================================================
   IMAGE UPLOAD ZONE
   ============================================================ */
function ImageUploadZone({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setUploading(true);
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const reader = new FileReader();
        reader.onload = (e) => { if (e.target?.result) newImages.push(e.target.result as string); };
        await new Promise<void>((resolve) => { reader.onloadend = () => resolve(); reader.readAsDataURL(file); });
      }
      onChange([...images, ...newImages]);
      setUploading(false);
    },
    [images, onChange]
  );

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragActive ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_30px_-10px_rgba(6,182,212,0.2)]" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        }`}
      >
        <input type="file" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="absolute inset-0 cursor-pointer opacity-0" />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-white/5"><Upload className="h-5 w-5 text-cyan-400" /></div>
        <p className="text-sm font-semibold text-white">Drop asset images here</p>
        <p className="mt-1 text-[11px] text-slate-500">PNG, JPG, WEBP up to 10MB each</p>
        {uploading && <div className="mt-3 flex items-center gap-2 text-[11px] text-cyan-400"><Server className="h-3 w-3 animate-spin" />Uploading...</div>}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 transition-all hover:bg-rose-500/30"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-mono text-white/70">{i + 1}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   VIDEO UPLOAD ZONE
   ============================================================ */
function VideoUploadZone({ video, onChange }: { video: string | null; onChange: (video: string | null) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("video/")) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => { if (e.target?.result) { onChange(e.target.result as string); setUploading(false); } };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
      {!video ? (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files); }}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            dragActive ? "border-violet-500/50 bg-violet-500/5 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)]" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <input type="file" accept="video/*" onChange={(e) => handleFile(e.target.files)} className="absolute inset-0 cursor-pointer opacity-0" />
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-white/5"><Play className="h-5 w-5 text-violet-400" /></div>
          <p className="text-sm font-semibold text-white">Drop showcase video</p>
          <p className="mt-1 text-[11px] text-slate-500">MP4, MOV up to 50MB</p>
          {uploading && <div className="mt-3 flex items-center gap-2 text-[11px] text-violet-400"><Server className="h-3 w-3 animate-spin" />Uploading...</div>}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a14]/60">
          <video src={video} className="aspect-video w-full object-cover" controls preload="metadata" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={() => onChange(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-rose-500/20 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function PoolCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    verticalId: "ledgerprop",
    trueCost: "",
    listedPrice: "",
    description: "",
    executionCostEstimate: "",
    ghostHallName: "",
    country: "",
    ihcpTarget: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [emojiSet, setEmojiSet] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<{ label: string; url: string }[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOptionInput[]>([]);
  const [showTrueCost, setShowTrueCost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const trueCost = Number(form.trueCost) || 0;
  const listedPrice = Number(form.listedPrice) || 0;
  const pir = listedPrice - trueCost;
  const ihcpTarget = Number(form.ihcpTarget) || 0;

  // PIR 6-pillar allocation
  const pirShield = pir > 0 ? Math.floor(pir * 0.25) : 0;
  const pirSeal = pir > 0 ? Math.floor(pir * 0.20) : 0;
  const pirForge = pir > 0 ? Math.floor(pir * 0.20) : 0;
  const pirSpire = pir > 0 ? Math.floor(pir * 0.15) : 0;
  const pirVanguard = pir > 0 ? Math.floor(pir * 0.12) : 0;
  const pirSanctuary = pir > 0 ? Math.floor(pir * 0.08) : 0;
  const executionCost = Number(form.executionCostEstimate) || 0;

  const selectedVertical = ALL_VERTICALS.find((v) => v.id === form.verticalId) || ALL_VERTICALS[0];
  const c = CMAP[selectedVertical.color];
  const needsLocation = APPLICABLE_VERTICALS.includes(form.verticalId);
  const hallClass = getHallClass(form.verticalId);

  const update = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setMessage("");
  }, []);

  const toggleEmoji = useCallback((emoji: string) => {
    setEmojiSet((prev) => {
      if (prev.includes(emoji)) return prev.filter((e) => e !== emoji);
      if (prev.length >= 5) return [...prev.slice(1), emoji];
      return [...prev, emoji];
    });
  }, []);

  const addExternalLink = useCallback(() => {
    setExternalLinks((prev) => [...prev, { label: "", url: "" }]);
  }, []);

  const updateExternalLink = useCallback((index: number, field: "label" | "url", value: string) => {
    setExternalLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }, []);

  const removeExternalLink = useCallback((index: number) => {
    setExternalLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addLocation = useCallback(() => {
    setLocationOptions((prev) => [
      ...prev,
      { name: "", address: "", lat: "", lng: "", cost: "", image: "", description: "" },
    ]);
  }, []);

  const updateLocation = useCallback((index: number, field: keyof LocationOptionInput, value: string) => {
    setLocationOptions((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }, []);

  const removeLocation = useCallback((index: number) => {
    setLocationOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.trueCost || !form.listedPrice) {
      setMessage("Name, true cost, and listed price are required");
      return;
    }
    if (trueCost <= 0) {
      setMessage("True cost must be greater than 0");
      return;
    }
    if (listedPrice <= trueCost) {
      setMessage("Listed price must exceed true cost (PIR must be positive)");
      return;
    }
    if (emojiSet.length !== 5) {
      setMessage(`Select exactly 5 emojis for this Hall. Currently: ${emojiSet.length}`);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const payloadLocationOptions = needsLocation
        ? locationOptions
            .filter((l) => l.name.trim())
            .map((l) => ({
              name: l.name.trim(),
              address: l.address.trim(),
              lat: l.lat ? Number(l.lat) : null,
              lng: l.lng ? Number(l.lng) : null,
              cost: l.cost ? Number(l.cost) : null,
              image: l.image.trim() || null,
              description: l.description.trim() || null,
            }))
        : [];

      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          verticalId: form.verticalId,
          trueCost,
          listedPrice,
          description: form.description,
          executionCostEstimate: executionCost,
          ghostHallName: form.ghostHallName || `${form.name} Hall`,
          country: form.country,
          images,
          video,
          emojiSet,
          externalLinks: externalLinks.filter((l) => l.label && l.url),
          locationOptions: payloadLocationOptions,
          hallClass,
          pirAllocation: {
            shield: pirShield,
            seal: pirSeal,
            forge: pirForge,
            spire: pirSpire,
            vanguard: pirVanguard,
            sanctuary: pirSanctuary,
          },
          ihcpTarget: ihcpTarget > 0 ? ihcpTarget : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Pool forged: ${data.pool.id}. Ghost Hall spawned.`);
        setTimeout(() => router.push("/admin"), 1500);
      } else {
        setMessage(data.error || "Pool creation failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Pool Forge 3.2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Forge a <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">Sovereign Asset</span>
          </h1>
          <p className="mt-1 max-w-lg text-sm text-slate-400">
            Architect sets listed price. True cost is hidden. PIR = listedPrice − trueCost. Protocol Infrastructure Reserve is allocated across 6 pillars the moment the pool fills.
          </p>
        </div>
        <Link href="/admin" className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Control
        </Link>
      </div>

      <div className="mx-auto max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* VERTICAL SELECTOR — ONLY LEDGERPROP ACTIVE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md">
            <h3 className="mb-5 text-sm font-semibold text-white flex items-center gap-2">
              <Diamond className="h-4 w-4 text-cyan-400" /> Select Vertical
            </h3>

            {/* Active Verticals */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">● Live</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
              {ACTIVE_VERTICALS.map((v) => {
                const VIcon = v.icon;
                const vc = CMAP[v.color];
                const isActive = form.verticalId === v.id;
                return (
                  <button key={v.id} type="button" onClick={() => { update("verticalId", v.id); setEmojiSet([]); }}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 ${
                      isActive ? `${vc.border} ${vc.bg} ${vc.glow} ring-1 ${vc.ring}` : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${vc.gradient} ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110`}>
                      <VIcon className={`h-4 w-4 ${isActive ? vc.text : "text-slate-500"}`} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-semibold ${isActive ? "text-white" : "text-slate-300"}`}>{v.name}</p>
                      <p className={`text-[9px] ${isActive ? "text-white/40" : "text-slate-600"}`}>{v.label}</p>
                    </div>
                    {isActive && <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></div>}
                  </button>
                );
              })}
            </div>

            {/* Inactive Verticals — Locked */}
            {INACTIVE_VERTICALS.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">🔒 Coming Soon</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 opacity-30">
                  {INACTIVE_VERTICALS.map((v) => {
                    const VIcon = v.icon;
                    const vc = CMAP[v.color];
                    return (
                      <div
                        key={v.id}
                        className="group relative flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center cursor-not-allowed"
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${vc.gradient} ring-1 ring-white/5 grayscale`}>
                          <VIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">{v.name}</p>
                          <p className="text-[9px] text-slate-600">{v.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>

          {/* EMOJI PICKER */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <Smile className="h-4 w-4 text-amber-400" /> Hall Emoji Set <span className="text-[10px] font-normal text-slate-500">(Pick exactly 5)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedVertical.emojis.map((emoji) => {
                const selected = emojiSet.includes(emoji);
                return (
                  <button key={emoji} type="button" onClick={() => toggleEmoji(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all duration-200 ${
                      selected ? "bg-amber-500/20 ring-1 ring-amber-500/40 scale-110" : "bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.06] hover:scale-105"
                    }`}
                  >{emoji}</button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-full ${i < emojiSet.length ? "bg-amber-400" : "bg-white/10"}`} />
                ))}
              </div>
              <span className="text-[10px] text-slate-500">{emojiSet.length}/5 selected</span>
            </div>
          </motion.div>

          {/* CORE DETAILS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" /> Asset Identity
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Pool Name</label>
              <div className="relative">
                <Diamond className="absolute left-3 top-3 h-4 w-4 text-white/20" />
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="e.g. Nairobi Solar Farm" />
              </div>
            </div>

            {/* TRUE COST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <EyeOff className="h-3 w-3" /> True Cost (USD) <span className="text-[9px] text-rose-500/60">— Hidden from public</span>
                </label>
                <button type="button" onClick={() => setShowTrueCost(!showTrueCost)} className="text-[10px] text-slate-500 hover:text-white transition-colors">
                  {showTrueCost ? <Eye className="h-3 w-3 inline" /> : <EyeOff className="h-3 w-3 inline" />} {showTrueCost ? "Visible" : "Masked"}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-rose-400/40">$</span>
                <input type={showTrueCost ? "number" : "password"} value={form.trueCost} onChange={(e) => update("trueCost", e.target.value)}
                  className="w-full rounded-xl border border-rose-500/20 bg-rose-500/[0.04] pl-7 pr-4 py-3 text-sm font-mono text-rose-300 outline-none transition-all focus:border-rose-500/40 focus:bg-rose-500/[0.06] focus:ring-1 focus:ring-rose-500/20"
                  placeholder="100000" />
              </div>
              <p className="text-[10px] text-rose-400/40">The actual acquisition cost. Never shown to committers.</p>
            </div>

            {/* LISTED PRICE */}
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Listed Price (USD) <span className="text-[9px] text-cyan-400/60">— Public facing</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-cyan-400/60">$</span>
                <input type="number" value={form.listedPrice} onChange={(e) => update("listedPrice", e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] pl-7 pr-4 py-3 text-sm font-bold text-cyan-300 outline-none transition-all focus:border-cyan-500/40 focus:bg-cyan-500/[0.06] focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="200000" />
              </div>
              <p className="text-[10px] text-cyan-400/40">What the community sees. Must exceed true cost.</p>
            </div>

            {/* PIR PREVIEW */}
            {pir > 0 && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-950/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60">Protocol Infrastructure Reserve</span>
                  <span className="text-lg font-bold text-amber-300">${pir.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Captured the moment pool fills. Allocated across 6 pillars internally.</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calculator className="h-3 w-3" /> Execution Cost Estimate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-white/30">$</span>
                  <input type="number" value={form.executionCostEstimate} onChange={(e) => update("executionCostEstimate", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-7 pr-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/30 focus:bg-white/[0.05]"
                    placeholder="50000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Ghost className="h-3 w-3" /> Ghost Hall Name
                </label>
                <input type="text" value={form.ghostHallName} onChange={(e) => update("ghostHallName", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/30 focus:bg-white/[0.05]"
                  placeholder="Auto-generated if empty" />
              </div>
            </div>

            {/* PHASE 4: IHCP TARGET */}
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <PiggyBank className="h-3 w-3" /> IHCP Target (USD) <span className="text-[9px] text-emerald-400/60">— Optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-emerald-400/60">$</span>
                <input type="number" value={form.ihcpTarget} onChange={(e) => update("ihcpTarget", e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] pl-7 pr-4 py-3 text-sm text-emerald-300 outline-none transition-all focus:border-emerald-500/40 focus:bg-emerald-500/[0.06] focus:ring-1 focus:ring-emerald-500/20"
                  placeholder="e.g. 15000" />
              </div>
              <p className="text-[10px] text-emerald-400/40">
                Recommended Internal Hall Contribution Pool target. Halls can vote to enable IHCP for payroll, inventory, upgrades, or emergencies. Repaid from revenue before dividends with 5% priority return.
              </p>
              {ihcpTarget > 0 && pir > 0 && (
                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">IHCP as % of PIR</span>
                    <span className="font-semibold text-emerald-300">
                      {Math.min(100, Math.round((ihcpTarget / pir) * 100))}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (ihcpTarget / pir) * 100)}%` }}
                    />
                  </div>
                  {ihcpTarget > pir * 0.5 && (
                    <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      IHCP exceeds 50% of PIR. Consider a lower target.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-white/20" />
                <input type="text" value={form.country} onChange={(e) => update("country", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05]"
                  placeholder="e.g. Kenya" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05] resize-none"
                placeholder="Describe the asset, ownership terms, and delivery details..." />
            </div>
          </motion.div>

          {/* EXTERNAL LINKS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Link2 className="h-4 w-4 text-sky-400" /> External Links
              </h3>
              <button type="button" onClick={addExternalLink} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all">
                <Sparkles className="h-3 w-3" /> Add Link
              </button>
            </div>
            {externalLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={link.label} onChange={(e) => updateExternalLink(i, "label", e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-sky-500/30" />
                <input type="url" value={link.url} onChange={(e) => updateExternalLink(i, "url", e.target.value)} placeholder="https://..." className="flex-[2] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-sky-500/30" />
                <button type="button" onClick={() => removeExternalLink(i)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {externalLinks.length === 0 && <p className="text-[10px] text-slate-600">No external links added yet.</p>}
          </motion.div>

          {/* LOCATION OPTIONS */}
          <AnimatePresence>
            {needsLocation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400" /> Location Options <span className="text-[10px] font-normal text-slate-500">(3 max)</span>
                    </h3>
                    <button type="button" onClick={addLocation} disabled={locationOptions.length >= 3} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all disabled:opacity-30">
                      <MapPin className="h-3 w-3" /> Add Location
                    </button>
                  </div>
                  {locationOptions.map((loc, i) => (
                    <div key={i} className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">Option {i + 1}</span>
                        <button type="button" onClick={() => removeLocation(i)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"><X className="h-3 w-3" /></button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Name</label>
                          <input type="text" value={loc.name} onChange={(e) => updateLocation(i, "name", e.target.value)} placeholder="e.g. Kajiado County" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Address</label>
                          <input type="text" value={loc.address} onChange={(e) => updateLocation(i, "address", e.target.value)} placeholder="Full street address" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Latitude</label>
                          <input type="number" step="any" value={loc.lat} onChange={(e) => updateLocation(i, "lat", e.target.value)} placeholder="-1.2921" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Longitude</label>
                          <input type="number" step="any" value={loc.lng} onChange={(e) => updateLocation(i, "lng", e.target.value)} placeholder="36.8219" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Cost Estimate ($)</label>
                          <input type="number" value={loc.cost} onChange={(e) => updateLocation(i, "cost", e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500">Image URL</label>
                          <input type="url" value={loc.image} onChange={(e) => updateLocation(i, "image", e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-slate-500">Description / Data</label>
                        <textarea value={loc.description} onChange={(e) => updateLocation(i, "description", e.target.value)} placeholder="Soil report, sun hours, traffic count, zoning info..." rows={2} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30 resize-none" />
                      </div>
                    </div>
                  ))}
                  {locationOptions.length === 0 && <p className="text-[10px] text-slate-600">Add up to 3 location options for community vote.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MEDIA VAULT */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-400" /> Media Vault
              </h3>
              <span className="text-[10px] text-slate-500">{images.length} images • {video ? "1 video" : "0 video"}</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Asset Gallery</label>
                <ImageUploadZone images={images} onChange={setImages} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Showcase Video</label>
                <VideoUploadZone video={video} onChange={setVideo} />
              </div>
            </div>
          </motion.div>

          {/* PIR ALLOCATION */}
          {pir > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-[#0a0a14]/60 to-transparent p-6 backdrop-blur-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/80 flex items-center gap-2">
                <Percent className="h-3.5 w-3.5" /> PIR Allocation Preview
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-rose-500/10 bg-rose-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">True Cost</p>
                  <p className="mt-1 text-sm font-bold text-rose-300">${trueCost.toLocaleString()}</p>
                  <p className="text-[9px] text-rose-400/40">Hidden</p>
                </div>
                <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">Listed Price</p>
                  <p className="mt-1 text-sm font-bold text-cyan-300">${listedPrice.toLocaleString()}</p>
                  <p className="text-[9px] text-cyan-400/40">Public</p>
                </div>
                <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">PIR Total</p>
                  <p className="mt-1 text-sm font-bold text-amber-300">${pir.toLocaleString()}</p>
                  <p className="text-[9px] text-amber-400/40">Protocol Infrastructure</p>
                </div>
                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">Hall Class</p>
                  <p className="mt-1 text-sm font-bold text-emerald-300">{HALL_CLASS_LABEL[hallClass]}</p>
                  <p className="text-[9px] text-emerald-400/40">Auto-assigned</p>
                </div>
              </div>

              {/* 6 Pillars */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-red-500/10 bg-red-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Shield (25%)</p>
                  <p className="mt-1 text-sm font-bold text-red-300">${pirShield.toLocaleString()}</p>
                  <p className="text-[9px] text-red-400/40">Insurance & casualty</p>
                </div>
                <div className="rounded-lg border border-blue-500/10 bg-blue-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Seal (20%)</p>
                  <p className="mt-1 text-sm font-bold text-blue-300">${pirSeal.toLocaleString()}</p>
                  <p className="text-[9px] text-blue-400/40">Legal & SPV</p>
                </div>
                <div className="rounded-lg border border-orange-500/10 bg-orange-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Forge (20%)</p>
                  <p className="mt-1 text-sm font-bold text-orange-300">${pirForge.toLocaleString()}</p>
                  <p className="text-[9px] text-orange-400/40">Maintenance & payroll</p>
                </div>
                <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Spire (15%)</p>
                  <p className="mt-1 text-sm font-bold text-violet-300">${pirSpire.toLocaleString()}</p>
                  <p className="text-[9px] text-violet-400/40">Protocol & infra</p>
                </div>
                <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Vanguard (12%)</p>
                  <p className="mt-1 text-sm font-bold text-indigo-300">${pirVanguard.toLocaleString()}</p>
                  <p className="text-[9px] text-indigo-400/40">R&D & expansion</p>
                </div>
                <div className="rounded-lg border border-pink-500/10 bg-pink-500/[0.04] p-3">
                  <p className="text-[9px] uppercase text-slate-500">The Sanctuary (8%)</p>
                  <p className="mt-1 text-sm font-bold text-pink-300">${pirSanctuary.toLocaleString()}</p>
                  <p className="text-[9px] text-pink-400/40">Vacancy & smoothing</p>
                </div>
              </div>

              {/* PHASE 4: IHCP Preview in PIR section */}
              {ihcpTarget > 0 && (
                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase text-slate-500">IHCP Target</p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">${ihcpTarget.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-slate-500">Priority Return</p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">5%</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-emerald-400/40 mt-1">
                    Internal Hall Contribution Pool. Hall votes to enable. Repaid from revenue before dividends.
                  </p>
                </div>
              )}

              {executionCost > 0 && (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase text-slate-500">Execution Cost Estimate</span>
                    <span className="text-sm font-bold text-white">${executionCost.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500">Hall must approve via proposal before 8th Ledger executes.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* GHOST HALL PREVIEW */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-violet-400/80 flex items-center gap-2">
              <Ghost className="h-3.5 w-3.5" /> Ghost Hall Preview
            </h3>
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-violet-950/20 via-[#0a0a14]/60 to-transparent p-5">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${c.bg} blur-[40px] opacity-30`} />
              <div className="relative flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${c.gradient} ring-1 ring-white/5`}>
                  <Landmark className={`h-5 w-5 ${c.text}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{form.ghostHallName || `${form.name || "Untitled"} Hall`}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${c.bg} ${c.text}`}>
                      <Landmark className="h-3 w-3" /> {selectedVertical.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400/60"><Percent className="h-3 w-3" /> {HALL_CLASS_LABEL[hallClass]}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-violet-400/60"><Ghost className="h-3 w-3" /> Ghost (invisible)</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {emojiSet.map((e, i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg ring-1 ring-white/5">{e}</span>
                ))}
                {emojiSet.length === 0 && <span className="text-[10px] text-slate-600 italic">No emojis selected</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-slate-500">Status</p>
                  <p className="mt-0.5 font-semibold text-violet-300">Ghost</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-slate-500">Unlocks At</p>
                  <p className="mt-0.5 font-semibold text-emerald-300">100% Fill</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-slate-500">Visibility</p>
                  <p className="mt-0.5 font-semibold text-rose-300">Committers Only</p>
                </div>
              </div>
              {ihcpTarget > 0 && (
                <div className="mt-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 p-2">
                  <p className="text-[9px] text-emerald-400/60 flex items-center gap-1">
                    <PiggyBank className="h-3 w-3" /> IHCP Target: ${ihcpTarget.toLocaleString()} — Hall can vote to enable
                  </p>
                </div>
              )}
              {externalLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {externalLinks.filter((l) => l.label).map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-[9px] text-sky-400 ring-1 ring-sky-500/20">
                      <Link2 className="h-3 w-3" /> {l.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* PUBLIC PREVIEW */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-400/80 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> Public Preview
            </h3>
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-4">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${c.bg} blur-[40px] opacity-40`} />
              <div className="relative flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 rounded-md ${c.bg} px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
                  <Landmark className="h-3 w-3" /> {selectedVertical.name}
                </div>
                {images.length > 0 ? (
                  <div className="flex -space-x-2">
                    {images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="" className="h-8 w-8 rounded-lg object-cover ring-2 ring-[#0a0a14]" />
                    ))}
                    {images.length > 3 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-2 ring-[#0a0a14] text-[10px] font-bold text-white">+{images.length - 3}</div>
                    )}
                  </div>
                ) : <ImageIcon className="h-8 w-8 text-white/10" />}
              </div>
              <h4 className="relative text-sm font-bold text-white truncate">{form.name || "Untitled Pool"}</h4>
              <p className="relative mt-1 text-[10px] text-white/30 line-clamp-2">{form.description || "No description provided."}</p>
              <div className="relative mt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-slate-500">Listed Price</p>
                  <p className="mt-0.5 font-semibold text-cyan-400">${listedPrice > 0 ? listedPrice.toLocaleString() : "—"}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-slate-500">Vertical</p>
                  <p className="mt-0.5 font-semibold text-white">{selectedVertical.label}</p>
                </div>
              </div>
              {video && (
                <div className="relative mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
                  <Play className="h-3 w-3 text-violet-400" />
                  <span className="text-[10px] text-slate-400">Showcase video attached</span>
                  <span className="ml-auto text-[9px] text-slate-600">MP4</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* SUBMIT */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4">
            <button type="submit" disabled={submitting}
              className="group relative flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.4)] hover:border-cyan-500/30 disabled:opacity-50"
            >
              {submitting ? (
                <><Server className="h-4 w-4 animate-spin" /> Broadcasting to Protocol...</>
              ) : (
                <><Zap className="h-4 w-4 transition-transform group-hover:scale-110" /> Initiate Forge Sequence <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
            {message && (
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                message.includes("forged") || message.includes("Pool") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"
              }`}>
                {message.includes("forged") || message.includes("Pool") ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {message}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}