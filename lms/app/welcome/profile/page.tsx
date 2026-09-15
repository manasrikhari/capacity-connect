import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/welcome/OnboardingForm";
import { Card } from "@/components/ui/Card";
import { GovBanner } from "@/components/layout/GovBanner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true, name: true },
  });
  if (user?.onboarded) redirect("/");

  const firstName = (user?.name ?? "").split(" ")[0];

  return (
    <>
      <GovBanner />
      <main
        id="main-content"
        className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-12"
      >
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-plum-600">
            Step 2 of 2
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink-900">
            {firstName ? `A little about your work, ${firstName}` : "A little about your work"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            So we can suggest the right courses and check which you are eligible for. All of it is
            optional and you can change it later.
          </p>
        </div>

        <Card>
          <OnboardingForm />
        </Card>
      </div>
      </main>
    </>
  );
}
