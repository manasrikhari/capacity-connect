/**
 * Shared Government-of-India identity + the statutory policy links that the
 * Guidelines for Indian Government Websites (GIGW 3.0) expect every page to
 * reach. One source of truth so the masthead, the landing footer and the
 * utility-page footer never drift apart.
 */

export const GOV = {
  /** भारत सरकार */
  countryHi: "भारत सरकार",
  countryEn: "Government of India",
  ministry: "Ministry of Earth Sciences",
  department: "India Meteorological Department",
  product: "Capacity Connect",
  /** GIGW footers carry a content-owner and a developer credit. */
  managedBy: "Content owned and managed by the Ministry of Earth Sciences",
  developedBy: "Designed, developed & hosted by the Capacity Connect team",
  /** Kept as a constant (not a live clock) so the line is stable and reviewable. */
  lastReviewed: "07 September 2026",
  bestViewed: "Best viewed in a recent version of Chrome, Edge, Firefox or Safari at 1024×768 or higher.",
  copyrightYear: "2026",
  /** GIGW Guideline 18: the homepage/footer must link to the National Portal. */
  nationalPortal: "https://www.india.gov.in",
  nationalPortalLabel: "National Portal of India",
} as const;

export interface GigwLink {
  href: string;
  label: string;
  /** Hindi label, shown when the portal locale is Hindi. */
  labelHi: string;
}

/** The statutory GIGW link set shown in the footer. Every route here exists as
 *  a real page (and is allow-listed as public in proxy.ts). */
export const POLICY_LINKS: GigwLink[] = [
  { href: "/accessibility", label: "Accessibility statement", labelHi: "सुगम्यता विवरण" },
  { href: "/terms", label: "Terms of use", labelHi: "उपयोग की शर्तें" },
  { href: "/privacy", label: "Privacy policy", labelHi: "गोपनीयता नीति" },
  { href: "/copyright", label: "Copyright policy", labelHi: "कॉपीराइट नीति" },
  { href: "/hyperlinking-policy", label: "Hyperlinking policy", labelHi: "हाइपरलिंकिंग नीति" },
  { href: "/contact", label: "Contact us", labelHi: "संपर्क करें" },
  { href: "/feedback", label: "Feedback", labelHi: "प्रतिक्रिया" },
  { href: "/sitemap", label: "Sitemap", labelHi: "साइट मैप" },
  { href: "/help", label: "Help", labelHi: "सहायता" },
];
