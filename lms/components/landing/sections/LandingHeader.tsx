import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { DEFAULT_LOCALE, translate, type Locale } from "@/lib/i18n";

export function LandingHeader({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = (k: string) => translate(locale, k);
  return (
    <header className="site" id="hdr">
      <div className="wrap nav">
        <div className="brand">Capacity Connect</div>
        <nav className="nav-links">
          <a href="#features">{t("landing.nav.platform")}</a>
          <a href="#announcements">{t("landing.nav.announcements")}</a>
          <a href="#courses">{t("landing.nav.courses")}</a>
          <a href="#verify">{t("landing.nav.verify")}</a>
        </nav>
        <div className="nav-actions">
          <LanguageToggle current={locale} />
          <a href="#signin" className="btn btn-primary">
            {t("nav.signIn")}
          </a>
        </div>
      </div>
    </header>
  );
}
