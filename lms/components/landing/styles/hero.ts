const css = String.raw;
export const heroStyles = css`
  /* ---- Hero ---- */
  .hero { padding: 84px 0 64px; position: relative; }
  .hero-grid { display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 56px; align-items: center; }
  .hero h1 { font-size: clamp(46px, 5.4vw, 78px); font-weight: 400; line-height: 1.02; letter-spacing: -0.025em; }
  .hero h1 em { font-style: italic; font-weight: 300; color: var(--accent-purple); }
  .hero .lede { margin-top: 24px; font-size: 19px; line-height: 1.6; color: var(--ink-700); max-width: 32ch; }
  .hero-cta { margin-top: 34px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .hero-note { margin-top: 18px; font-family: var(--font-mono); font-size: 12.5px; color: var(--text-muted);
    display: flex; align-items: center; gap: 8px; }
  .hero-note svg { width: 15px; height: 15px; color: var(--accent-green); }

  /* ---- Hero product mock ---- */
  .mock { position: relative; }
  .mock-frame { background: var(--ink-900); border-radius: var(--radius-xl); padding: 12px;
    box-shadow: var(--shadow-lg); border: 1px solid #34312a; }
  .mock-bar { display: flex; align-items: center; gap: 7px; padding: 5px 8px 11px; }
  .mock-bar i { width: 9px; height: 9px; border-radius: 50%; background: #4b473d; display: inline-block; }
  .mock-bar .ttl { margin-left: 10px; font-family: var(--font-mono); font-size: 11px; color: #8a8576;
    display: flex; align-items: center; gap: 7px; }
  .mock-bar .live { color: #e98b82; }
  .mock-screen { background: var(--cream-50); border-radius: 14px; overflow: hidden;
    display: grid; grid-template-columns: 1fr 86px; height: 322px; }
  .mock-stage { position: relative; padding: 13px; display: flex; flex-direction: column; gap: 10px; }
  .mock-board { flex: 1; background: var(--cream-100);
    background-image: radial-gradient(var(--cream-300) 1px, transparent 1px); background-size: 17px 17px;
    border-radius: 10px; border: 1px solid var(--border-hair); position: relative; overflow: hidden; }
  .mock-board svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .mock-board .bd-write { position: absolute; z-index: 1; font-family: 'Caveat', cursive; font-weight: 700;
    line-height: 1; white-space: nowrap; }
  .mock-board .bd-write.q { left: 7%; top: 10%; color: var(--plum-600); font-size: 18px; transform: rotate(-2deg); white-space: normal; max-width: 56%; line-height: 1.28; }
  .mock-board .bd-write.a { left: 6.5%; top: 37%; color: var(--sage-700); font-size: 23px; transform: rotate(-1deg); }
  .cursor { position: absolute; left: 70%; top: 12%; display: flex; align-items: flex-start; gap: 4px; font-family: var(--font-mono); font-size: 9px; }
  .cursor span { background: var(--plum-500); color: #fff; padding: 1px 5px; border-radius: 7px; margin-top: 8px; transform: translateX(-2px); }
  .cursor.green { left: 45%; top: 40%; }
  .cursor.green span { background: var(--sage-600); }
  .cursor svg { width: 13px; height: 13px; }
  .mock-teacher { position: absolute; right: 13px; bottom: 13px; width: 96px; height: 64px; border-radius: 9px;
    background: linear-gradient(140deg, var(--plum-200), var(--sage-200)); border: 2px solid var(--cream-50);
    box-shadow: var(--shadow-sm); display: flex; align-items: flex-end; padding: 5px; }
  .mock-teacher b { font-family: var(--font-mono); font-size: 8.5px; color: #fff; background: rgba(35,33,28,.55);
    padding: 1px 5px; border-radius: 5px; }
  .mock-rail { background: var(--cream-200); border-left: 1px solid var(--border-hair); padding: 11px 9px;
    display: flex; flex-direction: column; gap: 8px; }
  .tile { height: 50px; border-radius: 8px; border: 1px solid var(--border-hair); }
  .tile.a { background: linear-gradient(160deg, var(--sage-200), var(--sage-100)); }
  .tile.b { background: linear-gradient(160deg, var(--plum-200), var(--plum-100)); }
  .tile.c { background: linear-gradient(160deg, var(--cream-300), var(--cream-200)); }
  /* AI chip floating */
  .ai-chip { position: absolute; left: -22px; bottom: 40px; background: var(--cream-50);
    border: 1px solid var(--border-hair); border-radius: 14px; box-shadow: var(--shadow-lg);
    padding: 13px 15px; width: 232px; }
  .ai-chip .h { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .ai-chip .h b { font-size: 12px; color: var(--ink-900); font-weight: 600; }
  .ai-chip .h .badge { margin-left: auto; font-family: var(--font-mono); font-size: 9px; letter-spacing: .08em;
    color: var(--plum-600); background: var(--plum-50); padding: 2px 7px; border-radius: 6px; }
  .ai-chip .h svg { width: 15px; height: 15px; color: var(--accent-purple); }
  .ai-chip p { font-size: 11.5px; line-height: 1.5; color: var(--ink-700); }
  .ai-chip p .q { color: var(--text-muted); font-style: italic; display:block; margin-bottom: 4px; }

  /* ---- Marquee / trust ---- */
  .trust { padding: 30px 0 10px; border-top: 1px solid var(--border-hair); margin-top: 56px; }
  .trust-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .trust-inner .t { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); }
  .trust-stats { display: flex; gap: 44px; }
  .stat b { font-family: var(--font-display); font-size: 30px; color: var(--ink-900); font-weight: 400; display: block; line-height: 1; }
  .stat span { font-size: 12.5px; color: var(--text-muted); }

  /* ---- Section scaffolding ---- */
  section.band { padding: 96px 0; }
  .band.sunken { background: var(--bg-sunken); }
  .sec-head { max-width: 640px; margin-bottom: 52px; }
  .sec-head.center { margin-left: auto; margin-right: auto; text-align: center; }
  .sec-head h2 { font-size: clamp(32px, 3.8vw, 50px); font-weight: 400; letter-spacing: -0.022em; line-height: 1.05; margin-top: 14px; }
  .sec-head h2 em { font-style: italic; font-weight: 300; color: var(--accent-green-deep); }
  .sec-head p { margin-top: 16px; font-size: 17.5px; line-height: 1.6; color: var(--ink-700); }
`;
