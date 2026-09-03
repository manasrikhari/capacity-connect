"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createNodeAction } from "@/app/platform/graph/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { NODE_TYPES } from "@/lib/taxonomy";

export function NodeForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createNodeAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Node added — MeghDoot will pick it up");
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormField label="Name" htmlFor="node-name" error={state?.fieldErrors?.name?.[0]}>
        <Input id="node-name" name="name" placeholder="e.g. Hail Detection" required />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" htmlFor="node-type" error={state?.fieldErrors?.type?.[0]}>
          <Select id="node-type" name="type" defaultValue={NODE_TYPES[0]}>
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Category" htmlFor="node-category" error={state?.fieldErrors?.category?.[0]}>
          <Input id="node-category" name="category" placeholder="e.g. Radar & Telemetry" />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="node-description" error={state?.fieldErrors?.description?.[0]}>
        <Textarea
          id="node-description"
          name="description"
          placeholder="What this concept, instrument, or hazard is…"
          className="min-h-20"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Source (optional)" htmlFor="node-source" error={state?.fieldErrors?.source?.[0]}>
          <Input id="node-source" name="source" placeholder="e.g. WMO-No. 8" />
        </FormField>
        <FormField label="Equation (optional)" htmlFor="node-equation" error={state?.fieldErrors?.equation?.[0]}>
          <Input id="node-equation" name="equation" placeholder="e.g. Z = a·Rᵇ" />
        </FormField>
      </div>

      <FormField label="Aliases (comma-separated)" htmlFor="node-aliases" error={state?.fieldErrors?.aliases?.[0]}>
        <Input id="node-aliases" name="aliases" placeholder="hailstorm, hail nowcast" />
      </FormField>

      {state?.error && (
        <p className="text-sm text-status-unpaid" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Add node
        </Button>
      </div>
    </form>
  );
}
