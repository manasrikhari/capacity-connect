const css = String.raw;
export const ctaStyles = css`
  /* ---- Closing CTA ---- */
  .cta-band { background: var(--ink-900); border-radius: var(--radius-xl); padding: 72px 56px; text-align: center;
    position: relative; overflow: hidden; }
  .cta-band::before { content:""; position: absolute; inset: 0; opacity: .5;
    background: radial-gradient(680px 320px at 20% -10%, rgba(131,107,166,.45), transparent 60%),
                radial-gradient(620px 320px at 85% 120%, rgba(110,148,97,.42), transparent 60%); }
  .cta-band > * { position: relative; }
  .cta-band .eyebrow { color: var(--plum-300); }
  .cta-band h2 { color: var(--cream-50); font-size: clamp(34px, 4vw, 56px); font-weight: 400; letter-spacing: -0.02em; margin: 14px auto 0; max-width: 16ch; }
  .cta-band h2 em { font-style: italic; font-weight: 300; color: var(--sage-300); }
  .cta-band p { color: #cfc9bb; font-size: 17px; margin: 18px auto 0; max-width: 44ch; line-height: 1.6; }
  .cta-band .hero-cta { justify-content: center; margin-top: 32px; }
  .btn-cream { background: var(--cream-50); color: var(--ink-900); }
  .btn-cream:hover { filter: brightness(0.97); }
  .btn-line { background: transparent; color: var(--cream-100); border-color: rgba(247,243,233,.28); }
  .btn-line:hover { background: rgba(247,243,233,.08); }
`;
