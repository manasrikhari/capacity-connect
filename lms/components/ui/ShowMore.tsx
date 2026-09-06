import { ChevronRight } from "lucide-react";

/**
 * A "show N more" disclosure for the tail of a long list.
 *
 * Native `<details>`, so it needs no client JavaScript, keeps keyboard and
 * screen-reader behaviour, and — because each one is its own element — opening
 * a card never affects a sibling.
 */
export function ShowMore({
  count,
  children,
  className,
}: {
  /** How many rows are hidden, for the label. */
  count: number;
  children: React.ReactNode;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <details className={`group/fold ${className ?? ""}`}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 border-t border-hair py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-ink-900 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition-transform group-open/fold:rotate-90" />
        <span className="group-open/fold:hidden">Show {count} more</span>
        <span className="hidden group-open/fold:inline">Show fewer</span>
      </summary>
      {children}
    </details>
  );
}
