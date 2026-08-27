const css = String.raw;
export const animationStyles = css`
  /* ---- Reveal animation ----
     Base = visible (so it always renders, even with no JS / no support).
     â¢ Modern browsers: each element's entrance is SCROLL-LINKED via animation-timeline:view()
       â it transitions in progressively as it travels up into the viewport (see @supports below).
     â¢ Fallback browsers: JS arms below-fold elements with .pending, then swaps to .in. */
  .reveal { opacity: 1; transform: none; }
  .reveal.pending { opacity: 0; transform: translateY(22px); }
  .reveal.in { animation: revealUp .7s var(--ease-out) both; }
  .reveal.in.d1 { animation-delay: .08s; } .reveal.in.d2 { animation-delay: .16s; }
  .reveal.in.d3 { animation-delay: .24s; } .reveal.in.d4 { animation-delay: .32s; }
  @keyframes revealUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .reveal, .reveal.pending, .reveal.in { opacity: 1 !important; transform: none !important; animation: none !important; }
  }

  /* ---- Directional / zoom reveal variants ---- */
  .reveal.from-right.in { animation-name: revealRight; }
  .reveal.from-left.in  { animation-name: revealLeft; }
  .reveal.zoom.in       { animation-name: revealZoom; }
  @keyframes revealRight { from { opacity: 0; transform: translateX(46px); }            to { opacity: 1; transform: none; } }
  @keyframes revealLeft  { from { opacity: 0; transform: translateX(-46px); }           to { opacity: 1; transform: none; } }
  @keyframes revealZoom  { from { opacity: 0; transform: translateY(24px) scale(.955); } to { opacity: 1; transform: none; } }

  /* ---- Scroll-LINKED reveals (Chromium/modern). Progress tracks each element's
     position in the viewport: it animates in as you scroll it up, out as it leaves. ---- */
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      body:not(.no-anim) .reveal {
        opacity: 1;
        animation-name: revealUp;
        animation-fill-mode: both;
        animation-timing-function: linear;
        animation-timeline: view();
        animation-range: entry 4% cover 34%;
      }
      body:not(.no-anim) .reveal.from-right { animation-name: revealRight; }
      body:not(.no-anim) .reveal.from-left  { animation-name: revealLeft; }
      body:not(.no-anim) .reveal.zoom       { animation-name: revealZoom; }
      /* the hero block is already in view at load â let it settle quickly, not on scroll */
      body:not(.no-anim) .hero .reveal { animation-range: entry 0% entry 1%; }
    }
  }

  /* Stat numbers pop in when the trust strip reveals */
  @keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.9); } to { opacity: 1; transform: none; } }
  .trust-stats .stat b { display: inline-block; }
  .trust.in .trust-stats .stat:nth-child(1) b { animation: pop .55s var(--ease-out) .10s both; }
  .trust.in .trust-stats .stat:nth-child(2) b { animation: pop .55s var(--ease-out) .20s both; }
  .trust.in .trust-stats .stat:nth-child(3) b { animation: pop .55s var(--ease-out) .30s both; }

  /* ---- "Live" motion inside the hero mock ---- */
  @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.72); } }
  .mock-bar .live { display: inline-block; animation: livePulse 1.5s var(--ease-soft) infinite; }
  .ai-chip .badge { display: inline-flex; align-items: center; gap: 5px; }
  .ai-chip .badge::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--plum-500);
    animation: livePulse 1.5s var(--ease-soft) infinite; }

  @keyframes glideA { 0% { transform: translate(0,0); } 35% { transform: translate(16px,-12px); } 70% { transform: translate(-6px,6px); } 100% { transform: translate(0,0); } }
  @keyframes glideB { 0% { transform: translate(0,0); } 40% { transform: translate(-14px,9px); } 75% { transform: translate(9px,-5px); } 100% { transform: translate(0,0); } }
  .cursor.green       { animation: glideA 7s var(--ease-soft) infinite; }
  .cursor:not(.green) { animation: glideB 8.5s var(--ease-soft) infinite; }

  /* Active-speaker ring cycles through the rail tiles */
  @keyframes speak { 0%, 100% { box-shadow: 0 0 0 0 rgba(110,148,97,0); } 6%, 18% { box-shadow: 0 0 0 2px var(--sage-500); } 24% { box-shadow: 0 0 0 0 rgba(110,148,97,0); } }
  .mock-rail .tile { animation: speak 9s var(--ease-soft) infinite; }
  .mock-rail .tile:nth-child(2) { animation-delay: 2.25s; }
  .mock-rail .tile:nth-child(3) { animation-delay: 4.5s; }
  .mock-rail .tile:nth-child(4) { animation-delay: 6.75s; }

  /* Whiteboard ink dot settles in */
  @keyframes inkdot { 0%, 55% { opacity: 0; transform: scale(.2); } 100% { opacity: 1; transform: scale(1); } }
  .mock-board svg circle { transform-origin: center; transform-box: fill-box; animation: inkdot 2.6s var(--ease-out) forwards; }

  /* AI chip floats gently */
  @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  .ai-chip { animation: floaty 5.5s var(--ease-soft) infinite; }

  /* Header brand dot breathes */
  @keyframes breathe { 0%, 100% { box-shadow: 0 0 0 4px var(--plum-50); } 50% { box-shadow: 0 0 0 7px rgba(131,107,166,.10); } }
  .brand .dot { animation: breathe 3.2s var(--ease-soft) infinite; }

  /* Scroll progress bar */
  #scrollbar { position: fixed; top: 0; left: 0; height: 3px; width: 0; z-index: 100; border-radius: 0 3px 3px 0;
    background: linear-gradient(90deg, var(--sage-500), var(--accent-purple)); transition: width .08s linear; }

  /* Disable all decorative loops when motion is off */
  @media (prefers-reduced-motion: reduce) {
    .mock-bar .live, .ai-chip, .ai-chip .badge::before, .cursor, .mock-rail .tile,
    .mock-board svg circle, .brand .dot, .trust-stats .stat b { animation: none !important; }
  }
  body.no-anim .mock-bar .live, body.no-anim .ai-chip, body.no-anim .ai-chip .badge::before,
  body.no-anim .cursor, body.no-anim .mock-rail .tile,
  body.no-anim .mock-board svg circle, body.no-anim .brand .dot, body.no-anim .trust-stats .stat b { animation: none !important; }
  body.no-anim #scrollbar { display: none; }

  /* ---- Responsive ---- */
  @media (max-width: 960px) {
    .hero-grid { grid-template-columns: 1fr; gap: 40px; }
    .ai-chip { left: auto; right: 14px; bottom: 14px; }
    .bento .feat.lg, .bento .feat.sm, .bento .feat.half { grid-column: span 6; }
    .lg-split { grid-template-columns: 1fr; gap: 20px; }
    .wb-mock { min-height: 190px; }
    .steps { grid-template-columns: repeat(2, 1fr); gap: 30px 14px; } .steps::before, .steps-fill { display: none; }
    .cat { grid-template-columns: 1fr; gap: 22px; } .cat-label { position: static; }
    .cat-grid { grid-template-columns: 1fr; }
    .spy { grid-template-columns: 1fr; gap: 28px; }
    .spy-rail { position: static; flex-direction: row; flex-wrap: wrap; gap: 10px; padding-left: 0; }
    .spy-rail .spy-progress { display: none; }
    .spy-link { opacity: 1; padding: 10px 14px; border: 1px solid var(--border-hair); background: var(--surface-card); }
    .spy-link.is-active { border-color: var(--sage-300); background: var(--cream-50); }
    .spy-t i { display: none; }
    .spy-t b { font-size: 18px; }
    .spy-panel { min-height: 0; opacity: 1; }
    .spy-head .eyebrow { display: block; margin-bottom: 4px; }
    .foot { grid-template-columns: 1fr 1fr; } .nav-links { display: none; }
  }

  /* ---- Phone: whiteboard mocks need their own layout, not just a smaller canvas ----
     Fixed px handwriting sizes + percentage-based left/top were tuned for wide desktop
     mocks; on phone widths the same text wraps/overflows into the cursor tags and the
     face/tile art, so phone gets its own font-size + position values instead of a
     naive scale-down. */
  @media (max-width: 560px) {
    /* Hero product mock */
    .mock-screen { grid-template-columns: 1fr 46px; height: 260px; }
    .mock-stage { padding: 10px; gap: 8px; }
    .mock-board .bd-write.q { top: 7%; max-width: 74%; font-size: 13px; line-height: 1.3; }
    .mock-board .bd-write.a { top: 48%; font-size: 17px; }
    .cursor { top: 30%; left: 62%; }
    .cursor.green { top: 66%; left: 38%; }
    .mock-teacher { width: 62px; height: 42px; right: 8px; bottom: 8px; }
    .mock-teacher b { font-size: 7px; }
    .mock-rail { padding: 6px 5px; gap: 5px; }
    .tile { height: 34px; }

    /* Features "Seamless collaborative whiteboard" tile */
    .wb-mock { min-height: 210px; }
    .wb-write { font-size: 15px; }
    .wb-write.eq { top: 10%; left: 6%; }
    .wb-write.roots { top: 42%; left: 6%; }
    .wb-cursor.p { top: 24%; left: auto; right: 6%; }
    .wb-cursor.g { top: 58%; left: auto; right: 6%; }
    .wb-cursor span { font-size: 9px; }
    .wb-face { width: 52px; height: 36px; right: 8px; bottom: 8px; }
    .wb-face b { font-size: 6.5px; }
  }
  body.no-anim .reveal { animation: none !important; opacity: 1 !important; transform: none !important; }
`;
