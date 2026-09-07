import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use — Capacity Connect",
  description: "Terms and conditions governing the use of the Capacity Connect portal.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro={
        <p>
          Capacity Connect is operated by the Ministry of Earth Sciences for the digital capacity building of
          personnel across the India Meteorological Department and allied institutions. By accessing this
          portal you agree to the terms below.
        </p>
      }
    >
      <section>
        <h2>Use of content</h2>
        <p>
          Content on this portal is provided for training and informational purposes. While every effort is made
          to keep it accurate and current, it should not be construed as a statement of law or used for any legal
          purpose. The Ministry accepts no responsibility for any loss arising from the use of this information.
        </p>
      </section>
      <section>
        <h2>Accounts and access</h2>
        <p>
          Trainee, trainer and administrator accounts are restricted to authorised government personnel and
          enrolled participants. You are responsible for keeping your sign-in credentials confidential and for all
          activity under your account. Access obtained through a batch join code is limited to that batch.
        </p>
        <ul>
          <li>Do not attempt to gain unauthorised access to any account, system or data.</li>
          <li>Do not disrupt, overload or interfere with the portal or its underlying infrastructure.</li>
          <li>Do not upload unlawful, infringing or malicious material.</li>
        </ul>
      </section>
      <section>
        <h2>Links to external sites</h2>
        <p>
          This portal may link to websites operated by other agencies. Those sites are not under the control of
          the Ministry, and the Ministry is not responsible for their content or availability.
        </p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of India. Any dispute arising out of the use of this portal is
          subject to the exclusive jurisdiction of the competent courts in India.
        </p>
      </section>
    </LegalPage>
  );
}
