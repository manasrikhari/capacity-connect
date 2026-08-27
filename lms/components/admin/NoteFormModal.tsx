"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createNote, updateNote } from "@/app/admin/notes/actions";
import type { Note } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";

export function NoteFormModal({
  open,
  onClose,
  note,
}: {
  open: boolean;
  onClose: () => void;
  note?: Note | null;
}) {
  const action = note ? updateNote.bind(null, note.id) : createNote;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(note ? "Note updated" : "Note published");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open={open} onClose={onClose} title={note ? "Edit note" : "Add note"}>
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
          <Input id="title" name="title" defaultValue={note?.title} placeholder="e.g. Quadratic Equations" />
        </FormField>
        <FormField label="Subject" htmlFor="subject" error={state?.fieldErrors?.subject?.[0]}>
          <Input id="subject" name="subject" defaultValue={note?.subject} placeholder="e.g. Mathematics" />
        </FormField>
        <FormField label="Content (markdown supported)" htmlFor="content" error={state?.fieldErrors?.content?.[0]}>
          <Textarea
            id="content"
            name="content"
            defaultValue={note?.content}
            placeholder="Write the note content here..."
            className="min-h-48"
          />
        </FormField>
        <FormField label="Attachment URL (optional)" htmlFor="fileUrl" error={state?.fieldErrors?.fileUrl?.[0]}>
          <Input
            id="fileUrl"
            name="fileUrl"
            type="url"
            defaultValue={note?.fileUrl ?? ""}
            placeholder="https://..."
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {note ? "Save changes" : "Publish note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
