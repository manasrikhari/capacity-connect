"use client";

import { Network, Share2, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteNodeAction, deleteRelationAction } from "@/app/platform/graph/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";

export type GraphNodeRow = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
};

export type GraphRelationRow = {
  id: string;
  sourceName: string;
  targetName: string;
  relationType: string;
  weight: number;
};

const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

export function GraphTable({
  nodes,
  relations,
}: {
  nodes: GraphNodeRow[];
  relations: GraphRelationRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const types = useMemo(() => [...new Set(nodes.map((n) => n.type))].sort(), [nodes]);
  const categories = useMemo(
    () => [...new Set(nodes.map((n) => n.category).filter((c): c is string => Boolean(c)))].sort(),
    [nodes],
  );

  const filteredNodes = nodes.filter(
    (n) =>
      (!typeFilter || n.type === typeFilter) &&
      (!categoryFilter || n.category === categoryFilter),
  );

  function run(fn: () => Promise<{ success?: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Nodes ({filteredNodes.length}
            {filteredNodes.length !== nodes.length ? ` of ${nodes.length}` : ""})
          </CardTitle>
          <div className="flex gap-2">
            <Select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-auto text-xs"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-auto text-xs"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        {filteredNodes.length === 0 ? (
          <EmptyState icon={Network} title="No nodes" description="Add a node to start building the graph." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Name</th>
                  <th className="py-2 pr-4 font-normal">Type</th>
                  <th className="py-2 pr-4 font-normal">Category</th>
                  <th className="py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {filteredNodes.map((n) => (
                  <tr key={n.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink-900">{n.name}</p>
                      {n.description && (
                        <p className="max-w-md truncate text-xs text-ink-500">{n.description}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color="violet">{n.type}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-ink-700">{n.category ?? "—"}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label={`Delete ${n.name}`}
                        onClick={() => {
                          if (confirm(`Delete “${n.name}” and its relations?`)) {
                            run(() => deleteNodeAction(n.id), "Node deleted");
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-status-unpaid" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relations ({relations.length})</CardTitle>
        </CardHeader>
        {relations.length === 0 ? (
          <EmptyState icon={Share2} title="No relations" description="Connect two nodes to add a relation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Source</th>
                  <th className="py-2 pr-4 font-normal">Relation</th>
                  <th className="py-2 pr-4 font-normal">Target</th>
                  <th className="py-2 pr-4 text-right font-normal">Weight</th>
                  <th className="py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {relations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-medium text-ink-900">{r.sourceName}</td>
                    <td className="py-3 pr-4">
                      <Badge color="slate">{r.relationType}</Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium text-ink-900">{r.targetName}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-700">{r.weight}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label="Delete relation"
                        onClick={() => run(() => deleteRelationAction(r.id), "Relation deleted")}
                      >
                        <Trash2 className="size-4 text-status-unpaid" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
