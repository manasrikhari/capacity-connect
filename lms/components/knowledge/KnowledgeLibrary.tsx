"use client";

import { ChevronDown, ChevronUp, ExternalLink, FileText, Library, Link2, Radio, Trash2, Type } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { removeKnowledgeSourceAction } from "@/app/actions/knowledge-extractor";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export type KnowledgeSourceRow = {
  /** "built-in" for the concepts that ship with the platform. */
  id: string;
  title: string;
  kind: "PDF" | "LINK" | "TEXT" | "LIVE_CLASS" | "BUILT_IN";
  url: string | null;
  createdAt: string | null;
  conceptCount: number;
  scope: "national" | "course";
  addedBy: string | null;
  /** A sample of what this source taught, shown when the row is expanded. */
  concepts: string[];
};

const KIND = {
  PDF: { icon: FileText, label: "PDF" },
  LINK: { icon: Link2, label: "Link" },
  TEXT: { icon: Type, label: "Text" },
  LIVE_CLASS: { icon: Radio, label: "Live class" },
  BUILT_IN: { icon: Library, label: "Built in" },
} as const;

/**
 * What the knowledge base is made of, listed as documents rather than graph
 * nodes. Expanding a row shows the concepts it contributed, so staff can see
 * what MeghDoot actually knows without ever meeting a node or an edge.
 */
export function KnowledgeLibrary({ sources }: { sources: KnowledgeSourceRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalConcepts = sources.reduce((sum, s) => sum + s.conceptCount, 0);

  function remove(row: KnowledgeSourceRow) {
    if (
      !confirm(
        `Remove "${row.title}"? The ${row.conceptCount} concept${row.conceptCount === 1 ? "" : "s"} it added will be deleted.`,
      )
    ) {
      return;
    }
    setPendingId(row.id);
    startTransition(async () => {
      const res = await removeKnowledgeSourceAction(row.id);
      setPendingId(null);
      if (res?.error) toast.error(res.error);
      else toast.success("Removed from the knowledge base");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What MeghDoot knows</CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {totalConcepts} concepts · {sources.length} source{sources.length === 1 ? "" : "s"}
        </span>
      </CardHeader>

      {sources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing added yet"
          description="Upload a PDF or paste a link above and it will appear here."
        />
      ) : (
        <ul className="divide-y divide-hair">
          {sources.map((row) => {
            const kind = KIND[row.kind];
            const Icon = kind.icon;
            const isOpen = openId === row.id;
            const removable = row.kind !== "BUILT_IN";
            return (
              <li key={row.id} className="py-3">
                <div className="flex items-center gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-ink-500">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-900">{row.title}</p>
                      <Badge color="slate">{kind.label}</Badge>
                      {row.scope === "national" && row.kind !== "BUILT_IN" && (
                        <Badge color="violet">National</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {row.conceptCount} concept{row.conceptCount === 1 ? "" : "s"}
                      {row.createdAt ? ` · ${formatDate(row.createdAt)}` : ""}
                      {row.addedBy ? ` · ${row.addedBy}` : ""}
                    </p>
                  </div>

                  {row.conceptCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : row.id)}
                      aria-label={isOpen ? `Hide concepts in ${row.title}` : `Show concepts in ${row.title}`}
                      className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
                    >
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  )}
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
                      aria-label={`Open ${row.title}`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  {removable && (
                    <button
                      type="button"
                      disabled={pendingId === row.id}
                      onClick={() => remove(row)}
                      aria-label={`Remove ${row.title}`}
                      className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-13">
                    {row.concepts.map((c) => (
                      <span
                        key={c}
                        className="rounded-[6px] bg-sunken px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500"
                      >
                        {c}
                      </span>
                    ))}
                    {row.conceptCount > row.concepts.length && (
                      <span className="px-1 text-[11px] text-ink-300">
                        +{row.conceptCount - row.concepts.length} more
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
