"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createMeeting, updateMeeting } from "@/app/admin/meetings/actions";
import type { Meeting } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";
import { toDatetimeLocalValue } from "@/lib/utils";

export function MeetingFormModal({
  open,
  onClose,
  meeting,
}: {
  open: boolean;
  onClose: () => void;
  meeting?: Meeting | null;
}) {
  const action = meeting ? updateMeeting.bind(null, meeting.id) : createMeeting;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(meeting ? "Class updated" : "Class scheduled");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open={open} onClose={onClose} title={meeting ? "Edit class" : "Schedule class"}>
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
          <Input id="title" name="title" defaultValue={meeting?.title} placeholder="e.g. Algebra Revision" />
        </FormField>
        <FormField
          label="Description (optional)"
          htmlFor="description"
          error={state?.fieldErrors?.description?.[0]}
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={meeting?.description ?? ""}
            placeholder="What will this session cover?"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date & time" htmlFor="date" error={state?.fieldErrors?.date?.[0]}>
            <Input
              id="date"
              name="date"
              type="datetime-local"
              defaultValue={meeting ? toDatetimeLocalValue(meeting.date) : ""}
            />
          </FormField>
          <FormField
            label="Duration (minutes)"
            htmlFor="durationMins"
            error={state?.fieldErrors?.durationMins?.[0]}
          >
            <Input
              id="durationMins"
              name="durationMins"
              type="number"
              min={15}
              max={480}
              step={5}
              defaultValue={meeting?.durationMins ?? 60}
              placeholder="60"
            />
          </FormField>
        </div>
        <FormField label="Class link (optional)" htmlFor="link" error={state?.fieldErrors?.link?.[0]}>
          <Input
            id="link"
            name="link"
            type="url"
            defaultValue={meeting?.link}
            placeholder="https://meet.google.com/..."
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {meeting ? "Save changes" : "Schedule class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
