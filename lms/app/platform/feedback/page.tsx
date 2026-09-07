import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { getNationalFeedback } from "@/lib/national-db";

const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

function Rating({ value }: { value: number | null }) {
  if (value == null) return <span className="text-ink-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-ink-900">
      {value.toFixed(1)}
      <Star className="size-3 fill-status-partial text-status-partial" />
    </span>
  );
}

export default async function NationalFeedbackPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const { totalResponses, averages, distribution, courses } = await getNationalFeedback();
  const maxBar = Math.max(1, ...distribution);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-normal text-ink-900">Feedback (national)</h1>
          <p className="mt-1 text-sm text-ink-500">
            {totalResponses} de-identified {totalResponses === 1 ? "response" : "responses"} across every
            course — no individual trainee is identifiable.
          </p>
        </div>
        <Link href="/platform" className="text-sm text-plum-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      {totalResponses === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Aggregated, anonymised course feedback appears here as trainees respond."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Overall", v: averages.overall },
              { k: "Content", v: averages.content },
              { k: "Trainer", v: averages.trainer },
              { k: "Infrastructure", v: averages.infrastructure },
            ].map((m) => (
              <Card key={m.k}>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{m.k}</p>
                <p className="mt-1 font-display text-3xl text-ink-900">
                  {m.v == null ? "—" : m.v.toFixed(1)}
                  {m.v != null && <span className="text-lg text-ink-300"> / 5</span>}
                </p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overall rating distribution</CardTitle>
            </CardHeader>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = distribution[star - 1];
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 font-mono text-ink-500">{star}★</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full bg-plum-500"
                        style={{ width: `${(n / maxBar) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums text-ink-700">{n}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By course</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                    <th className="py-2 pr-4 font-normal">Course</th>
                    <th className="py-2 pr-4 font-normal">Department</th>
                    <th className="py-2 pr-4 text-right font-normal">Responses</th>
                    <th className="py-2 pr-4 text-right font-normal">Overall</th>
                    <th className="py-2 pr-4 text-right font-normal">Content</th>
                    <th className="py-2 pr-4 text-right font-normal">Trainer</th>
                    <th className="py-2 text-right font-normal">Infra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hair">
                  {courses.map((c) => (
                    <tr key={c.batchId}>
                      <td className="py-3 pr-4 font-medium text-ink-900">{c.courseName}</td>
                      <td className="py-3 pr-4 text-ink-700">
                        {c.department ?? <span className="text-ink-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-700">{c.responses}</td>
                      <td className="py-3 pr-4 text-right">
                        <Rating value={c.overall} />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Rating value={c.content} />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Rating value={c.trainer} />
                      </td>
                      <td className="py-3 text-right">
                        <Rating value={c.infrastructure} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
