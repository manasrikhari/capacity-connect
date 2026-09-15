import { Info } from "lucide-react";

/** A calm, one-line explanation of why a certificate can't be issued yet. */
export function EligibilityHint({ reason }: { reason: string }) {
  return (
    <p className="inline-flex items-start gap-1.5 rounded-[10px] bg-sunken/50 px-2.5 py-1.5 text-left text-xs text-ink-500">
      <Info aria-hidden="true" className="mt-px size-3.5 shrink-0 text-ink-300" />
      <span>{reason}</span>
    </p>
  );
}
