"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  saveKnowledgeProposalAction,
  type SaveKnowledgeState,
} from "@/app/actions/knowledge-extractor";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { NODE_TYPES, RELATION_TYPES } from "@/lib/taxonomy";
import type { ProposedNode, ProposedRelation } from "@/lib/validations/knowledge-extract";

export type Proposal = {
  nodes: ProposedNode[];
  relations: ProposedRelation[];
  source: "llm" | "heuristic";
  warnings: string[];
  sourceLabel: string;
  scope: "course" | "national";
  kind: "PDF" | "LINK" | "TEXT";
  url?: string | null;
};

const initial: SaveKnowledgeState = null;

/**
 * The review step. Nothing reaches the graph until a human presses save, so
 * every field here is editable and every row can be dropped — the same
 * contract as the AI question generator's preview.
 */
export function ProposedGraphPreview({
  proposal,
  onDone,
}: {
  proposal: Proposal;
  onDone: () => void;
}) {
  const [nodes, setNodes] = useState<ProposedNode[]>(proposal.nodes);
  const [relations, setRelations] = useState<ProposedRelation[]>(proposal.relations);
  const [state, formAction, pending] = useActionState(saveKnowledgeProposalAction, initial);

  useEffect(() => {
    if (state?.success && state.summary) {
      const s = state.summary;
      const bits = [
        `${s.created} new concept${s.created === 1 ? "" : "s"}`,
        s.merged > 0 ? `${s.merged} updated` : null,
        s.reused > 0 ? `${s.reused} already known` : null,
        `${s.relations} link${s.relations === 1 ? "" : "s"}`,
        s.skipped > 0 ? `${s.skipped} skipped` : null,
      ].filter(Boolean);
      toast.success(`Saved: ${bits.join(", ")}`);
      onDone();
    }
    if (state?.error) toast.error(state.error);
  }, [state, onDone]);

  function patchNode(i: number, changes: Partial<ProposedNode>) {
    setNodes((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...changes } : n)));
  }
  function patchRelation(i: number, changes: Partial<ProposedRelation>) {
    setRelations((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...changes } : r)));
  }

  const names = nodes.map((n) => n.name);
  const payload = JSON.stringify({
    scope: proposal.scope,
    sourceLabel: proposal.sourceLabel,
    kind: proposal.kind,
    url: proposal.url ?? "",
    nodes,
    relations: relations.filter(
      (r) => names.includes(r.sourceName) && names.includes(r.targetName),
    ),
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="proposal" value={payload} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-ink-900">Review before saving</h2>
          {proposal.source === "heuristic" && <Badge color="amber">Offline draft</Badge>}
          <Badge color={proposal.scope === "national" ? "violet" : "blue"}>
            {proposal.scope === "national" ? "National" : "This course"}
          </Badge>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {nodes.length} concepts · {relations.length} links
        </span>
      </div>

      <p className="text-sm text-ink-500">
        Source: <span className="text-ink-700">{proposal.sourceLabel}</span>. This becomes the
        citation MeghDoot shows, so keep it recognisable.
      </p>

      {proposal.warnings.length > 0 && (
        <ul className="space-y-1 rounded-[10px] bg-sunken px-4 py-3 text-xs text-ink-500">
          {proposal.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {nodes.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Nothing left to save. Upload a different document to try again.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {nodes.map((n, i) => (
            <Card key={i} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  Concept {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setNodes((p) => p.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${n.name}`}
                  className="rounded-full p-1 text-ink-300 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`name-${i}`}>Name</Label>
                  <Input
                    id={`name-${i}`}
                    value={n.name}
                    onChange={(e) => patchNode(i, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`type-${i}`}>Type</Label>
                  <Select
                    id={`type-${i}`}
                    value={n.type}
                    onChange={(e) => patchNode(i, { type: e.target.value as ProposedNode["type"] })}
                  >
                    {NODE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`desc-${i}`}>Description</Label>
                <Textarea
                  id={`desc-${i}`}
                  value={n.description}
                  maxLength={400}
                  onChange={(e) => patchNode(i, { description: e.target.value })}
                  className="min-h-16"
                />
                <p className="mt-1 font-mono text-[10px] text-ink-300">
                  {n.description.length}/400
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`cat-${i}`}>Category</Label>
                  <Input
                    id={`cat-${i}`}
                    value={n.category}
                    onChange={(e) => patchNode(i, { category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`alias-${i}`}>Aliases (comma separated)</Label>
                  <Input
                    id={`alias-${i}`}
                    value={n.aliases.join(", ")}
                    onChange={(e) =>
                      patchNode(i, {
                        aliases: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 5),
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {relations.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-medium text-ink-900">How they connect</h3>
          {relations.map((r, i) => {
            const dangling = !names.includes(r.sourceName) || !names.includes(r.targetName);
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label={`Link ${i + 1} source`}
                  value={r.sourceName}
                  onChange={(e) => patchRelation(i, { sourceName: e.target.value })}
                  className="w-auto min-w-40 flex-1"
                >
                  {!names.includes(r.sourceName) && (
                    <option value={r.sourceName}>{r.sourceName} (removed)</option>
                  )}
                  {names.map((nm) => (
                    <option key={nm} value={nm}>
                      {nm}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label={`Link ${i + 1} type`}
                  value={r.relationType}
                  onChange={(e) =>
                    patchRelation(i, { relationType: e.target.value as ProposedRelation["relationType"] })
                  }
                  className="w-auto"
                >
                  {RELATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label={`Link ${i + 1} target`}
                  value={r.targetName}
                  onChange={(e) => patchRelation(i, { targetName: e.target.value })}
                  className="w-auto min-w-40 flex-1"
                >
                  {!names.includes(r.targetName) && (
                    <option value={r.targetName}>{r.targetName} (removed)</option>
                  )}
                  {names.map((nm) => (
                    <option key={nm} value={nm}>
                      {nm}
                    </option>
                  ))}
                </Select>
                {dangling && <Badge color="amber">Will be skipped</Badge>}
                <button
                  type="button"
                  onClick={() => setRelations((p) => p.filter((_, idx) => idx !== i))}
                  aria-label={`Remove link ${i + 1}`}
                  className="rounded-full p-1 text-ink-300 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Discard
        </Button>
        <Button type="submit" loading={pending} disabled={nodes.length === 0}>
          Save {nodes.length} concept{nodes.length === 1 ? "" : "s"}
        </Button>
      </div>
    </form>
  );
}
