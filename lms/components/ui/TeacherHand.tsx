import { cn } from "@/lib/utils";

/* Caveat only covers Latin scripts (plus Latin Extended and diacritics).
   Any letter outside those ranges (Devanagari, Tamil, Arabic, CJK, ...)
   would fall through to an unstyled fallback, so the whole string drops to
   the body face instead of rendering half-hand, half-system. */
function isLatinScript(text: string): boolean {
  const letters = text.match(/\p{L}/gu);
  if (!letters) return true;
  // Latin + Latin-1/Extended (U+0000-U+024F) and Latin Extended Additional
  // (U+1E00-U+1EFF); anything else is a non-Latin script.
  return letters.every((ch) => {
    const cp = ch.codePointAt(0) ?? 0;
    return cp <= 0x024f || (cp >= 0x1e00 && cp <= 0x1eff);
  });
}

/** Teacher-authored text (notices, feedback) in the teacher's hand.
    Never use for system or AI copy — the hand face means a person wrote it. */
export function TeacherHand({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  if (!isLatinScript(children)) {
    return <span className={cn("font-sans text-[15px] text-ink-700", className)}>{children}</span>;
  }

  return (
    <span
      className={cn(
        "inline-block font-hand text-[19px] font-semibold leading-[1.3] text-plum-700",
        className
      )}
      style={{ transform: "rotate(-0.6deg)", transformOrigin: "left center" }}
    >
      {children}
    </span>
  );
}
