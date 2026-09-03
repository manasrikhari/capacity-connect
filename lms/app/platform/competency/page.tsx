import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Target } from "lucide-react";
import {
  TrainerRankingTable,
  type RankedTrainerView,
} from "@/components/competency/TrainerRankingTable";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rankTrainersForBatch } from "@/lib/competency-db";
import { cn } from "@/lib/utils";

export default async function PlatformCompetencyPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const { batchId } = await searchParams;

  const courses = await prisma.batch.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, subject: true, teacherId: true },
    orderBy: { name: "asc" },
  });

  const selectedId = batchId && courses.some((c) => c.id === batchId) ? batchId : courses[0]?.id;
  const selected = courses.find((c) => c.id === selectedId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Competency mapping</h1>
        <p className="mt-1 text-sm text-ink-500">
          Rank approved trainers against a course&apos;s required competencies and assign the best fit.
        </p>
      </header>

      {courses.length === 0 ? (
        <EmptyState icon={Target} title="No active courses" description="Create a course to map trainers to it." />
      ) : (
        <>
          {/* Course picker */}
          <div className="mb-6 flex flex-wrap gap-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/platform/competency?batchId=${c.id}`}
                className={cn(
                  "rounded-[10px] border px-3 py-2 text-sm transition-colors",
                  c.id === selectedId
                    ? "border-plum-300 bg-plum-50 font-semibold text-plum-700"
                    : "border-hair bg-paper text-ink-500 hover:bg-plum-50",
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {selected && <CompetencyRanking batchId={selected.id} teacherId={selected.teacherId} />}
        </>
      )}
    </div>
  );
}

async function CompetencyRanking({ batchId, teacherId }: { batchId: string; teacherId: string }) {
  const { requirements, ranked } = await rankTrainersForBatch(batchId);

  const view: RankedTrainerView[] = ranked.map((t) => ({
    trainerId: t.trainerId,
    name: t.name,
    email: t.email,
    designation: t.designation,
    department: t.department,
    matchScore: t.matchScore,
    isQualified: t.isQualified,
    missingMandatoryCount: t.missingMandatoryCount,
    isCurrentTrainer: t.trainerId === teacherId,
    skillBreakdown: t.skillBreakdown,
  }));

  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle>Trainer ranking</CardTitle>
        <p className="mt-1 text-sm text-ink-500">
          {requirements.length} required competenc{requirements.length === 1 ? "y" : "ies"} · weighted match score out of 100
        </p>
      </CardHeader>
      <div className="mt-4">
        <TrainerRankingTable batchId={batchId} ranked={view} />
      </div>
    </Card>
  );
}
