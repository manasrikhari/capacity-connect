"use client";

import { Megaphone, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { createNotice, deleteNotice } from "@/app/admin/notices/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldError, Textarea } from "@/components/ui/Field";
import { TeacherHand } from "@/components/ui/TeacherHand";
import { initialActionState } from "@/lib/action-state";
import { formatDateTime } from "@/lib/utils";

type NoticeItem = { id: string; text: string; createdAt: Date | string };

export function NoticesManager({ notices }: { notices: NoticeItem[] }) {
  const [state, formAction, pending] = useActionState(createNotice, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Notice posted");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleDelete(id: string) {
    if (!confirm("Delete this notice? Students will no longer see it.")) return;
    setDeletingId(id);
    startDelete(async () => {
      const result = await deleteNotice(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Notice deleted");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Notices</h1>
        <p className="mt-1 text-sm text-ink-500">
          Post short announcements — students read them in your hand on their dashboard.
        </p>
      </div>

      <Card>
        <form ref={formRef} action={formAction} className="space-y-3">
          <Textarea
            name="text"
            aria-label="New notice"
            placeholder="Write a notice for your batch…"
            className="min-h-24"
          />
          <FieldError>{state?.fieldErrors?.text?.[0]}</FieldError>
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              Post notice
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="border-b border-hair-strong pb-2 font-sans text-sm font-semibold text-ink-900">
          Posted notices
        </h2>
        {notices.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Megaphone}
              title="No notices yet"
              description="Post your first announcement above — it lands on every student's dashboard."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {notices.map((notice) => (
              <li key={notice.id}>
                <Card className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                      {formatDateTime(notice.createdAt)}
                    </p>
                    <div className="mt-1.5">
                      <TeacherHand>{notice.text}</TeacherHand>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleting && deletingId === notice.id}
                    onClick={() => handleDelete(notice.id)}
                    aria-label="Delete notice"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
