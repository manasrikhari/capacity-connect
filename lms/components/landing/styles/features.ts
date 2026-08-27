
const css = String.raw;
export const featuresStyles = css`
  /* ---- Hero features: bento ---- */
  .bento { display: grid; grid-template-columns: repeat(6, 1fr); gap: 18px; }
  .feat { background: var(--surface-card); border: 1px solid var(--border-hair); border-radius: var(--radius-lg);
    padding: 28px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
    transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); }
  .feat:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
  .feat.lg { grid-column: span 4; }
  .feat.sm { grid-column: span 2; }
  .feat.half { grid-column: span 3; }
  .ficon { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; margin-bottom: 16px; }
  .ficon svg { width: 21px; height: 21px; }
  .ficon.green { background: var(--sage-100); color: var(--sage-700); }
  .ficon.plum { background: var(--plum-100); color: var(--plum-700); }
  .feat h3 { font-size: 22px; font-weight: 500; letter-spacing: -0.015em; margin-bottom: 9px; }
  .feat p { font-size: 15px; line-height: 1.6; color: var(--ink-700); max-width: 46ch; }
  .feat .meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { font-family: var(--font-mono); font-size: 11px; color: var(--ink-700); background: var(--cream-200);
    border: 1px solid var(--border-hair); padding: 4px 10px; border-radius: var(--radius-pill); }
  .feat-art { position: absolute; right: -10px; top: -10px; opacity: .5; }

  /* mini AI conversation art inside big feature */
  .ai-thread { margin-top: 20px; display: flex; flex-direction: column; gap: 9px; max-width: 360px; }
  .bub { font-size: 13px; line-height: 1.45; padding: 9px 13px; border-radius: 13px; max-width: 86%; }
  .bub.you { align-self: flex-end; background: var(--sage-500); color: var(--cream-50); border-bottom-right-radius: 4px; }
  .bub.ai { align-self: flex-start; background: var(--cream-200); color: var(--ink-900); border-bottom-left-radius: 4px;
    border: 1px solid var(--border-hair); }
  .bub.ai .src { display: block; margin-top: 6px; font-family: var(--font-mono); font-size: 10px; color: var(--plum-600); }

  /* Bento tiles are flex columns so their visuals stretch to fill the row height */
  .feat { display: flex; flex-direction: column; }
  .feat > p { flex: 0 0 auto; }

  /* lg tile: two-column split â copy left, whiteboard right */
  .lg-split { display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 26px; align-items: stretch; height: 100%; }
  .lg-copy { display: flex; flex-direction: column; }
  .lg-copy .meta { margin-top: auto; }
  .wb-mock { margin-top: 0; flex: 1 1 auto; min-height: 240px; border-radius: 13px;
    background: var(--cream-100); background-image: radial-gradient(var(--cream-300) 1px, transparent 1px);
    background-size: 18px 18px; border: 1px solid var(--border-hair); position: relative; overflow: hidden; }
  .wb-mock .wb-ink { position: absolute; inset: 0; width: 100%; height: 100%; }
  .wb-write { position: absolute; z-index: 1; font-family: 'Caveat', cursive; font-weight: 700;
    font-size: 30px; line-height: 1; white-space: nowrap; letter-spacing: .01em; }
  .wb-write.eq { left: 11%; top: 24%; color: var(--plum-600); transform: rotate(-2.5deg); }
  .wb-write.roots { left: 20%; top: 54%; color: var(--sage-700); transform: rotate(-1.5deg); }
  .wb-cursor { position: absolute; display: flex; align-items: flex-start; gap: 4px;
    font-family: var(--font-mono); font-size: 10px; z-index: 2; }
  .wb-cursor i, .wb-cursor svg { width: 15px; height: 15px; }
  .wb-cursor span { color: #fff; padding: 1px 6px; border-radius: 7px; margin-top: 9px; transform: translateX(-2px); white-space: nowrap; }
  .wb-cursor.g { left: 56%; top: 52%; color: var(--sage-600); } .wb-cursor.g span { background: var(--sage-600); }
  .wb-cursor.p { left: 60%; top: 22%; color: var(--plum-500); } .wb-cursor.p span { background: var(--plum-500); }
  .wb-face { position: absolute; right: 14px; bottom: 14px; width: 92px; height: 60px; border-radius: 9px;
    background: linear-gradient(140deg, var(--plum-200), var(--sage-200)); border: 2px solid var(--cream-50);
    box-shadow: var(--shadow-sm); display: flex; align-items: flex-end; padding: 5px; }
  .wb-face b { font-family: var(--font-mono); font-size: 8.5px; color: #fff; background: rgba(35,33,28,.55); padding: 1px 5px; border-radius: 5px; white-space: nowrap; }
  .feat .meta { margin-top: 18px; }

  /* sm tile: mini live-listen panel */
  .mini-live { margin-top: 16px; flex: 1 1 auto; display: flex; flex-direction: column; gap: 9px;
    background: var(--cream-100); border: 1px solid var(--border-hair); border-radius: 11px; padding: 13px; }
  .ml-head { font-family: var(--font-mono); font-size: 10px; letter-spacing: .05em; color: var(--text-muted);
    display: flex; align-items: center; gap: 6px; }
  .ml-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage-600); }
  .ml-line { font-size: 12.5px; line-height: 1.5; color: var(--ink-700); }
  .ml-line b { color: var(--ink-900); }
  .ml-ask { margin-top: auto; font-family: var(--font-mono); font-size: 11px; color: var(--plum-600);
    display: flex; align-items: center; gap: 6px; }
  .ml-ask i, .ml-ask svg { width: 13px; height: 13px; }

  /* half tile: "one calm place" mini dashboard list */
  .place-list { margin-top: 20px; flex: 1 1 auto; display: flex; flex-direction: column; gap: 9px; justify-content: center; }
  .pl-item { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 10px;
    background: var(--cream-100); border: 1px solid var(--border-hair); font-size: 14px; color: var(--ink-900);}
  
  .pl-item i, .pl-item svg { width: 17px; height: 17px; color: var(--accent-green-deep); flex-shrink: 0; }
  .pl-item span { font-weight: 500; }
  .pl-item em { margin-left: auto; font-family: var(--font-mono); font-size: 11px; font-style: normal; color: var(--text-muted); white-space: nowrap; }

  /* half tile: AI thread footer */
  .ai-thread { margin-top: auto; }
  .ai-foot { margin-top: 14px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .04em;
    color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
  .ai-foot i, .ai-foot svg { width: 13px; height: 13px; color: var(--accent-purple); }

  .wb-cursor.g { animation: glideA 7s var(--ease-soft) infinite; }
  .wb-cursor.p { animation: glideB 8.5s var(--ease-soft) infinite; }
  .ml-dot { animation: livePulse 1.5s var(--ease-soft) infinite; }
  @media (prefers-reduced-motion: reduce) { .wb-cursor.g, .wb-cursor.p, .ml-dot { animation: none !important; } }
  body.no-anim .wb-cursor.g, body.no-anim .wb-cursor.p, body.no-anim .ml-dot { animation: none !important; }
`;
