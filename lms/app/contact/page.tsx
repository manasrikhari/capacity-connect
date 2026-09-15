import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Contact us — Capacity Connect",
  description: "How to reach the Capacity Connect training cell and raise a grievance.",
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact us"
      intro={<p>Reach the Capacity Connect training cell, or raise a grievance through the channels below.</p>}
    >
      <section>
        <h2>Training helpdesk</h2>
        <p>
          For help with enrolment, batches, live classes, assessments or certificates, contact your
          department&rsquo;s Single Point of Contact (SPOC), who can assist directly or escalate to the ministry
          training cell. Signed-in users can also reach the cell from within their dashboard.
        </p>
      </section>
      <section>
        <h2>Ministry of Earth Sciences</h2>
        <p>
          Prithvi Bhavan, Lodi Road,<br />
          New Delhi – 110003, India.
        </p>
        <p>
          Official website:{" "}
          <a
            href="https://www.moes.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-plum-700 underline underline-offset-4"
          >
            moes.gov.in
          </a>
        </p>
      </section>
      <section>
        <h2>Grievance redressal</h2>
        <p>
          Public grievances may be lodged on the Government of India&rsquo;s Centralised Public Grievance Redress
          and Monitoring System (CPGRAMS):{" "}
          <a
            href="https://pgportal.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-plum-700 underline underline-offset-4"
          >
            pgportal.gov.in
          </a>
          . Accessibility barriers can also be reported through the training cell so we can prioritise a fix.
        </p>
      </section>
    </LegalPage>
  );
}
