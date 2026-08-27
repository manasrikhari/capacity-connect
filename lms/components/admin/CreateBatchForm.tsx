"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { createBatchAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";

export function CreateBatchForm() {
  const [state, formAction, pending] = useActionState(createBatchAction, initialActionState);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success("Batch created");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex-1">
        <Input name="name" placeholder="Batch name, e.g. 11th-A" required />
      </div>
      <div className="w-32">
        <Input name="grade" placeholder="Grade" />
      </div>
      <Button type="submit" loading={pending}>
        Create batch
      </Button>
    </form>
  );
}
