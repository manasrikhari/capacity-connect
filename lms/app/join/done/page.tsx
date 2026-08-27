import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function JoinDonePage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  if (!batch) redirect("/join");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">You&apos;re in!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Request sent — {batch}. Your teacher will approve you shortly.
        </p>
        <a href="/student" className={buttonClasses("primary", "md", "mt-6 inline-flex")}>
          Go to my batches
        </a>
      </Card>
    </main>
  );
}
