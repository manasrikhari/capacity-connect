import { redirect } from "next/navigation";
import { GraphTable } from "@/components/graph/GraphTable";
import { NodeForm } from "@/components/graph/NodeForm";
import { RelationForm } from "@/components/graph/RelationForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PlatformGraphPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const [nodes, relations] = await Promise.all([
    prisma.knowledgeNode.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, category: true, description: true },
    }),
    prisma.knowledgeRelation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        relationType: true,
        weight: true,
        source: { select: { name: true } },
        target: { select: { name: true } },
      },
    }),
  ]);

  const nodeOptions = nodes.map((n) => ({ id: n.id, name: n.name }));
  const relationRows = relations.map((r) => ({
    id: r.id,
    sourceName: r.source.name,
    targetName: r.target.name,
    relationType: r.relationType,
    weight: r.weight,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Knowledge graph</h1>
        <p className="mt-1 text-sm text-ink-500">
          Curate the GraphRAG knowledge base. Every change is picked up by MeghDoot immediately.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add node</CardTitle>
          </CardHeader>
          <NodeForm />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add relation</CardTitle>
          </CardHeader>
          <RelationForm nodes={nodeOptions} />
        </Card>
      </div>

      <GraphTable nodes={nodes} relations={relationRows} />
    </div>
  );
}
