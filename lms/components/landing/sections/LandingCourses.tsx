import { formatDate } from "@/lib/utils";

export type LandingCourse = {
  id: string;
  name: string;
  domain: string | null;
  level: string | null;
  wmoTier: string | null;
  trainer: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
};

export type LandingStats = {
  certified: number;
  courses: number;
  trainees: number;
};

function chip(text: string, key: string) {
  return (
    <span key={key} className="chip">
      {text}
    </span>
  );
}

/** Upcoming/active course previews + headline national-capacity figures. */
export function LandingCourses({
  courses,
  stats,
}: {
  courses: LandingCourse[];
  stats: LandingStats;
}) {
  return (
    <section className="band sunken" id="courses">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Training catalogue</div>
          <h2>
            Courses that build <em>national capacity.</em>
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
            {stats.certified.toLocaleString("en-IN")} certified · {stats.courses.toLocaleString("en-IN")} active
            courses · {stats.trainees.toLocaleString("en-IN")} trainees
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="reveal" style={{ color: "var(--ink-500)" }}>
            New courses are being scheduled. Sign in to see the full catalogue.
          </p>
        ) : (
          <div
            className="reveal d1"
            style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
          >
            {courses.map((c) => (
              <article
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 16,
                  border: "1px solid var(--border, rgba(0,0,0,.08))",
                  background: "var(--bg-card, #fff)",
                  padding: 20,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 500, color: "var(--ink-900)", lineHeight: 1.25 }}>
                  {c.name}
                </h3>
                <div className="meta" style={{ marginTop: 12 }}>
                  {[
                    c.domain ? chip(c.domain, "d") : null,
                    c.level ? chip(c.level, "l") : null,
                    c.wmoTier ? chip(c.wmoTier, "t") : null,
                  ].filter(Boolean)}
                </div>
                <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.6 }}>
                  {c.trainer && (
                    <div>
                      Trainer: <span style={{ color: "var(--ink-700)" }}>{c.trainer}</span>
                    </div>
                  )}
                  {(c.startDate || c.endDate) && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 2 }}>
                      {c.startDate ? formatDate(c.startDate) : "TBD"}
                      {c.endDate ? ` → ${formatDate(c.endDate)}` : ""}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  <a href="#signin" className="btn btn-primary">
                    Sign in to enrol
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
