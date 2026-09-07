/**
 * The Ashoka tricolour, rendered as a 3px hairline band.
 *
 * This is a *national-identity* element, not part of the OpenGrapes interaction
 * palette — the same category as the State Emblem masthead in `GovBanner`. It is
 * the single most legible "Government of India" cue, so it sits at the very top
 * of every page, above all other chrome, and stays deliberately thin so the calm
 * plum-paper system underneath is nudged toward the government register rather
 * than replaced by it.
 *
 * Purely decorative: `aria-hidden` keeps it out of the accessibility tree, and
 * the flag colours are the official India saffron / white / India green. These
 * are the one sanctioned exception to the "no bare white, tokens only" rule in
 * DESIGN.md, mirrored from the `--tiranga-*` tokens in `opengrapes.css`.
 */
export function TricolorBand() {
  return (
    <div aria-hidden="true" className="flex h-[3px] w-full shrink-0">
      <span className="h-full flex-1" style={{ background: "var(--tiranga-saffron)" }} />
      <span className="h-full flex-1" style={{ background: "var(--tiranga-white)" }} />
      <span className="h-full flex-1" style={{ background: "var(--tiranga-green)" }} />
    </div>
  );
}
