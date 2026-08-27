const css = String.raw;
export const howItWorksStyles = css`
  /* ---- How it works ---- */
  .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; position: relative; }
  /* dim base track */
  .steps::before { content: ""; position: absolute; left: 8%; right: 8%; top: 26px; height: 2px;
    background: var(--border-hair); border-radius: 2px; }
  /* scroll-driven fill that sweeps left â right, lighting each step as it passes */
  .steps-fill { position: absolute; left: 8%; top: 25px; height: 3px; width: 0; z-index: 0;
    background: var(--accent-green-deep);
    border-radius: 3px; box-shadow: 0 0 14px color-mix(in srgb, var(--accent-green-deep) 75%, transparent);
    transition: width .4s var(--ease-out); }
  .step { text-align: center; padding: 0 14px; position: relative;
    opacity: .48; transition: opacity .5s var(--ease-out); }
  .step.is-lit { opacity: 1; }
  .step .n { width: 52px; height: 52px; margin: 0 auto 18px; border-radius: 50%; background: var(--cream-50);
    border: 1px solid var(--border-strong); display: grid; place-items: center; font-family: var(--font-display);
    font-size: 20px; color: var(--ink-900); box-shadow: var(--shadow-xs); position: relative; z-index: 1;
    transition: background .5s var(--ease-out), color .5s var(--ease-out), border-color .5s var(--ease-out),
                box-shadow .5s var(--ease-out), transform .5s var(--ease-out); }
  .step.is-lit .n { background: linear-gradient(150deg, var(--plum-500), var(--accent-purple));
    color: var(--cream-50); border-color: transparent; transform: translateY(-3px) scale(1.07);
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-purple) 16%, transparent),
                0 10px 24px color-mix(in srgb, var(--accent-purple) 34%, transparent); }
  /* the leading (most recently lit) step gets a gentle live glow while it sweeps */
  .step.is-active .n { animation: stepGlow 2.2s var(--ease-soft) infinite; }
  @keyframes stepGlow {
    0%, 100% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-purple) 16%, transparent),
                           0 10px 24px color-mix(in srgb, var(--accent-purple) 32%, transparent); }
    50%      { box-shadow: 0 0 0 11px color-mix(in srgb, var(--accent-purple) 6%, transparent),
                           0 12px 30px color-mix(in srgb, var(--accent-purple) 46%, transparent); }
  }
  .step h4 { font-family: var(--font-body); font-size: 16px; font-weight: 600; color: var(--ink-900); margin-bottom: 6px; }
  .step p { font-size: 13.5px; line-height: 1.5; color: var(--text-muted); }
  @media (prefers-reduced-motion: reduce) {
    .step, .step .n { opacity: 1 !important; transition: none !important; }
    .step.is-active .n { animation: none !important; }
  }
  body.no-anim .step { opacity: 1 !important; }
  body.no-anim .step .n { transition: none !important; }
  body.no-anim .step.is-active .n { animation: none !important; }
`;
