import Link from "next/link";
import { TricolorBand } from "@/components/layout/TricolorBand";
import { GOV, POLICY_LINKS } from "@/lib/gigw";
import { GOV_EMBLEM_SRC } from "@/lib/gov-emblem";
import { getLocale } from "@/lib/i18n-server";

/**
 * The GIGW site footer for the utility and policy pages.
 *
 * Government of India footers are a recognisable pattern: the national identity,
 * the statutory policy links (accessibility, terms, privacy, copyright,
 * hyperlinking, help), an explicit content owner and developer credit, a
 * last-reviewed date, and a best-viewed note. It rides the design system's one
 * dark surface (`board`) with the tricolour on top, so it reads as government
 * chrome without inventing a new colour.
 */
export async function SiteFooter() {
  const locale = await getLocale();
  const hi = locale === "hi";

  return (
    <footer role="contentinfo" className="mt-16 bg-board text-chalk">
      <TricolorBand />
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* National identity */}
          <div className="flex items-start gap-3">
            {GOV_EMBLEM_SRC ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={GOV_EMBLEM_SRC} alt="State Emblem of India" className="h-12 w-auto shrink-0" />
            ) : (
              <span aria-hidden="true" className="mt-1 h-10 w-px shrink-0 bg-chalk-muted/40" />
            )}
            <div className="min-w-0 leading-tight">
              <p lang="hi" className="text-[13px] text-chalk-muted">{GOV.countryHi}</p>
              <p className="text-[13px] text-chalk-muted">{GOV.countryEn}</p>
              <p className="font-display text-[17px] text-chalk">{GOV.ministry}</p>
              <p className="mt-0.5 text-[12.5px] text-chalk-muted">{GOV.department}</p>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-chalk-muted">
                {hi
                  ? "मौसम और जलवायु सेवाओं के लिए डिजिटल क्षमता निर्माण मंच।"
                  : "A national platform for digital capacity building in weather and climate services."}
              </p>
            </div>
          </div>

          {/* Statutory policies + important links */}
          <nav aria-label={hi ? "महत्वपूर्ण लिंक" : "Important links"}>
            <h2 className="font-display text-[15px] text-chalk">{hi ? "महत्वपूर्ण लिंक" : "Important links"}</h2>
            <ul className="mt-3 space-y-2">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="rounded-[6px] text-[13px] text-chalk-muted underline-offset-4 transition-colors hover:text-chalk hover:underline focus-visible:text-chalk"
                  >
                    {hi ? l.labelHi : l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Portal */}
          <nav aria-label={hi ? "पोर्टल" : "Portal"}>
            <h2 className="font-display text-[15px] text-chalk">{hi ? "पोर्टल" : "Portal"}</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-chalk-muted">
              <li><Link href="/" className="underline-offset-4 transition-colors hover:text-chalk hover:underline">{hi ? "मुखपृष्ठ" : "Home"}</Link></li>
              <li><Link href="/search" className="underline-offset-4 transition-colors hover:text-chalk hover:underline">{hi ? "खोज" : "Search"}</Link></li>
              <li><Link href="/verify" className="underline-offset-4 transition-colors hover:text-chalk hover:underline">{hi ? "प्रमाणपत्र सत्यापित करें" : "Verify a certificate"}</Link></li>
              <li><Link href="/announcements" className="underline-offset-4 transition-colors hover:text-chalk hover:underline">{hi ? "घोषणाएँ" : "Announcements"}</Link></li>
              <li><Link href="/help" className="underline-offset-4 transition-colors hover:text-chalk hover:underline">{hi ? "सहायता" : "Help & support"}</Link></li>
              <li>
                <a
                  href={GOV.nationalPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition-colors hover:text-chalk hover:underline"
                >
                  {GOV.nationalPortalLabel} ↗
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Credits / statutory base row */}
        <div className="mt-9 border-t border-chalk-muted/20 pt-5">
          <div className="flex flex-col gap-2 text-[12px] leading-relaxed text-chalk-muted md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p>© {GOV.copyrightYear} {GOV.ministry}. {hi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}</p>
              <p>{GOV.managedBy}. {GOV.developedBy}.</p>
            </div>
            <div className="space-y-1 md:text-right">
              <p>{hi ? "अंतिम समीक्षा" : "Last reviewed"}: {GOV.lastReviewed}</p>
              <p className="max-w-xs md:ml-auto">{GOV.bestViewed}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
