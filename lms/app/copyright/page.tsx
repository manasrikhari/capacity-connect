import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Copyright policy — Capacity Connect",
  description: "Copyright and reproduction terms for material published on the Capacity Connect portal.",
};

export default function CopyrightPage() {
  return (
    <LegalPage
      title="Copyright policy"
      intro={
        <p>
          Material featured on this portal is published by the Ministry of Earth Sciences for public information
          and training.
        </p>
      }
    >
      <section>
        <h2>Reproduction of material</h2>
        <p>
          Material on this portal may be reproduced free of charge in any format or medium, provided it is
          reproduced accurately and not used in a misleading context. Where the material is republished or issued
          to others, the source must be acknowledged as the Ministry of Earth Sciences and the title of the
          document must be stated.
        </p>
      </section>
      <section>
        <h2>What this permission does not cover</h2>
        <ul>
          <li>The State Emblem of India and other national symbols, which are protected by law.</li>
          <li>Third-party copyright material, logos and course content owned by their respective rights holders.</li>
          <li>Any use that misrepresents the material or implies official endorsement.</li>
        </ul>
        <p>
          Permission to reproduce third-party material must be obtained from the copyright holder concerned.
        </p>
      </section>
    </LegalPage>
  );
}
