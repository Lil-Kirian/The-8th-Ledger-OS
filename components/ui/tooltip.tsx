"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({
  children,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const ctx = useContext(TooltipContext);
  if (!ctx) return children;

  const props = {
    onMouseEnter: () => ctx.setOpen(true),
    onMouseLeave: () => ctx.setOpen(false),
    onFocus: () => ctx.setOpen(true),
    onBlur: () => ctx.setOpen(false),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }

  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function TooltipContent({
  children,
  className,
  side = "top",
}: {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const ctx = useContext(TooltipContext);
  if (!ctx?.open) return null;

  const sideClass = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
  }[side];

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute z-50 min-w-max rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 shadow-xl",
        sideClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
