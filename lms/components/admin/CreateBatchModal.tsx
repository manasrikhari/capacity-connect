"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createBatchAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";

export function CreateBatchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createBatchAction,
    initialActionState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (open) formRef.current?.reset();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Create a new batch">
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Batch name" htmlFor="batch-name">
          <Input
            id="batch-name"
            name="name"
            placeholder='e.g. "11th-A"'
            required
            autoFocus
          />
        </FormField>
        <FormField label="Subject" htmlFor="batch-subject">
          <Input
            id="batch-subject"
            name="subject"
            placeholder='e.g. "Chemistry"'
          />
        </FormField>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Create batch
          </Button>
        </div>
      </form>
    </Modal>
  );
}
