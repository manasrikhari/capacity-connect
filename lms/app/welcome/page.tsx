import { BookOpen, Grape } from "lucide-react";
import { redirect } from "next/navigation";
import { joinBatchIntentAction } from "@/app/welcome/actions";
import { TrainerRequestCard } from "@/components/welcome/TrainerRequestCard";
import { Card } from "@/components/ui/Card";
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
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-plum-100 text-plum-600">
          <Grape className="size-7" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
          Step 1 of 2
        </p>
        <h1 className="mt-2 text-xl font-medium text-ink-900">How will you use Capacity Connect?</h1>
        <p className="mt-2 text-sm text-ink-500">
          This decides what you see. You can request trainer access later from your profile.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <TrainerRequestCard />
          <form action={joinBatchIntentAction}>
            <button
              type="submit"
              className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-hair bg-paper p-5 text-center transition-[background-color,border-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
            >
              <span className="flex size-11 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
                <BookOpen className="size-6" />
              </span>
              <span className="text-sm font-semibold text-ink-900">I&apos;m a trainee</span>
              <span className="text-xs text-ink-500">Take courses, earn certificates</span>
            </button>
          </form>
        </div>
      </Card>
    </main>
  );
}
