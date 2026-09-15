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
  "landing.nav.platform": "Platform",
  "landing.nav.announcements": "Announcements",
  "landing.nav.courses": "Courses",
  "landing.nav.verify": "Verify",
  "landing.hero.title": "Capacity building that remembers every session.",
  "landing.hero.lede":
    "Capacity Connect is IMD's training platform — live classrooms, assessments, competency mapping, and MeghDoot, an AI that recalls everything taught. Digital capacity building for India's weather and climate services.",
  "landing.hero.cta": "Sign in to begin",
  "landing.cta.eyebrow": "Run your whole batch from one place",
  "landing.cta.title": "Live classes that remember everything.",
  "landing.cta.body":
    "Teach it, learn it, and never lose it — live classes that explain themselves, for everyone in the room.",
  "landing.cta.primary": "Start teaching free",
  "landing.cta.secondary": "Book a walkthrough",
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
  "landing.nav.platform": "मंच",
  "landing.nav.announcements": "घोषणाएँ",
  "landing.nav.courses": "पाठ्यक्रम",
  "landing.nav.verify": "सत्यापित करें",
  "landing.hero.title": "हर सत्र को याद रखने वाला क्षमता निर्माण।",
  "landing.hero.lede":
    "कैपेसिटी कनेक्ट आईएमडी का प्रशिक्षण मंच है — लाइव कक्षाएँ, मूल्यांकन, दक्षता मानचित्रण, और मेघदूत, एक एआई जो सिखाई गई हर बात को याद रखता है। भारत की मौसम और जलवायु सेवाओं के लिए डिजिटल क्षमता निर्माण।",
  "landing.hero.cta": "आरंभ करने के लिए साइन इन करें",
  "landing.cta.eyebrow": "अपना पूरा बैच एक ही जगह से चलाएँ",
  "landing.cta.title": "लाइव कक्षाएँ जो सब कुछ याद रखती हैं।",
  "landing.cta.body":
    "पढ़ाएँ, सीखें, और कभी न खोएँ — लाइव कक्षाएँ जो स्वयं की व्याख्या करती हैं, कक्षा में सभी के लिए।",
  "landing.cta.primary": "निःशुल्क पढ़ाना शुरू करें",
  "landing.cta.secondary": "वॉकथ्रू बुक करें",
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
