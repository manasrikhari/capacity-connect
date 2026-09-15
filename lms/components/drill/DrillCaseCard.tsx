"use client";

import { useState, useTransition } from "react";
import { Check, X, MapPin } from "lucide-react";
import { submitForecastAction } from "@/app/student/drill/actions";
import { IMD_COLOURS } from "@/lib/forecast-verification";
import { Card } from "@/components/ui/Card";

const COLOUR_STYLE: Record<string, { bg: string; label: string }> = {
  GREEN: { bg: "bg-emerald-500", label: "No warning" },
  YELLOW: { bg: "bg-amber-400", label: "Be aware" },
  ORANGE: { bg: "bg-orange-500", label: "Be prepared" },
  RED: { bg: "bg-red-600", label: "Take action" },
};

export type DrillCaseView = {
  id: string;
  title: string;
  description: string;
  hazard: string | null;
  region: string | null;
  imageUrl: string | null;
  yourForecast: string | null;
};

/**
 * One forecasting case: read the situation, issue an IMD colour-coded warning.
 * The correct answer is never sent to the client — the server scores it and
 * tells you only whether your own call matched.
 */
export function DrillCaseCard({ initial }: { initial: DrillCaseView }) {
  const [chosen, setChosen] = useState<string | null>(initial.yourForecast);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(colour: string) {
    setError(null);
    setChosen(colour);
    startTransition(async () => {
      const res = await submitForecastAction(initial.id, colour);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFeedback({ correct: res.correct });
    });
  }

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {initial.hazard && (
          <span className="rounded-md bg-plum-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-plum-700">
            {initial.hazard}
          </span>
        )}
        {initial.region && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-400">
            <MapPin className="size-3" />
            {initial.region}
          </span>
        )}
      </div>
      <h3 className="font-display text-lg text-ink-900">{initial.title}</h3>
      <p className="mt-1.5 text-sm text-ink-500">{initial.description}</p>

      <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        Issue your warning
      </p>
      <div className="flex flex-wrap gap-2">
        {(IMD_COLOURS as readonly string[]).map((colour) => {
          const active = chosen === colour;
          const meta = COLOUR_STYLE[colour]!;
          return (
            <button
              key={colour}
              type="button"
              disabled={pending}
              onClick={() => pick(colour)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
                active ? "border-ink-900 bg-sunken" : "border-hair hover:border-plum-300"
              }`}
              aria-pressed={active}
            >
              <span className={`size-3 rounded-full ${meta.bg}`} aria-hidden="true" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-status-unpaid">{error}</p>}
      {feedback && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 text-sm ${
            feedback.correct ? "text-sage-700" : "text-status-partial"
          }`}
        >
          {feedback.correct ? <Check className="size-4" /> : <X className="size-4" />}
          {feedback.correct ? "Matched the verifying analysis." : "Recorded — differs from the verifying analysis."}
        </p>
      )}
    </Card>
  );
}
