"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const context = React.useContext(DropdownContext);
  if (!context) return children;

  const props = {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      context.setOpen(!context.open);
    },
  };

  return asChild ? (
    React.cloneElement(children, props)
  ) : (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DropdownContext);
  if (!context?.open) return null;

  return (
    <div
      className={cn(
        "absolute right-0 z-50 mt-2 min-w-44 rounded-md border border-white/10 bg-slate-900 p-1 shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  disabled,
  onClick,
  children,
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DropdownContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        context?.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center rounded px-2 py-2 text-left text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />;
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
