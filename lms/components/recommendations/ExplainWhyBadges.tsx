import { Award, Building2, Clock, ClipboardList, MapPin, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function iconFor(reason: string): LucideIcon {
  const r = reason.toLowerCase();
  if (r.includes("gap")) return Target;
  if (r.includes("scored")) return ClipboardList;
  if (r.includes("posting")) return MapPin;
  if (r.includes("department")) return Building2;
  if (r.includes("wmo")) return Award;
  if (r.includes("awaiting") || r.includes("requested")) return Clock;
  return Sparkles;
}

/** The "Explain Why" transparency chips shown on each recommendation. */
export function ExplainWhyBadges({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((reason, i) => {
        const Icon = iconFor(reason);
        return (
          <li
            key={i}
            className="flex items-start gap-2 rounded-[10px] bg-plum-50 px-2.5 py-1.5 text-xs text-ink-700"
          >
            <Icon className="mt-0.5 size-3.5 shrink-0 text-plum-600" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        );
      })}
    </ul>
  );
}
