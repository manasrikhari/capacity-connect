import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KnowledgeIngestForm } from "@/components/knowledge/KnowledgeIngestForm";
import { hasFirecrawlKey } from "@/lib/firecrawl";
import { getSession } from "@/lib/session";

/** Model calls run inside the request, so give it room. */
export const maxDuration = 120;

export default async function ImportKnowledgePage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/platform/graph"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="size-4" />
        Knowledge graph
      </Link>
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Import knowledge</h1>
        <p className="mt-1 text-sm text-ink-500">
          Upload a PDF or paste a link and the concepts inside it are drafted for your review.
          Anything you save here is national, so every course can cite it.
        </p>
      </div>
      <KnowledgeIngestForm linkEnabled={hasFirecrawlKey()} />
    </div>
  );
}
