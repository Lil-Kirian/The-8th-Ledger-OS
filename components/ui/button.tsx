import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "amber" | "cyan";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 hover:shadow-cyan-500/40 focus:ring-2 focus:ring-cyan-500/30",
  secondary: "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
  outline: "border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50",
  ghost: "bg-transparent text-white/50 hover:bg-white/5 hover:text-white/80",
  danger: "bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500 hover:shadow-red-500/40",
  amber: "bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-500 hover:shadow-amber-500/40",
  cyan: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 hover:shadow-cyan-500/50",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-4 text-sm rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none outline-none",
          variantMap[variant],
          sizeMap[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";