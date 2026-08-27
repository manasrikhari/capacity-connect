"use client";

import { Link2, NotebookText, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteNote } from "@/app/admin/notes/actions";
import type { Note } from "@/app/generated/prisma/client";
import { NoteFormModal } from "@/components/admin/NoteFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface NoteDisplay {
  id: string;
  title: string;
  subject: string;
  content: string;
  fileUrl: string | null;
  updatedAt: Date | string;
  isExported?: boolean;
}

export function NotesManager({ notes }: { notes: NoteDisplay[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(note: any) {
    setEditing(note);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteNote(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Note deleted");
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notes</h1>
          <p className="mt-1 text-sm text-slate-500">Share study material with your students.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title="No notes yet"
          description="Add your first note for students to browse."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add note
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const isPending = pending && pendingId === note.id;
            return (
              <Card key={note.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-800 truncate max-w-[200px]" title={note.title}>
                      {note.title}
                    </h3>
                    <Badge color="violet">{note.subject}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-500">{note.content}</p>
                  {note.fileUrl && (
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
                    >
                      <Link2 className="size-3" />
                      Attachment
                    </a>
                  )}
                  <p className="mt-2 text-xs text-slate-400">Updated {formatDate(note.updatedAt)}</p>
                </div>
                {!note.isExported && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(note as Note)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="danger" loading={isPending} onClick={() => handleDelete(note.id)}>
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <NoteFormModal key={editing?.id ?? "create"} open={modalOpen} onClose={() => setModalOpen(false)} note={editing} />
    </div>
  );
}
