import { redirect } from "next/navigation";
import { SkillsManager } from "@/components/competency/SkillsManager";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PlatformSkillsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Competency taxonomy</h1>
        <p className="mt-1 text-sm text-ink-500">
          The national skills catalogue used for course requirements, trainer matching, and the knowledge graph.
        </p>
      </header>
      <SkillsManager
        skills={skills.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
        }))}
      />
    </div>
  );
}
