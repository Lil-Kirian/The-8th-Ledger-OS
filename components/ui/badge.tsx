import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "amber" | "violet";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-slate-400",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  error: "bg-red-500/10 text-red-400",
  info: "bg-indigo-500/10 text-indigo-300",
  amber: "bg-amber-500/10 text-amber-300",
  violet: "bg-violet-500/10 text-violet-300",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", variantMap[variant], className)}>
      {children}
    </span>
  );
}