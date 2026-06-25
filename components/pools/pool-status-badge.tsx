"use client";

import { cn } from "@/lib/utils";

type PoolStatus = "filling" | "filled" | "forged" | "active" | "dormant" | "sold" | "dissolved";

const statusConfig: Record<PoolStatus, { label: string; color: string }> = {
  filling: { label: "Filling", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
  filled: { label: "Filled", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" },
  forged: { label: "Forged", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  active: { label: "Active", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  dormant: { label: "Dormant", color: "border-white/10 text-white/40 bg-white/5" },
  sold: { label: "Sold", color: "border-white/10 text-white/40 bg-white/5" },
  dissolved: { label: "Dissolved", color: "border-red-500/30 text-red-400 bg-red-500/10" },
};

interface PoolStatusBadgeProps {
  status: string;
  className?: string;
}

export function PoolStatusBadge({ status, className }: PoolStatusBadgeProps) {
  const config = statusConfig[status as PoolStatus] || {
    label: status,
    color: "border-white/10 text-white/40 bg-white/5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}