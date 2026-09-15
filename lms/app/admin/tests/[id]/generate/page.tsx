import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GenerateQuestionsForm } from "@/components/admin/GenerateQuestionsForm";
import { Card } from "@/components/ui/Card";
import { getActiveBatch } from "@/lib/batch";
import { hasLlmKey } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function GenerateQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const { id } = await params;

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test || test.batchId !== batch.id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/tests/${id}`}
        className="inline-flex items-center gap-1 text-sm text-plum-700 hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to test
      </Link>

      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Generate questions with AI</h1>
        <p className="mt-1 text-sm text-ink-500">
          Draft multiple-choice questions for <span className="text-ink-700">{test.title}</span>, review and
          edit them, then add the ones you want.
        </p>
      </div>

      {!hasLlmKey() && (
        <Card className="border-status-partial/30 bg-status-partial/5">
          <p className="text-sm text-ink-700">
            No AI model key is configured, so questions are drawn from the built-in offline question bank. You
            can still review and edit them before adding.
          </p>
        </Card>
      )}

      <GenerateQuestionsForm testId={id} />
    </div>
  );
}
