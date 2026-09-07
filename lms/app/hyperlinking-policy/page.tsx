import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Hyperlinking policy — Capacity Connect",
  description: "Terms for linking to and from the Capacity Connect portal.",
};

export default function HyperlinkingPolicyPage() {
  return (
    <LegalPage title="Hyperlinking policy">
      <section>
        <h2>Links to external websites</h2>
        <p>
          At many places this portal contains links to websites and pages maintained by other organisations. These
          links are provided for your convenience. The Ministry of Earth Sciences does not control or endorse the
          content of external sites and is not responsible for their availability or accuracy.
        </p>
      </section>
      <section>
        <h2>Links to this portal</h2>
        <p>
          We do not object to you linking directly to the information hosted on this portal, and no prior
          permission is required. However, we do not permit our pages to be loaded into frames on your site. The
          pages of this portal must load into the user&rsquo;s full window.
        </p>
      </section>
    </LegalPage>
  );
}
