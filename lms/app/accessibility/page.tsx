import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Accessibility — Capacity Connect",
  description: "Accessibility statement for the Capacity Connect portal, aligned to GIGW and WCAG 2.1 AA.",
};

/**
 * Accessibility statement — a GIGW (Guidelines for Indian Government Websites)
 * requirement. States the conformance target, the measures taken, and how to
 * report a barrier.
 */
export default function AccessibilityPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
            Ministry of Earth Sciences · India Meteorological Department
          </p>
          <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">Accessibility statement</h1>

          <div className="mt-6 space-y-6 text-ink-700">
            <p>
              Capacity Connect is committed to ensuring digital accessibility for all users, including
              persons with disabilities, in line with the{" "}
              <span className="font-medium">Guidelines for Indian Government Websites (GIGW)</span> and{" "}
              <span className="font-medium">WCAG 2.1 Level AA</span>.
            </p>

            <section>
              <h2 className="font-display text-xl text-ink-900">Measures we take</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Semantic HTML landmarks and a &ldquo;Skip to main content&rdquo; link on every page.</li>
                <li>Full keyboard operability with visible focus indicators.</li>
                <li>Text alternatives for meaningful images and icons.</li>
                <li>Colour contrast that meets AA, plus adjustable text size and a reduce-transparency mode.</li>
                <li>Content available in English and हिन्दी (Hindi), selectable from any page.</li>
                <li>Responsive layouts that reflow to small screens and support 200% zoom.</li>
                <li>Respects the operating-system &ldquo;reduce motion&rdquo; preference.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900">Conformance status</h2>
              <p className="mt-2">
                The portal is designed to conform to WCAG 2.1 AA. Accessibility is reviewed as part of
                ongoing development; some third-party embedded content (for example the live classroom) may
                have partial support, and we are working to close remaining gaps.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900">Report a barrier</h2>
              <p className="mt-2">
                If you encounter an accessibility barrier, please contact the training cell through your
                department&rsquo;s SPOC or the ministry helpdesk so we can assist and prioritise a fix.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
