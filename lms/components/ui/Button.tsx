import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200 disabled:bg-violet-300",
  secondary:
    "bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 disabled:text-violet-300",
  outline:
    "bg-transparent text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:text-slate-300",
  danger:
    "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:text-red-300",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2",
};

/** Shared classes for non-<button> elements (e.g. <Link>) styled like a button. */
export function buttonClasses(
  variant: keyof typeof VARIANT_CLASSES = "primary",
  size: keyof typeof SIZE_CLASSES = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
