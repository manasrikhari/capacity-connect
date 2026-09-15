import type { Metadata, Viewport } from "next";
import {
  Spectral,
  Noto_Sans,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Spline_Sans_Mono,
  Caveat,
} from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { TricolorBand } from "@/components/layout/TricolorBand";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import "./globals.css";
import "katex/dist/katex.min.css";

/* The OpenGrapes voices, shifted a step toward the Indian-government register.
   Spectral stays the institution (page/card titles keep their editorial serif
   character), but the *interface* voice is now Noto Sans — the neutral, official
   face the NIC / GIGW ecosystem standardises on — and its Devanagari companions
   carry Hindi. Spline Sans Mono is still the machine and Caveat the teacher's
   hand. Loading Devanagari here is not decoration: भारत सरकार and every हिन्दी
   string previously fell back to whatever face the OS happened to ship. */
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

// Interface / body — the government workhorse, Latin.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Interface / body — Devanagari, so Hindi renders in the same official register.
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

// Headings in Hindi — Spectral carries no Devanagari, so this is the serif that
// stands in for it, keeping titles institutional across both scripts.
const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-serif-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
});

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Capacity Connect — Ministry of Earth Sciences",
  description: "Digital capacity building for India's weather and climate services.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Capacity Connect", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#5b3a8e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${spectral.variable} ${notoSans.variable} ${notoSansDevanagari.variable} ${notoSerifDevanagari.variable} ${splineSansMono.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-page">
        {/* National-identity accent: a hairline Ashoka tricolour at the very top
            of every page — the one government cue that sits above all chrome. */}
        <TricolorBand />
        {/* Instant feedback on every navigation — including filter/option
            changes that only touch search params, which loading.tsx never
            covers — so a slow round-trip reads as "working", not "frozen". */}
        <NextTopLoader color="#6B5489" height={3} showSpinner={false} shadow={false} />
        {/* GIGW / WCAG: keyboard users skip the nav straight to content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-plum-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
        >
          {translate(locale, "nav.language") === "भाषा" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}
        </a>
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
