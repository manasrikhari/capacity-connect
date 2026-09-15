import { Grape } from "lucide-react";
import { redirect } from "next/navigation";
import { OnboardingChoice } from "@/components/welcome/OnboardingChoice";
import { Card } from "@/components/ui/Card";
import { GovBanner } from "@/components/layout/GovBanner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WelcomePage() {
  const session = await auth();
  if (!session) redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  });

  if (dbUser?.onboarded) {
    redirect("/");
  }

  return (
    <>
      <GovBanner />
      <main
        id="main-content"
        className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12"
      >
      <Card className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
          <Grape className="size-7" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-plum-600">
          Step 1 of 2
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
          How will you use Capacity Connect?
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          This decides what you see. You can request trainer access later from your profile.
        </p>

        <OnboardingChoice />
      </Card>
      </main>
    </>
  );
}
