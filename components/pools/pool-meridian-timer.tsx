"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Globe } from "lucide-react";

interface PoolMeridianTimerProps {
  phase: string;
  endAt: Date;
  continent: string;
}

const phaseLabels: Record<string, { label: string; color: string; desc: string }> = {
  hush: { label: "The Hush", color: "text-purple-400", desc: "Anticipation builds. Pools hidden." },
  unveil: { label: "The Unveil", color: "text-blue-400", desc: "Blurred cards. Location hints only." },
  reveal: { label: "The Reveal", color: "text-cyan-400", desc: "Full data revealed. Vote now." },
  forge: { label: "The Forge", color: "text-amber-400", desc: "Winner forged. Commitment opens." },
  complete: { label: "Complete", color: "text-emerald-400", desc: "Cycle complete." },
};

export function PoolMeridianTimer({ phase, endAt, continent }: PoolMeridianTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  const config = phaseLabels[phase] || { label: phase, color: "text-white", desc: "" };

  return (
    <Card className="p-4 border-white/5 bg-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-white/5">
            <Globe className={`h-4 w-4 ${config.color}`} />
          </div>
          <div>
            <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
            <p className="text-[10px] text-white/20">
              {continent} — {config.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-white/20" />
          <span className="text-xs font-mono text-white/40">
            {String(timeLeft.days).padStart(2, "0")}:{String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
    </Card>
  );
}