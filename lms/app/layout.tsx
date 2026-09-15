import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { TricolorBand } from "@/components/layout/TricolorBand";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import "./globals.css";
import "katex/dist/katex.min.css";

/* DBIM (MeitY Digital Brand Identity Manual) typography: Noto Sans is the one
   typeface for Government of India digital properties, with Noto Sans
   Devanagari for Hindi. Weights Regular / Medium / Semi Bold / Bold. */
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
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
      className={`${notoSans.variable} ${notoSansDevanagari.variable} antialiased`}
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
