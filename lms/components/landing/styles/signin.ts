const css = String.raw;
export const signInStyles = css`
  /* ---- Sign-in card ---- */
  .signin-card { max-width: 420px; margin: 0 auto; text-align: center;
    background: var(--cream-50); border: 1px solid var(--border-hair);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
    padding: 40px 36px 34px; }
  .signin-card h2 { font-size: clamp(26px, 2.6vw, 34px); font-weight: 400;
    letter-spacing: -0.02em; line-height: 1.1; margin-top: 12px; }
  .signin-card h2 em { font-style: italic; font-weight: 300; color: var(--accent-green-deep); }
  .signin-form { margin-top: 26px; text-align: left; }
  .signin-or { display: flex; align-items: center; gap: 12px; margin: 20px 0 14px;
    color: var(--text-faint); font-family: var(--font-mono); font-size: 11px;
    letter-spacing: var(--tracking-caps); text-transform: uppercase; }
  .signin-or::before, .signin-or::after { content: ""; height: 1px; flex: 1;
    background: var(--border-hair); }
  .signin-google { width: 100%; justify-content: center; }
  .signin-google svg { width: 16px; height: 16px; }
  @media (max-width: 560px) { .signin-card { padding: 28px 20px 26px; } }
`;
