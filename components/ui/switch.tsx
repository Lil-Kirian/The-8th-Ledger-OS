"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-white/10 bg-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-cyan-500",
        className,
      )}
    >
      <span
        data-state={checked ? "checked" : "unchecked"}
        className="pointer-events-none block h-5 w-5 translate-x-0.5 translate-y-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-5"
      />
    </button>
  );
}
