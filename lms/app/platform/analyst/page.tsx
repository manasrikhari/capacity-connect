import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Analyst } from "@/components/platform/Analyst";
import { auth } from "@/lib/auth";
import { getCapacityMetrics } from "@/lib/metrics-db";

export const metadata: Metadata = {
  title: "Analyst — Capacity Connect",
};

export default async function AnalystPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const metrics = await getCapacityMetrics();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Analyst</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-500">
          Ask about the national training position and get the relevant figures back. Every number
          shown is computed from the record — the assistant chooses what to show and explains it, it
          never estimates.
        </p>
      </div>

      <Analyst initialMetrics={metrics} />
    </div>
  );
}
