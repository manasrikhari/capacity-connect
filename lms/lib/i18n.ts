/**
 * Lightweight, dependency-free i18n (Phase 6, Hindi / हिन्दी).
 *
 * A cookie-selected locale drives `<html lang>` and a dictionary lookup. Kept
 * pure and framework-free so the dictionary and `translate()` are unit-testable;
 * a thin server helper (`getLocale`) reads the cookie. English is always the
 * fallback, so a key missing from the Hindi dictionary degrades to English
 * rather than showing a raw key — new strings can be added incrementally.
 */

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "cc_locale";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** Narrow an arbitrary string to a supported Locale (defaults to English). */
export function coerceLocale(value: string | undefined | null): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

type Dict = Record<string, string>;

const en: Dict = {
  "nav.signIn": "Sign in",
  "nav.browseCourses": "Browse courses",
  "nav.calendar": "Calendar view",
  "nav.verify": "Verify a certificate",
  "nav.backHome": "Back to home",
  "nav.backDashboard": "Back to dashboard",
  "nav.language": "Language",
  "nav.accessibility": "Accessibility",
  "common.dashboard": "Dashboard",
  "common.courses": "Courses",
  "common.announcements": "Announcements",
  "common.profile": "Profile",
  "common.signOut": "Sign out",
  "common.loading": "Loading…",
  "common.offline": "You are offline",
  "catalogue.title": "Course catalogue",
  "catalogue.subtitle":
    "Every scheduled course in India's national capacity-building programme for weather, climate and ocean services.",
  "catalogue.requestEnrolment": "Request enrolment",
  "landing.ministry": "Ministry of Earth Sciences · India Meteorological Department",
};

// Hindi. Not exhaustive by design — anything absent falls back to English.
const hi: Dict = {
  "nav.signIn": "साइन इन करें",
  "nav.browseCourses": "पाठ्यक्रम देखें",
  "nav.calendar": "कैलेंडर दृश्य",
  "nav.verify": "प्रमाणपत्र सत्यापित करें",
  "nav.backHome": "मुखपृष्ठ पर लौटें",
  "nav.backDashboard": "डैशबोर्ड पर लौटें",
  "nav.language": "भाषा",
  "nav.accessibility": "सुगम्यता",
  "common.dashboard": "डैशबोर्ड",
  "common.courses": "पाठ्यक्रम",
  "common.announcements": "घोषणाएँ",
  "common.profile": "प्रोफ़ाइल",
  "common.signOut": "साइन आउट",
  "common.loading": "लोड हो रहा है…",
  "common.offline": "आप ऑफ़लाइन हैं",
  "catalogue.title": "पाठ्यक्रम सूची",
  "catalogue.subtitle":
    "मौसम, जलवायु और महासागर सेवाओं के लिए भारत के राष्ट्रीय क्षमता-निर्माण कार्यक्रम का प्रत्येक निर्धारित पाठ्यक्रम।",
  "catalogue.requestEnrolment": "नामांकन का अनुरोध करें",
  "landing.ministry": "पृथ्वी विज्ञान मंत्रालय · भारत मौसम विज्ञान विभाग",
};

const DICTIONARIES: Record<Locale, Dict> = { en, hi };

/** Translate a key for a locale, falling back to English then the key itself. */
export function translate(locale: Locale, key: string): string {
  return DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key] ?? key;
}

/** A bound translator: `const t = translator(locale); t("nav.signIn")`. */
export function translator(locale: Locale): (key: string) => string {
  return (key: string) => translate(locale, key);
}
