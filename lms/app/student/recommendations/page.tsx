import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";
import {
  RecommendationCard,
  type RecommendationView,
} from "@/components/recommendations/RecommendationCard";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRecommendationsForTrainee } from "@/lib/recommender-db";

export default async function RecommendationsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const recs = await getRecommendationsForTrainee(session.user.id, 6);

  // Enrich with course metadata the recommender core doesn't carry.
  const batches = await prisma.batch.findMany({
    where: { id: { in: recs.map((r) => r.batchId) } },
    select: { id: true, grade: true, wmoTier: true, teacher: { select: { name: true } } },
  });
  const meta = new Map(batches.map((b) => [b.id, b]));

  const views: RecommendationView[] = recs.map((r) => ({
    batchId: r.batchId,
    name: r.name,
    domain: r.domain,
    level: meta.get(r.batchId)?.grade ?? null,
    wmoTier: meta.get(r.batchId)?.wmoTier ?? null,
    trainerName: meta.get(r.batchId)?.teacher.name ?? null,
    score: r.score,
    reasons: r.reasons,
    enrollmentStatus: r.enrollmentStatus,
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Recommended for you</h1>
        <p className="mt-1 text-sm text-ink-500">
          Courses matched to your skill gaps, assessment history, and posting — each with a transparent reason.
        </p>
      </header>

      {views.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="You're enrolled in the courses that fit you best. Check back as new courses open."
        />
      ) : (
        <div className="grid gap-4">
          {views.map((v) => (
            <RecommendationCard key={v.batchId} rec={v} />
          ))}
        </div>
      )}
    </div>
  );
}
