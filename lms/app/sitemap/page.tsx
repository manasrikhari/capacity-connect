import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { GOV, POLICY_LINKS } from "@/lib/gigw";

export const metadata: Metadata = {
  title: "Sitemap — Capacity Connect",
  description: "A map of the public sections and information pages of the Capacity Connect portal.",
};

const MAIN = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/announcements", label: "Announcements & advisories" },
  { href: "/courses", label: "Course catalogue" },
  { href: "/verify", label: "Verify a certificate" },
];

export default function SitemapPage() {
  return (
    <LegalPage
      title="Sitemap"
      intro={<p>The public sections of the portal, and the information pages required of a government website.</p>}
    >
      <section>
        <h2>Main sections</h2>
        <ul className="!list-none !pl-0">
          {MAIN.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="font-medium text-plum-700 underline underline-offset-4">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Policies &amp; information</h2>
        <ul className="!list-none !pl-0">
          {POLICY_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="font-medium text-plum-700 underline underline-offset-4">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>External</h2>
        <ul className="!list-none !pl-0">
          <li>
            <a
              href={GOV.nationalPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-plum-700 underline underline-offset-4"
            >
              {GOV.nationalPortalLabel} ↗
            </a>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
