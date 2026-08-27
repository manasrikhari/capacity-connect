import { Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function FeesOverviewPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-100">
        <Wallet className="size-8 text-violet-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-800">Fees Overview</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        A cross-batch fees dashboard is coming soon. For now, manage fees inside
        each batch.
      </p>
    </div>
  );
}
