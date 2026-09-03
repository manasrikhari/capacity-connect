"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldClasses } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

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
      aria-label="Join code"
      {...props}
      value={value}
      onChange={(e) => setValue(format(e.target.value))}
      maxLength={9}
      className={cn(fieldClasses, "font-mono", className)}
    />
  );
}
