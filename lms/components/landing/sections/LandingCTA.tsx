import { DEFAULT_LOCALE, translate, type Locale } from "@/lib/i18n";

export function LandingCTA({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = (k: string) => translate(locale, k);
  return (
    <section className="band">
      <div className="wrap reveal">
        <div className="cta-band">
          <div className="eyebrow">{t("landing.cta.eyebrow")}</div>
          {locale === "hi" ? (
            <h2>{t("landing.cta.title")}</h2>
          ) : (
            <h2>
              Live classes that <em>remember everything.</em>
            </h2>
          )}
          <p id="ctaP">{t("landing.cta.body")}</p>
          <div className="hero-cta">
            <a href="#signin" className="btn btn-cream btn-lg">
              {t("landing.cta.primary")}
            </a>
            <button className="btn btn-line btn-lg">{t("landing.cta.secondary")}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
