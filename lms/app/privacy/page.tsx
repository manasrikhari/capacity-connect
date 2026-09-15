import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy — Capacity Connect",
  description: "How the Capacity Connect portal collects, uses and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          The Ministry of Earth Sciences respects the privacy of everyone who uses Capacity Connect. This policy
          explains what information the portal collects and how it is used.
        </p>
      }
    >
      <section>
        <h2>Information we collect</h2>
        <p>
          The portal does not collect personal information from you unless you provide it as part of enrolment or
          use of a training service. Where you hold an account, we process your name, official email, department,
          designation, and your training records — enrolments, attendance, assessment attempts and certificates.
        </p>
      </section>
      <section>
        <h2>How the information is used</h2>
        <ul>
          <li>To administer courses, batches, live classes and assessments.</li>
          <li>To issue and verify certificates and to map competencies.</li>
          <li>To produce aggregate reports on national training capacity for the Ministry.</li>
        </ul>
        <p>
          Personal information is not sold, rented or shared with any third party, except where required by law or
          to another government agency in the discharge of its official function.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          The portal uses cookies that are strictly necessary — to keep you signed in and to remember your
          language preference. It does not use cookies to build advertising profiles.
        </p>
      </section>
      <section>
        <h2>Retention and security</h2>
        <p>
          Training records are retained in accordance with government record-management norms. Reasonable
          technical and administrative safeguards are in place to protect information against unauthorised access.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          For any query about your personal data, please contact your department&rsquo;s Single Point of Contact
          (SPOC) or the ministry training helpdesk.
        </p>
      </section>
    </LegalPage>
  );
}
