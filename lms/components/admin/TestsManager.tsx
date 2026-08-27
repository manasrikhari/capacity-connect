"use client";

import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteTest, toggleTestActive } from "@/app/admin/tests/actions";
import type { Prisma } from "@/app/generated/prisma/client";
import { TestFormModal } from "@/components/admin/TestFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type TestWithCounts = Prisma.TestGetPayload<{
  include: { _count: { select: { questions: true; attempts: true } } };
}>;

export function TestsManager({ tests }: { tests: TestWithCounts[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleToggle(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await toggleTestActive(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Test status updated");
      setPendingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this test and all its questions/attempts? This cannot be undone.")) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteTest(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Test deleted");
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tests</h1>
          <p className="mt-1 text-sm text-slate-500">Create MCQ tests and review student results.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Create test
        </Button>
      </div>

      {tests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tests yet"
          description="Create your first MCQ test for students."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Create test
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const isPending = pending && pendingId === test.id;
            return (
              <Card key={test.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-800">{test.title}</h3>
                    <Badge color={test.isActive ? "green" : "slate"}>
                      {test.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Badge color="violet" className="mt-2">
                    {test.subject}
                  </Badge>
                  <p className="mt-3 text-sm text-slate-500">
                    {test._count.questions} question{test._count.questions === 1 ? "" : "s"} ·{" "}
                    {test._count.attempts} attempt{test._count.attempts === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/tests/${test.id}`} className={buttonClasses("ghost", "sm")}>
                    <Pencil className="size-3.5" /> Manage
                  </Link>
                  <Link href={`/admin/tests/${test.id}/results`} className={buttonClasses("secondary", "sm")}>
                    Results
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={isPending}
                    onClick={() => handleToggle(test.id)}
                  >
                    {test.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" loading={isPending} onClick={() => handleDelete(test.id)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TestFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
