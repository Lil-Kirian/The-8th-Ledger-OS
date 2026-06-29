"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percent = Math.min(100, Math.max(0, ((value || 0) / max) * 100));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
          className,
        )}
        {...props}
      >
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
