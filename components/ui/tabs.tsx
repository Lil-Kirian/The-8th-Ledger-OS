"use client";

import React, { createContext, useContext, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

type SegmentedTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
};

type CompoundTabsProps = {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

const TabsContext = createContext<{
  value: string;
  setValue: (value: string) => void;
} | null>(null);

function isSegmentedTabsProps(
  props: SegmentedTabsProps | CompoundTabsProps,
): props is SegmentedTabsProps {
  return "tabs" in props;
}

export function Tabs(props: SegmentedTabsProps | CompoundTabsProps) {
  if (isSegmentedTabsProps(props)) {
    const { tabs, activeTab, onChange, className } = props;
    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1",
          className,
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-white/10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "relative z-10 rounded-md px-1.5 py-0.5 text-[9px]",
                  activeTab === tab.id
                    ? "bg-white/10 text-slate-300"
                    : "bg-white/5 text-slate-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  const {
    children,
    value,
    defaultValue = "",
    onValueChange,
    className,
  } = props;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = (nextValue: string) => {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-white/[0.03] p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      type="button"
      data-state={active ? "active" : "inactive"}
      onClick={() => context?.setValue(value)}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
