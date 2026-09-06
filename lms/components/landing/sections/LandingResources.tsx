export type LandingResource = {
  id: string;
  title: string;
  type: string;
  course: string | null;
  href: string;
};

const TYPE_LABEL: Record<string, string> = {
  RECORDED_LECTURE: "Lecture",
  PRESENTATION: "Slides",
  DOCUMENT: "Document",
  MANUAL: "Manual",
};

/** Learning content trainers have published to the public homepage (PS 26075). */
export function LandingResources({ resources }: { resources: LandingResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section className="band" id="resources">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Open resources</div>
          <h2>
            Recently published <em>learning content.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-500)",
            }}
          >
            Freely accessible — no sign-in required
          </p>
        </div>

        <div
          className="reveal d1"
          style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                border: "1px solid var(--border, rgba(0,0,0,.08))",
                background: "var(--bg-card, #fff)",
                padding: 20,
                textDecoration: "none",
              }}
            >
              <div className="meta">
                <span className="chip">{TYPE_LABEL[r.type] ?? r.type}</span>
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 500, color: "var(--ink-900)", lineHeight: 1.3, marginTop: 12 }}>
                {r.title}
              </h3>
              {r.course && (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-500)" }}>{r.course}</div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--plum-600, #7c3aed)" }}>
                Open →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
