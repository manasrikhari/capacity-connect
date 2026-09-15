"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * A 5-star rating built from real radio inputs (so it submits with the form and
 * is keyboard accessible — arrow keys move within the group, Tab reaches it).
 * The inputs are visually hidden; a lucide Star renders each option, filled
 * plum when selected/hovered and a hairline otherwise.
 */
export function StarRating({
  name,
  label,
  defaultValue = 0,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  required?: boolean;
}) {
  const groupId = useId();
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset>
      <legend className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink-700">
        <span>{label}</span>
        {!required && <span className="text-xs font-normal text-ink-300">optional</span>}
      </legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {STARS.map((n) => {
          const active = shown >= n;
          const id = `${groupId}-${n}`;
          return (
            <label key={n} htmlFor={id} className="cursor-pointer" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
              <input
                id={id}
                type="radio"
                name={name}
                value={n}
                required={required}
                checked={value === n}
                onChange={() => setValue(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-6 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-plum-100 rounded-sm",
                  active ? "fill-plum-600 text-plum-600" : "fill-transparent text-hair-strong",
                )}
              />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
