"use client";

import React, { useState } from "react";
import {

  CheckCircle2,
  BarChart3,
  Globe,
  Sprout,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Truck,
  Users,
  TrendingUp,
  AlertTriangle,
  Crown,
  Zap,
  Navigation,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationOption {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  image?: string;
  data: {
    soilQuality?: number; // 0-100
    sunHours?: number; // daily average
    trafficCount?: number; // daily
    rainfall?: number; // mm/year
    windSpeed?: number; // km/h average
    temperature?: number; // celsius average
    landCost?: number; // per acre/sqft
    proximity?: string; // distance to nearest city/port
    infrastructure?: string; // road, power, water
    zoning?: string; // commercial, agricultural, etc
  };
  votes: number;
  votePercent: number;
}

interface LocationVoterProps {
  hallId: string;
  hallName: string;
  vertical: "agrivin" | "bizvin" | "accessvin" | "travelvin" | "energyvin";
  options: LocationOption[];
  userVinculumId: string;
  userVoted?: string | null;
  totalVoters: number;
  quorumRequired: number;
  status: "voting" | "closed" | "selected";
  onVote?: (optionId: string) => void;
  isAdmin?: boolean;
}

const verticalConfig = {
  agrivin: { icon: Sprout, color: "text-green-400", bg: "bg-green-900/20", label: "AgriVin" },
  bizvin: { icon: Truck, color: "text-orange-400", bg: "bg-orange-900/20", label: "BizVin" },
  accessvin: { icon: Zap, color: "text-cyan-400", bg: "bg-cyan-900/20", label: "AccessVin" },
  travelvin: { icon: Navigation, color: "text-indigo-400", bg: "bg-indigo-900/20", label: "TravelVin" },
  energyvin: { icon: Sun, color: "text-yellow-400", bg: "bg-yellow-900/20", label: "EnergyVin" },
};

const dataLabels: Record<string, { label: string; unit: string; icon: React.ElementType; color: string }> = {
  soilQuality: { label: "Soil Quality", unit: "/100", icon: Sprout, color: "text-green-400" },
  sunHours: { label: "Sun Hours", unit: "h/day", icon: Sun, color: "text-amber-400" },
  trafficCount: { label: "Traffic", unit: "/day", icon: Truck, color: "text-blue-400" },
  rainfall: { label: "Rainfall", unit: "mm/yr", icon: Droplets, color: "text-cyan-400" },
  windSpeed: { label: "Wind", unit: "km/h", icon: Wind, color: "text-slate-400" },
  temperature: { label: "Temp", unit: "°C", icon: Thermometer, color: "text-red-400" },
  landCost: { label: "Land Cost", unit: "", icon: TrendingUp, color: "text-emerald-400" },
};

export default function LocationVoter({
  hallId,
  hallName,
  vertical,
  options,
  userVinculumId,
  userVoted,
  totalVoters,
  quorumRequired,
  status,
  onVote,
  isAdmin,
}: LocationVoterProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(userVoted || null);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const vConfig = verticalConfig[vertical];
  const VerticalIcon = vConfig.icon;

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  const leadingOption = options.reduce((max, o) => (o.votes > max.votes ? o : max), options[0]);

  const handleVote = (optionId: string) => {
    if (status !== "voting") return;
    setSelectedOption(optionId);
    onVote?.(optionId);
  };

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", vConfig.bg, "border-slate-700/30")}>
            <VerticalIcon size={18} className={vConfig.color} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Location Selection</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{hallName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1",
            status === "voting" ? "bg-blue-900/20 text-blue-400 border-blue-700/30" :
            status === "selected" ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30" :
            "bg-slate-800/40 text-slate-400 border-slate-700/40"
          )}>
            {status === "voting" ? <Zap size={10} className="animate-pulse" /> : <CheckCircle2 size={10} />}
            {status === "voting" ? "Voting Open" : status === "selected" ? "Location Selected" : "Closed"}
          </div>
          {isAdmin && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/20 border border-amber-800/20 text-[10px] text-amber-400 font-bold">
              <Crown size={10} className="inline mr-1" />
              Admin
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Map Placeholder */}
        {showMap && (
          <div className="relative aspect-[16/9] rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Globe size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Interactive Map</p>
                <p className="text-xs text-slate-700 mt-1">3 location pins loaded</p>
              </div>
            </div>
            {/* Pin markers */}
            {options.map((opt, i) => (
              <div
                key={opt.id}
                className={cn(
                  "absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg",
                  selectedOption === opt.id
                    ? "bg-emerald-600 border-emerald-400 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-400"
                )}
                style={{ left: `${20 + i * 30}%`, top: `${30 + (i % 2) * 25}%` }}
              >
                {i + 1}
              </div>
            ))}
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Vote Tally */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <BarChart3 size={10} />
              Live Tally
            </span>
            <span className="font-mono">
              {totalVotes} votes • {quorumRequired}% required
            </span>
          </div>
          <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden flex">
            {options.map((opt) => (
              <div
                key={opt.id}
                className={cn(
                  "h-full transition-all duration-700",
                  opt.id === leadingOption.id ? "bg-emerald-500/60" : "bg-slate-600/40"
                )}
                style={{ width: `${opt.votePercent}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            {options.map((opt, i) => (
              <span key={opt.id} className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", opt.id === leadingOption.id ? "bg-emerald-500" : "bg-slate-600")} />
                Option {i + 1}: {opt.votePercent.toFixed(1)}%
              </span>
            ))}
          </div>
        </div>

        {/* Location Cards */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const isExpanded = expandedOption === option.id;
            const isSelected = selectedOption === option.id;
            const isLeading = option.id === leadingOption.id;
            const hasVoted = userVoted === option.id;

            return (
              <div
                key={option.id}
                className={cn(
                  "rounded-xl border overflow-hidden transition-all",
                  isSelected
                    ? "bg-emerald-950/10 border-emerald-800/30"
                    : isLeading
                    ? "bg-amber-950/5 border-amber-800/20"
                    : "bg-slate-800/10 border-slate-800/20"
                )}
              >
                {/* Card Header */}
                <div className="p-4 flex items-start gap-4">
                  {/* Number Badge */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0",
                    isSelected ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400" :
                    isLeading ? "bg-amber-900/20 border-amber-700/30 text-amber-400" :
                    "bg-slate-800/40 border-slate-700/30 text-slate-500"
                  )}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-100">{option.name}</h4>
                      {isLeading && status === "voting" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-900/20 text-amber-400 border border-amber-700/30">
                          Leading
                        </span>
                      )}
                      {hasVoted && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-900/20 text-emerald-400 border border-emerald-700/30">
                          Your Vote
                        </span>
                      )}
                      {status === "selected" && isLeading && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-900/20 text-emerald-400 border border-emerald-700/30">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {option.coordinates.lat.toFixed(4)}, {option.coordinates.lng.toFixed(4)}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Users size={12} />
                        <span>{option.votes} votes</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <BarChart3 size={12} />
                        <span className="font-mono">{option.votePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Vote Button */}
                  {status === "voting" && (
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={hasVoted}
                      className={cn(
                        "shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                        hasVoted
                          ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400 cursor-default"
                          : "bg-slate-800/30 border-slate-700/30 text-slate-300 hover:bg-emerald-900/20 hover:border-emerald-700/30 hover:text-emerald-300"
                      )}
                    >
                      {hasVoted ? <CheckCircle2 size={14} className="inline mr-1" /> : null}
                      {hasVoted ? "Voted" : "Vote"}
                    </button>
                  )}

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedOption(isExpanded ? null : option.id)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded Data */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2">
                    {/* Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(option.data).map(([key, value]) => {
                        if (value === undefined) return null;
                        const dl = dataLabels[key];
                        if (!dl) return null;
                        const DIcon = dl.icon;

                        return (
                          <div key={key} className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <DIcon size={12} className={dl.color} />
                              <span className="text-[10px] text-slate-500 uppercase">{dl.label}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-200 font-mono">
                              {typeof value === "number" ? value.toLocaleString() : value}
                              <span className="text-[10px] text-slate-600 ml-0.5">{dl.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Image */}
                    {option.image && (
                      <div className="aspect-video rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
                        <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Proximity & Infrastructure */}
                    {(option.data.proximity || option.data.infrastructure || option.data.zoning) && (
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 space-y-2">
                        {option.data.proximity && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Proximity</span>
                            <span className="text-slate-300">{option.data.proximity}</span>
                          </div>
                        )}
                        {option.data.infrastructure && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Infrastructure</span>
                            <span className="text-slate-300">{option.data.infrastructure}</span>
                          </div>
                        )}
                        {option.data.zoning && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Zoning</span>
                            <span className="text-slate-300">{option.data.zoning}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quorum Info */}
        <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300">51% capital-weighted required.</span> Location selection needs majority approval. VIN provides 3 vetted options. The community picks one. Cannot be changed after selection without a new proposal.
          </div>
        </div>
      </div>
    </div>
  );
}
