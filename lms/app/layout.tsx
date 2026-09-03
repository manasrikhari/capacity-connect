import type { Metadata } from "next";
import { Spectral, Hanken_Grotesk, Spline_Sans_Mono, Caveat } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
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
  title: "Capacity Connect — MoES / IMD",
  description: "Digital capacity building for India's weather and climate services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${hankenGrotesk.variable} ${splineSansMono.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-page">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
