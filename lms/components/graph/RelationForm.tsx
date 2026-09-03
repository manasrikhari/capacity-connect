"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createRelationAction } from "@/app/platform/graph/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { initialActionState } from "@/lib/action-state";
import { RELATION_TYPES } from "@/lib/taxonomy";
import { Share2 } from "lucide-react";

export type NodeOption = { id: string; name: string };

export function RelationForm({ nodes }: { nodes: NodeOption[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createRelationAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Relation added — MeghDoot will pick it up");
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (nodes.length < 2) {
    return (
      <EmptyState
        icon={Share2}
        title="Add two nodes first"
        description="A relation connects a source node to a target node."
      />
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Source" htmlFor="rel-source" error={state?.fieldErrors?.sourceId?.[0]}>
          <Select id="rel-source" name="sourceId" defaultValue="">
            <option value="" disabled>
              Pick a node…
            </option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Target" htmlFor="rel-target" error={state?.fieldErrors?.targetId?.[0]}>
          <Select id="rel-target" name="targetId" defaultValue="">
            <option value="" disabled>
              Pick a node…
            </option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Relation" htmlFor="rel-type" error={state?.fieldErrors?.relationType?.[0]}>
          <Select id="rel-type" name="relationType" defaultValue={RELATION_TYPES[0]}>
            {RELATION_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Weight (0.1–5)" htmlFor="rel-weight" error={state?.fieldErrors?.weight?.[0]}>
          <Input id="rel-weight" name="weight" type="number" step="0.1" min="0.1" max="5" defaultValue="1" />
        </FormField>
      </div>

      {state?.error && (
        <p className="text-sm text-status-unpaid" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Add relation
        </Button>
      </div>
    </form>
  );
}
