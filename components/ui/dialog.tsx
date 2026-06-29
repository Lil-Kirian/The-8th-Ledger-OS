"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-6 shadow-xl",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => context.onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5 pr-8", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}
