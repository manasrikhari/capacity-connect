"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function format(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

export function JoinCodeInput({ className, defaultValue, ...props }: Props) {
  const [value, setValue] = useState(() =>
    defaultValue ? format(String(defaultValue)) : ""
  );

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(format(e.target.value))}
      maxLength={9}
      className={cn(fieldClasses, className)}
    />
  );
}
