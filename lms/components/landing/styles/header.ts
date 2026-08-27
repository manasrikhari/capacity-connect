const css = String.raw;
export const headerStyles = css`
  /* ============ Landing page ============ */
  .wrap { max-width: var(--container); margin: 0 auto; padding: 0 28px; }
  body { overflow-x: hidden; }

  /* ---- Header ---- */
  header.site {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--cream-100) 82%, transparent);
    backdrop-filter: blur(12px) saturate(1.1);
    -webkit-backdrop-filter: blur(12px) saturate(1.1);
    border-bottom: 1px solid transparent;
    transition: border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out);
  }
  header.site.scrolled { border-bottom-color: var(--border-hair); }
  .nav { display: flex; align-items: center; justify-content: space-between; height: 70px; }
  .brand { display: flex; align-items: center; gap: 9px; font-family: var(--font-display);
    font-size: 22px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink-900); }
  .brand .dot { width: 11px; height: 11px; border-radius: 50%;
    background: radial-gradient(circle at 32% 30%, var(--plum-300), var(--plum-600) 75%);
    box-shadow: 0 0 0 4px var(--plum-50); }
  .nav-links { display: flex; gap: 30px; align-items: center; }
  .nav-links a { font-size: 14.5px; color: var(--ink-700); transition: color var(--dur-fast) var(--ease-out); }
  .nav-links a:hover { color: var(--ink-900); }
  .nav-actions { display: flex; align-items: center; gap: 8px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body);
    font-weight: 500; line-height: 1; border-radius: var(--radius-pill); cursor: pointer;
    border: 1px solid transparent; white-space: nowrap; font-size: 14.5px; padding: 10px 20px;
    transition: transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out); }
  .btn:active { transform: translateY(1px); }
  .btn-primary { background: var(--accent-green); color: var(--cream-50); box-shadow: var(--shadow-sm); }
  .btn-primary:hover { filter: brightness(1.05); }
  .btn-ghost { background: transparent; color: var(--ink-700); }
  .btn-ghost:hover { background: var(--cream-200); color: var(--ink-900); }
  .btn-outline { background: transparent; color: var(--ink-900); border-color: var(--border-strong); }
  .btn-outline:hover { background: var(--cream-50); border-color: var(--ink-300); }
  .btn-lg { font-size: 16px; padding: 14px 28px; }
`;
