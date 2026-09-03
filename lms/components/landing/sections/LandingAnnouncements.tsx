import Link from "next/link";
import { formatDate } from "@/lib/utils";

export type LandingAnnouncement = {
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  date: Date | string;
  isFeatured: boolean;
};

/**
 * Public announcements strip on the marketing homepage. Uses the landing's own
 * design tokens (CSS variables from the injected stylesheet) so it sits inside
 * the OpenGrapes/Capacity Connect marketing aesthetic rather than the ledger UI.
 */
export function LandingAnnouncements({ announcements }: { announcements: LandingAnnouncement[] }) {
  if (announcements.length === 0) return null;

  return (
    <section className="band" id="announcements">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">From the ministry</div>
          <h2>
            Notices, advisories &amp; <em>achievements.</em>
          </h2>
          <p>
            Training-calendar updates, MoES advisories, and milestones from India&apos;s national
            capacity-building programme.
          </p>
        </div>

        <div
          className="reveal d1"
          style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {announcements.map((a) => (
            <a
              key={a.slug}
              href={`/announcements/${a.slug}`}
              style={{
                display: "block",
                borderRadius: 16,
                border: "1px solid var(--border, rgba(0,0,0,.08))",
                background: "var(--bg-card, #fff)",
                padding: 20,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--plum-700)",
                    background: "var(--plum-100)",
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  {a.category}
                </span>
                {a.isFeatured && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sage-600)" }}>
                    ★ Featured
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 500, color: "var(--ink-900)", lineHeight: 1.25 }}>
                {a.title}
              </h3>
              {a.summary && (
                <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5 }}>
                  {a.summary}
                </p>
              )}
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-300)",
                }}
              >
                {formatDate(a.date)}
              </div>
            </a>
          ))}
        </div>

        <div className="reveal d2" style={{ marginTop: 28 }}>
          <Link href="/announcements" className="btn btn-outline">
            All announcements
          </Link>
        </div>
      </div>
    </section>
  );
}
