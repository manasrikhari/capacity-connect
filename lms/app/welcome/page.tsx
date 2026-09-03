import { BookOpen, GraduationCap, Grape } from "lucide-react";
import { redirect } from "next/navigation";
import { createBatchIntentAction, joinBatchIntentAction } from "@/app/welcome/actions";
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
        <h1 className="text-xl font-medium text-ink-900">Welcome to Capacity Connect</h1>
        <p className="mt-2 text-sm text-ink-500">
          Choose how you&apos;d like to get started — it only takes a second.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <form action={createBatchIntentAction}>
            <button
              type="submit"
              className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-hair bg-paper p-5 text-center transition-[background-color,border-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
            >
              <span className="flex size-11 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
                <GraduationCap className="size-6" />
              </span>
              <span className="text-sm font-semibold text-ink-900">I&apos;m a trainer</span>
              <span className="text-xs text-ink-500">Create a course and invite trainees</span>
            </button>
          </form>
          <form action={joinBatchIntentAction}>
            <button
              type="submit"
              className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-hair bg-paper p-5 text-center transition-[background-color,border-color,scale] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
            >
              <span className="flex size-11 items-center justify-center rounded-[10px] bg-plum-100 text-plum-600">
                <BookOpen className="size-6" />
              </span>
              <span className="text-sm font-semibold text-ink-900">I&apos;m a trainee</span>
              <span className="text-xs text-ink-500">Join with a course code from your trainer</span>
            </button>
          </form>
        </div>
      </Card>
    </main>
  );
}
