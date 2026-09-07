import type { Metadata, Viewport } from "next";
import { Spectral, Hanken_Grotesk, Spline_Sans_Mono, Caveat } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import "./globals.css";
import "katex/dist/katex.min.css";

/* The four OpenGrapes voices. Spectral is the institution, Hanken Grotesk the
   interface, Spline Sans Mono the machine, and Caveat the teacher's hand —
   the last reserved for teacher-authored annotation, never UI chrome. */
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
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
      className={`${spectral.variable} ${hankenGrotesk.variable} ${splineSansMono.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-page">
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
