import { Grape } from "lucide-react";
import { redirect } from "next/navigation";
import { createBatchIntentAction, joinBatchIntentAction } from "@/app/welcome/actions";
import { Button } from "@/components/ui/Button";
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

  // TEMP DEBUG — remove once the new-user redirect path is confirmed.
  console.log(
    "[onboarding-debug] app/welcome/page.tsx: userId=%s role=%s onboarded=%s",
    session.user.id,
    session.user.role,
    dbUser?.onboarded
  );

  if (dbUser?.onboarded) {
    console.log("[onboarding-debug] app/welcome/page.tsx: already onboarded -> redirect /");
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <Grape className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Welcome to OpenGrapes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose how you&apos;d like to get started — it only takes a second.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <form action={createBatchIntentAction}>
            <Button type="submit" size="lg" className="w-full">
              I'm a Teacher
            </Button>
          </form>
          <form action={joinBatchIntentAction}>
            <Button type="submit" variant="secondary" size="lg" className="w-full">
              I'm a Student
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}
