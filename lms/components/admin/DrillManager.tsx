"use client";

import { CloudLightning, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { createWeatherCase, deleteWeatherCase } from "@/app/admin/drill/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { initialActionState } from "@/lib/action-state";
import { IMD_COLOURS } from "@/lib/forecast-verification";

const COLOUR_LABEL: Record<string, string> = {
  GREEN: "Green — no warning",
  YELLOW: "Yellow — be aware",
  ORANGE: "Orange — be prepared",
  RED: "Red — take action",
};

type CaseItem = {
  id: string;
  title: string;
  hazard: string | null;
  region: string | null;
  correctColour: string;
  attemptCount: number;
};

export function DrillManager({ cases }: { cases: CaseItem[] }) {
  const [state, formAction, pending] = useActionState(createWeatherCase, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Weather case published");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleDelete(id: string) {
    if (!confirm("Delete this case? Trainee attempts on it are removed too.")) return;
    setDeletingId(id);
    startDelete(async () => {
      const result = await deleteWeatherCase(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Case deleted");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink-900">
          <CloudLightning className="size-6 text-plum-600" />
          Forecast drill cases
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Publish weather situations for your trainees. They issue an IMD colour-coded warning; the
          platform scores it against the verifying colour you set.
        </p>
      </div>

      <Card>
        <form ref={formRef} action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="wc-title">Title</Label>
            <Input id="wc-title" name="title" placeholder="e.g. Deep depression off the Odisha coast" />
            <FieldError>{state?.fieldErrors?.title?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="wc-desc">Situation</Label>
            <Textarea
              id="wc-desc"
              name="description"
              className="min-h-24"
              placeholder="Describe the observations, model guidance and impacts the trainee must weigh…"
            />
            <FieldError>{state?.fieldErrors?.description?.[0]}</FieldError>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="wc-hazard">Hazard</Label>
              <Input id="wc-hazard" name="hazard" placeholder="Cyclone" />
              <FieldError>{state?.fieldErrors?.hazard?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="wc-region">Region</Label>
              <Input id="wc-region" name="region" placeholder="Bay of Bengal" />
              <FieldError>{state?.fieldErrors?.region?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="wc-colour">Verifying colour</Label>
              <Select id="wc-colour" name="correctColour" defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {(IMD_COLOURS as readonly string[]).map((c) => (
                  <option key={c} value={c}>
                    {COLOUR_LABEL[c]}
                  </option>
                ))}
              </Select>
              <FieldError>{state?.fieldErrors?.correctColour?.[0]}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="wc-image">Chart image URL (optional)</Label>
            <Input id="wc-image" name="imageUrl" placeholder="https://…" />
            <FieldError>{state?.fieldErrors?.imageUrl?.[0]}</FieldError>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              Publish case
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Published cases
        </h2>
        {cases.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CloudLightning}
              title="No drill cases yet"
              description="Publish your first case above — it appears in your trainees' forecast drill."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {cases.map((c) => (
              <li key={c.id}>
                <Card className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink-900">{c.title}</p>
                      <Badge color="slate">{c.correctColour}</Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                      {[c.hazard, c.region].filter(Boolean).join(" · ") || "—"} · {c.attemptCount}{" "}
                      {c.attemptCount === 1 ? "attempt" : "attempts"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleting && deletingId === c.id}
                    onClick={() => handleDelete(c.id)}
                    aria-label="Delete case"
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
