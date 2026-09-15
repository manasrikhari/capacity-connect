import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Help & support — Capacity Connect",
  description: "How to sign in, join a batch, verify a certificate and get support on Capacity Connect.",
};

export default function HelpPage() {
  return (
    <LegalPage
      title="Help &amp; support"
      intro={<p>Common tasks on the Capacity Connect portal, and how to reach the training cell for support.</p>}
    >
      <section>
        <h2>Signing in</h2>
        <ul>
          <li>Trainees join a batch with the join code shared by their trainer, then sign in with the credentials they set.</li>
          <li>Trainers and ministry administrators sign in from the staff sign-in page.</li>
          <li>If you cannot access your account, contact your department&rsquo;s Single Point of Contact (SPOC).</li>
        </ul>
      </section>
      <section>
        <h2>Verifying a certificate</h2>
        <p>
          Anyone can confirm a certificate is genuine from the{" "}
          <Link href="/verify" className="font-medium text-plum-700 underline underline-offset-4">
            certificate verification
          </Link>{" "}
          page, or by scanning the QR code printed on the certificate.
        </p>
      </section>
      <section>
        <h2>Language and readability</h2>
        <ul>
          <li>Switch between English and हिन्दी from the language control in the header.</li>
          <li>Increase or decrease text size using the A− / A / A+ controls in the national masthead.</li>
          <li>See the <Link href="/accessibility" className="font-medium text-plum-700 underline underline-offset-4">accessibility statement</Link> for the full list of supports.</li>
        </ul>
      </section>
      <section>
        <h2>Contact the training cell</h2>
        <p>
          For anything not covered here, reach out through your department&rsquo;s SPOC or the ministry training
          helpdesk, who can assist and escalate where needed.
        </p>
      </section>
    </LegalPage>
  );
}
