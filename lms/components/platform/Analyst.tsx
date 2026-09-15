"use client";

import { CornerDownLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { AnalystChart } from "@/components/platform/AnalystChart";
import { Card } from "@/components/ui/Card";
import { ANALYST_SUGGESTIONS, type AnalysisId } from "@/lib/analyst";
import type { CapacityMetrics } from "@/lib/metrics";

type Exchange = {
  question: string;
  answer: string;
  chart: AnalysisId | null;
  offline: boolean;
  /** Figures in the prose that did not occur in the supplied data. */
  unverified: string[];
  metrics: CapacityMetrics;
};

/**
 * Ask a question of the national data and get an answer with the relevant
 * figures drawn beneath it.
 *
 * The transcript is kept in component state rather than persisted: this is a
 * working tool for reading the current position, not a record to file.
 */
export function Analyst({ initialMetrics }: { initialMetrics: CapacityMetrics }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Exchange[]>([]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);
    setQuestion("");

    try {
      const res = await fetch("/api/platform/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not answer that.");
        return;
      }
      setLog((prev) => [
        ...prev,
        {
          question: trimmed,
          answer: data.answer,
          chart: data.chart ?? null,
          offline: Boolean(data.offline),
          unverified: Array.isArray(data.unverified) ? data.unverified : [],
          metrics: data.metrics ?? initialMetrics,
        },
      ]);
    } catch {
      setError("Could not reach the analyst. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {log.length === 0 && (
        <Card>
          <p className="text-sm text-ink-500">
            Ask about the national training position. Answers are drawn from the figures on this
            dashboard — the assistant interprets them, it does not estimate.
          </p>
          <ul className="mt-4 space-y-1.5">
            {ANALYST_SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => ask(s)}
                  className="w-full cursor-pointer rounded-[10px] px-3 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-plum-50 hover:text-plum-700"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {log.map((x, i) => (
        <Card key={`${x.question}-${i}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {x.question}
          </p>
          <p className="mt-2 whitespace-pre-line text-ink-900">{x.answer}</p>
          {x.chart && <AnalystChart chart={x.chart} metrics={x.metrics} />}
          {x.unverified.length > 0 && (
            <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-xs text-status-unpaid">
              {x.unverified.join(", ")} {x.unverified.length === 1 ? "does" : "do"} not appear in
              the underlying figures. Treat {x.unverified.length === 1 ? "it" : "them"} as
              unverified and read the chart below instead.
            </p>
          )}
          {x.offline && (
            <p className="mt-3 text-xs text-ink-300">
              Answered from the figures directly — no language model was available.
            </p>
          )}
        </Card>
      ))}

      {error && (
        <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">{error}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="sticky bottom-4"
      >
        <div className="flex items-center gap-2 rounded-xl border border-hair bg-paper p-2 shadow-[var(--shadow-sm)]">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about training capacity, shortfalls, or departments…"
            aria-label="Ask the analyst"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-300"
          />
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-plum-600 px-3 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="size-3.5" />
            )}
            {pending ? "Reading" : "Ask"}
          </button>
        </div>
      </form>
    </div>
  );
}
