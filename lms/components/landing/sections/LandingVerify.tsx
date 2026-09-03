/**
 * Public certificate-verification widget. A plain GET form to /verify?q=… — no
 * client JS needed; the /verify page handles the lookup.
 */
export function LandingVerify() {
  return (
    <section className="band" id="verify">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Trust &amp; verification</div>
          <h2>
            Verify a <em>certificate.</em>
          </h2>
          <p>
            Every certificate carries a unique ID. Enter it below to confirm the holder, course, and issue
            date against IMD&apos;s records.
          </p>
        </div>

        <form
          action="/verify"
          method="get"
          className="reveal d1"
          style={{ display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 560 }}
        >
          <input
            type="text"
            name="q"
            required
            placeholder="Certificate ID (e.g. CC-2026-000123)"
            aria-label="Certificate ID"
            style={{
              flex: "1 1 260px",
              minWidth: 0,
              borderRadius: 10,
              border: "1px solid var(--border-strong, rgba(0,0,0,.16))",
              background: "var(--bg-card, #fff)",
              padding: "12px 14px",
              fontSize: 15,
              fontFamily: "var(--font-body)",
              color: "var(--ink-900)",
            }}
          />
          <button type="submit" className="btn btn-primary btn-lg">
            Verify
          </button>
        </form>
      </div>
    </section>
  );
}
