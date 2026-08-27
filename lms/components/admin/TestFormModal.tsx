"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createTest, updateTest } from "@/app/admin/tests/actions";
import type { Test } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { initialActionState } from "@/lib/action-state";

export function TestFormModal({
  open,
  onClose,
  test,
}: {
  open: boolean;
  onClose: () => void;
  test?: Test | null;
}) {
  const action = test ? updateTest.bind(null, test.id) : createTest;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Test updated");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open={open} onClose={onClose} title={test ? "Edit test" : "Create test"}>
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
          <Input id="title" name="title" defaultValue={test?.title} placeholder="e.g. Algebra Basics Quiz" />
        </FormField>
        <FormField label="Subject" htmlFor="subject" error={state?.fieldErrors?.subject?.[0]}>
          <Input id="subject" name="subject" defaultValue={test?.subject} placeholder="e.g. Mathematics" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {test ? "Save changes" : "Create test"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
