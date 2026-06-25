"use client";

import { cn } from "@/lib/utils";

const classConfig: Record<string, { label: string; color: string }> = {
  I: { label: "Class I", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  II: { label: "Class II", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
  III: { label: "Class III", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
};

interface PoolHallClassBadgeProps {
  hallClass?: string | null;
  className?: string;
}

export function PoolHallClassBadge({ hallClass, className }: PoolHallClassBadgeProps) {
  if (!hallClass) return null;

  const config = classConfig[hallClass] || {
    label: `Class ${hallClass}`,
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