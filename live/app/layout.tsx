import type { Metadata, Viewport } from "next";
import { Spectral, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "../components/AuthProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1A1F18",
};

/* The OpenGrapes voices, in the classroom: Hanken for the interface, Spline
   Sans Mono for machine data (times, labels), Spectral for the occasional
   display heading. Same faces as the LMS and landing. */
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OpenGrapes Live — Classroom",
  description: "Real-time video calling with collaborative whiteboard powered by LiveKit and Tldraw",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${splineSansMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
