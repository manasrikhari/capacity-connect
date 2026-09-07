import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { PublicFeedbackForm } from "@/components/feedback/PublicFeedbackForm";

export const metadata: Metadata = {
  title: "Feedback — Capacity Connect",
  description: "Share feedback, a suggestion, an accessibility barrier or a grievance with the training cell.",
};

export default function FeedbackPage() {
  return (
    <LegalPage
      title="Feedback"
      intro={
        <p>
          Tell us what is working and what is not. Use this form for general feedback, a suggestion, an
          accessibility barrier, or a grievance. For formal public grievances you may also use{" "}
          <a
            href="https://pgportal.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-plum-700 underline underline-offset-4"
          >
            CPGRAMS
          </a>
          .
        </p>
      }
    >
      <section>
        <PublicFeedbackForm />
      </section>
    </LegalPage>
  );
}
