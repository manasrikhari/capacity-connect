import Link from "next/link";
import { GOV, POLICY_LINKS } from "@/lib/gigw";

export function LandingFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot">
          <div>
            <div className="brand">
              <span className="dot" />
              Capacity Connect
            </div>
            <p>
              The Ministry of Earth Sciences &amp; India Meteorological Department&apos;s platform for digital capacity building
              in weather and climate services. Train live. Certify. Track national capacity.
            </p>
          </div>
          <div>
            <h6>Platform</h6>
            <ul>
              <li><a href="#features">Live classroom</a></li>
              <li><a href="#features">MeghDoot AI</a></li>
              <li><a href="#courses">Courses</a></li>
              <li><a href="#announcements">Announcements</a></li>
            </ul>
          </div>
          <div>
            <h6>For members</h6>
            <ul>
              <li><a href="#signin">Trainees</a></li>
              <li><a href="#signin">Trainers</a></li>
              <li><a href="#signin">Ministry admins</a></li>
              <li><Link href="/verify">Verify a certificate</Link></li>
              <li><Link href="/search">Search</Link></li>
            </ul>
          </div>
          <div>
            <h6>Important links</h6>
            <ul>
              {POLICY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
              <li>
                <a href={GOV.nationalPortal} target="_blank" rel="noopener noreferrer">
                  {GOV.nationalPortalLabel} ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* GIGW statutory base: national identity, ownership and review date. */}
        <div className="mt-8 flex flex-col gap-2 border-t border-hair/70 pt-5 text-[12px] leading-relaxed text-ink-500 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p lang="hi" className="text-ink-700">{GOV.countryHi} · {GOV.countryEn}</p>
            <p>© {GOV.copyrightYear} {GOV.ministry} · {GOV.department}. All rights reserved.</p>
            <p>{GOV.managedBy}. {GOV.developedBy}.</p>
          </div>
          <div className="space-y-1 md:text-right">
            <p>Last reviewed: {GOV.lastReviewed}</p>
            <p className="max-w-xs md:ml-auto">{GOV.bestViewed}</p>
          </div>
        </div>
        <div className="foot-credit">Capacity Connect — a national training platform</div>
      </div>
    </footer>
  );
}
