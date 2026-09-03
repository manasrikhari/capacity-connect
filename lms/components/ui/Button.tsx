import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-plum-600 text-paper hover:bg-plum-700 disabled:bg-plum-300",
  secondary:
    "bg-paper border border-hair text-plum-700 hover:bg-plum-50 disabled:text-plum-300",
  outline:
    "bg-transparent border border-hair-strong text-ink-700 hover:bg-paper disabled:text-ink-300",
  danger:
    "bg-status-unpaid/10 text-status-unpaid border border-status-unpaid/25 hover:bg-status-unpaid/15 disabled:opacity-50",
  ghost: "bg-transparent text-ink-500 hover:bg-plum-50 hover:text-ink-900 disabled:text-ink-300",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-[10px] font-medium " +
  "transition-[background-color,border-color,color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] " +
  "active:scale-[0.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed";

/** Shared classes for non-<button> elements (e.g. <Link>) styled like a button. */
export function buttonClasses(
  variant: keyof typeof VARIANT_CLASSES = "primary",
  size: keyof typeof SIZE_CLASSES = "md",
  className?: string
) {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
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
        BASE_CLASSES,
        "cursor-pointer",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
