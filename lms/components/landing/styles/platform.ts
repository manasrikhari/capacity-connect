const css = String.raw;
export const platformStyles = css`
  /* ---- Feature catalogue ---- */
  /* ---- Feature catalogue: pinned scrollspy ---- */
  .spy-pin { position: relative; }
  /* JS adds .is-pinning once measured â tall track that the stage pins within */
  .spy-pin.is-pinning { height: 220vh; }
  .spy-stage { display: flex; flex-direction: column; }
  .spy-pin.is-pinning .spy-stage { position: sticky; top: 70px; min-height: calc(100vh - 70px);
    justify-content: center; padding: 32px 0; box-sizing: border-box; overflow: hidden; }
  .spy-pin.is-pinning .sec-head { margin-bottom: 34px; }

  .spy { display: grid; grid-template-columns: 300px 1fr; gap: 56px; align-items: start; }
  .spy-rail { position: sticky; top: 104px; display: flex; flex-direction: column; gap: 6px; padding-left: 20px; }
  .spy-pin.is-pinning .spy-rail { position: static; top: auto; }
  .spy-rail .spy-progress { position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px;
    background: var(--border-hair); border-radius: 2px; overflow: hidden; }
  .spy-progress-fill { position: absolute; left: 0; top: 0; width: 100%; height: 33.33%;
    background: linear-gradient(var(--accent-green), var(--accent-purple)); border-radius: 2px;
    transition: transform var(--dur-base) var(--ease-out); transform: translateY(0); }
  .spy-link { display: flex; gap: 15px; align-items: baseline; padding: 16px 6px; cursor: pointer;
    opacity: .42; transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
    border-radius: var(--radius-md); }
  .spy-link:hover { opacity: .72; }
  .spy-link.is-active { opacity: 1; }
  .spy-n { font-family: var(--font-mono); font-size: 12px; color: var(--accent-purple); letter-spacing: .04em;
    padding-top: 4px; transition: color var(--dur-base) var(--ease-out); }
  .spy-t { display: flex; flex-direction: column; gap: 5px; }
  .spy-t b { font-family: var(--font-display); font-size: 25px; font-weight: 400; letter-spacing: -0.02em;
    color: var(--ink-900); line-height: 1.05; }
  .spy-t i { font-style: normal; font-size: 13.5px; line-height: 1.5; color: var(--text-muted);
    max-height: 0; opacity: 0; overflow: hidden;
    transition: max-height var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out); }
  .spy-link.is-active .spy-t i { max-height: 48px; opacity: 1; }

  .spy-panels { display: flex; flex-direction: column; gap: 20px; }
  .spy-panel { opacity: .5; transition: opacity var(--dur-base) var(--ease-out); }
  .spy-panel.is-active { opacity: 1; }
  /* Pinned mode: panels stack in one place and crossfade */
  .spy-pin.is-pinning .spy-panels { position: relative; display: block; min-height: 340px; }
  .spy-pin.is-pinning .spy-panel { position: absolute; inset: 0; opacity: 0; transform: translateY(16px);
    pointer-events: none; transition: opacity .45s var(--ease-out), transform .45s var(--ease-out); }
  .spy-pin.is-pinning .spy-panel.is-active { opacity: 1; transform: none; pointer-events: auto; }
  .spy-head { margin-bottom: 16px; }
  .spy-head .eyebrow { display: none; }
  .spy-pin.is-pinning .spy-head .eyebrow { display: block; }
  .cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .row-feat { display: flex; gap: 13px; padding: 18px 20px; border-radius: var(--radius-md);
    background: var(--surface-card); border: 1px solid var(--border-hair);
    transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
  .row-feat:hover { border-color: var(--sage-300); background: var(--cream-50); transform: translateY(-2px); }
  .row-feat .ic { flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center;
    background: var(--cream-200); color: var(--accent-green-deep);
    transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out); }
  .spy-panel.is-active .row-feat .ic { background: var(--sage-100); }
  .row-feat .ic svg { width: 17px; height: 17px; }
  .row-feat h5 { font-family: var(--font-body); font-size: 14.5px; font-weight: 600; color: var(--ink-900); margin: 1px 0 4px; }
  .row-feat p { font-size: 12.8px; line-height: 1.5; color: var(--text-muted); }

  /* ---- Why / differentiators ---- */
  .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .why { padding: 4px 0; }
  .why .k { font-family: var(--font-mono); font-size: 12px; color: var(--accent-purple); letter-spacing: .06em; }
  .why h4 { font-family: var(--font-display); font-size: 22px; font-weight: 400; margin: 14px 0 9px; letter-spacing: -0.015em; }
  .why p { font-size: 14.5px; line-height: 1.6; color: var(--ink-700); }
  .why .ln { height: 2px; width: 34px; background: var(--sage-400, var(--sage-300)); border-radius: 2px; margin-bottom: 16px; }
`;
