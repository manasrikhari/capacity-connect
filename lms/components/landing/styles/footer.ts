const css = String.raw;
export const footerStyles = css`
  /* ---- Footer ---- */
  footer.site { padding: 64px 0 40px; border-top: 1px solid var(--border-hair); }
  .foot { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 30px; }
  .foot .brand { margin-bottom: 14px; }
  .foot p { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; max-width: 30ch; }
  .foot h6 { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    color: var(--text-faint); margin: 0 0 14px; font-weight: 500; }
  .foot ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
  .foot ul a { font-size: 14px; color: var(--ink-700); }
  .foot ul a:hover { color: var(--ink-900); }
  .foot-base { display: flex; justify-content: space-between; align-items: center; margin-top: 48px;
    padding-top: 22px; border-top: 1px solid var(--border-hair); font-size: 12.5px; color: var(--text-muted); }
  .foot-credit { margin-top: 16px; text-align: center; font-family: var(--font-mono);
    font-size: 11px; letter-spacing: .08em; color: var(--text-faint); }
`;
