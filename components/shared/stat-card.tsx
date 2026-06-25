"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
  className?: string;
}

export function StatCard({ label, value, subtext, icon: Icon, color, delay = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("rounded-xl border border-white/5 bg-[#0a0a14] p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
          <p className={cn("mt-1 font-space text-xl font-bold", color)}>{value}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{subtext}</p>
        </div>
        <div className={cn("rounded-lg bg-white/5 p-2", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}