"use client";

/* The student dashboard — Lifted 2.0, on real data.
   Stack × Timetable: one dark raised card (the live class, drawn as a chalk
   night board) on a flat ledger page, with a timetable rail carrying the day
   on a real time axis. The live slot's own block lights up as board material
   while the class runs — lit means live.
   the page is raised, so raised means *happening now*; at rest the hero is a
   flat dashed panel holding the next class. */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { joinMeetingAction } from "@/app/actions/meeting";
import { TeacherHand } from "@/components/ui/TeacherHand";
import { formatPaise } from "@/lib/utils";
import "./dashboard.css";

const HOUR_PX = 54;

export type DashboardData = {
  studentShort: string;
  batchLine: string;
  teacherName: string;
  enrolled: number;
  live: {
    meetingId: string;
    title: string;
    startAt: string;
    durationMins: number;
    teacherJoined: boolean;
  } | null;
  nextClass: {
    title: string;
    whenLabel: string;
    durationMins: number;
    note: string | null;
  } | null;
  week: { d: string; n: number; classes: number; missed: boolean; today: boolean }[];
  todayBlocks: {
    id: string;
    title: string;
    startAt: string;
    durationMins: number;
    state: "past" | "next";
    attended: boolean | null;
    note: string | null;
  }[];
  comingUp: { id: string; title: string; whenLabel: string; note: string | null; href: string | null }[];
  results: { id: string; title: string; score: number; outOf: number; onLabel: string; rank: number; cohort: number }[];
  notes: { recent: { id: string; title: string; updatedLabel: string; subject: string }[]; total: number };
  fees: {
    totalPaise: number;
    paidPaise: number;
    duePaise: number;
    dueLabel: string | null;
    overdue: boolean;
    rows: { id: string; label: string; onLabel: string; amountPaise: number }[];
  } | null;
  attendance: {
    attended: number;
    total: number;
    percent: number;
    register: number[];
    missedCount: number;
  } | null;
  notices: { id: string; atLabel: string; text: string }[];
  doubts: { thisMonth: number; recent: { q: string; onLabel: string; answered: boolean }[] };
};

const hhmm = (t: number) =>
  `${String(Math.floor(((t % 24) + 24) % 24)).padStart(2, "0")}:${String(
    Math.round((t % 1) * 60)
  ).padStart(2, "0")}`;

const toHours = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
};

export function StudentDashboard({ data }: { data: DashboardData }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const live = data.live;
  const clock = now ? now.getHours() + now.getMinutes() / 60 : null;

  const liveStart = live ? toHours(live.startAt) : null;
  const liveEnd = live && liveStart !== null ? liveStart + live.durationMins / 60 : null;
  const progress =
    live && liveStart !== null && liveEnd !== null && clock !== null
      ? Math.min(Math.max((clock - liveStart) / (liveEnd - liveStart), 0), 1)
      : 0;

  /* ── The day grid window: cover every block plus the current time ── */
  const blockHours = data.todayBlocks.flatMap((b) => {
    const s = toHours(b.startAt);
    return [s, s + b.durationMins / 60];
  });
  if (live && liveStart !== null && liveEnd !== null) blockHours.push(liveStart, liveEnd);
  if (clock !== null) blockHours.push(clock);
  const hasGrid = live !== null || data.todayBlocks.length > 0;
  const dayStart = hasGrid
    ? Math.max(0, Math.floor(Math.min(...blockHours)) - 1)
    : 8;
  const dayEndRaw = hasGrid ? Math.min(24, Math.ceil(Math.max(...blockHours)) + 1) : 20;
  const rows = Math.min(Math.max(dayEndRaw - dayStart, 4), 14);
  const at = (t: number) => (t - dayStart) * HOUR_PX;
  const hours = Array.from({ length: rows }, (_, i) => hhmm(dayStart + i));
  const nowOnGrid =
    clock !== null && clock >= dayStart && clock <= dayStart + rows ? clock : null;


  const att = data.attendance;
  const fees = data.fees;

  return (
    <div className="lf2">
      <div className="lf2-bar">
        <h1>This week</h1>
        <span className="who">{data.batchLine}</span>
      </div>

      <div className="lf2-in">
        <div className="lf2-main">
          {/* ── Hero column ── */}
          <div>
            <div className="lf2-lbl">{live ? "Happening now" : "On the board"}</div>
            {live && liveStart !== null && liveEnd !== null ? (
              <HeroBoard
                live={live}
                start={liveStart}
                end={liveEnd}
                clock={clock ?? liveStart}
                progress={progress}
                teacherName={data.teacherName}
                enrolled={data.enrolled}
              />
            ) : (
              /* The board never leaves — unlit means waiting. Raised still
                 means "the class surface"; only the light changes. */
              <div className="lf2-hero-wrap">
                <div className="lf2-hero waiting">
                  <div className="lbl waiting">
                    {data.nextClass ? "Up next" : "Board is clear"}
                  </div>
                  {data.nextClass ? (
                    <>
                      <h2>{data.nextClass.title}</h2>
                      <p>
                        {data.nextClass.whenLabel} · {data.nextClass.durationMins} min ·{" "}
                        {data.teacherName}
                        {data.nextClass.note ? ` · ${data.nextClass.note}` : ""}
                      </p>
                      <div className="lf2-actions">
                        <Link href="/student/meetings" className="btn ghost">
                          All meetings
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2>Nothing on the board</h2>
                      <p>
                        When {data.teacherName} starts a class, it lifts off the schedule
                        and lands here.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="lf2-stats">
              <div className="lf2-stat">
                {att ? (
                  <>
                    <b>{att.percent}%</b>
                    <span>Attendance</span>
                    <div className="lf2-reg" aria-hidden="true">
                      {att.register.map((v, i) => (
                        <i key={i} className={v ? "on" : "off"} />
                      ))}
                    </div>
                    <div className="lf2-meta">
                      {att.attended} of {att.total} classes
                      {att.missedCount > 0 ? ` · ${att.missedCount} missed` : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <b>—</b>
                    <span>Attendance</span>
                    <div className="lf2-meta">No classes held yet</div>
                  </>
                )}
              </div>
              <div className={`lf2-stat${fees && fees.duePaise > 0 ? " due" : ""}`}>
                {fees ? (
                  fees.duePaise > 0 ? (
                    <>
                      <b>{formatPaise(fees.duePaise)}</b>
                      <span>
                        Outstanding
                        {fees.dueLabel
                          ? fees.overdue
                            ? ` · was due ${fees.dueLabel}`
                            : ` · due ${fees.dueLabel}`
                          : ""}
                      </span>
                      <div className="lf2-meter" aria-hidden="true">
                        <i style={{ width: `${Math.min((fees.paidPaise / fees.totalPaise) * 100, 100)}%` }} />
                      </div>
                      <div className="lf2-meta">
                        {formatPaise(fees.paidPaise)} of {formatPaise(fees.totalPaise)} paid
                      </div>
                    </>
                  ) : (
                    <>
                      <b>{formatPaise(0)}</b>
                      <span>Outstanding · all settled</span>
                      <div className="lf2-meter" aria-hidden="true">
                        <i style={{ width: "100%" }} />
                      </div>
                      <div className="lf2-meta">
                        {formatPaise(fees.paidPaise)} of {formatPaise(fees.totalPaise)} paid
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <b>—</b>
                    <span>Fees</span>
                    <div className="lf2-meta">No fee assigned yet</div>
                  </>
                )}
              </div>
            </div>

            <div className="lf2-results">
              <div className="lf2-h">Results</div>
              {data.results.length === 0 ? (
                <div className="lf2-none">No graded tests yet.</div>
              ) : (
                data.results.map((t) => (
                  <div className="lf2-res" key={t.id}>
                    <div className="lf2-res-top">
                      <span>{t.title}</span>
                      <span className="amt">
                        {t.score}/{t.outOf}
                      </span>
                    </div>
                    <div className="lf2-bar-track" aria-hidden="true">
                      <i style={{ width: `${t.outOf > 0 ? (t.score / t.outOf) * 100 : 0}%` }} />
                    </div>
                    <div className="lf2-res-sub">
                      {t.onLabel} · rank {t.rank} of {t.cohort}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── The rail ── */}
          <div className="lf2-rail">
            <div className="lf2-lbl">Today, on the clock</div>
            <div className="lf2-week">
              {data.week.map((d) => (
                <span
                  key={`${d.d}-${d.n}`}
                  className={`lf2-chip${d.today ? " is-today" : ""}${d.missed ? " is-missed" : ""}`}
                >
                  <b>{d.d}</b>
                  <i>{d.n}</i>
                  <u>{d.classes ? "•".repeat(Math.min(d.classes, 4)) : " "}</u>
                </span>
              ))}
            </div>

            {!hasGrid ? (
              <p className="lf2-day-none">No classes scheduled today.</p>
            ) : (
            <div className="lf2-day">
                {hours.map((h) => (
                  <div className="lf2-hour" key={h} data-h={h} />
                ))}

                {data.todayBlocks.flatMap((b) => {
                  const bs = toHours(b.startAt);
                  const be = bs + b.durationMins / 60;
                  /* The cut-out owns the live window: a block that crosses it is
                     clamped to the parts outside, so nothing renders on top of
                     the hole. Slivers under ~15 minutes are dropped. */
                  let parts: Array<[number, number]> = [[bs, be]];
                  if (liveStart !== null && liveEnd !== null && bs < liveEnd && be > liveStart) {
                    const gutter = 8 / HOUR_PX; // breathing room around the lit slot
                    parts = [
                      [bs, Math.min(be, liveStart - gutter)],
                      [Math.max(bs, liveEnd + gutter), be],
                    ];
                  }
                  parts = parts.filter(([a, z]) => z - a >= 0.25);
                  const tallest = parts.reduce(
                    (best, cur) => (cur[1] - cur[0] > best[1] - best[0] ? cur : best),
                    parts[0] ?? [0, 0]
                  );
                  return parts.map(([a, z]) => {
                    const main = a === tallest[0];
                    const roomy = z - a >= 0.75; // enough height for two lines
                    return (
                      <div
                        key={`${b.id}-${a}`}
                        className={`lf2-block ${b.state}${
                          b.state === "past" && b.attended === false ? " missed" : ""
                        }`}
                        style={{ top: at(a), height: (z - a) * HOUR_PX - 5 }}
                      >
                        {main ? <h4>{b.title}</h4> : null}
                        {!main || roomy ? (
                          <div className="t">
                            {hhmm(bs)} – {hhmm(be)}
                            {main && roomy && b.note ? ` · ${b.note}` : ""}
                          </div>
                        ) : null}
                        {main && b.state === "past" && b.attended !== null ? (
                          <span className="tag">{b.attended ? "Attended" : "Missed"}</span>
                        ) : null}
                      </div>
                    );
                  });
                })}

                {live && liveStart !== null && liveEnd !== null ? (
                  /* The slot's own block, lit: same board material as the hero.
                     Lit means live — no overlay, no hole. */
                  <div
                    className="lf2-block on-air"
                    style={{
                      top: at(liveStart),
                      height: (live.durationMins / 60) * HOUR_PX - 5,
                    }}
                    aria-label={`${live.title} — live now`}
                  >
                    <div className="hd">
                      <span className="lbl">Live now</span>
                      <span className="tm">
                        {hhmm(liveStart)} – {hhmm(liveEnd)}
                      </span>
                    </div>
                    <h4>{live.title}</h4>
                  </div>
                ) : null}

                {nowOnGrid !== null ? (
                  <div
                    className="lf2-now"
                    style={{ ["--lf2-now" as string]: `${at(nowOnGrid)}px` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            )}

            <div className="lf2-coming">
              <div className="lf2-h">Coming up</div>
              {data.comingUp.length === 0 ? (
                <div className="lf2-none">Nothing scheduled yet.</div>
              ) : (
                data.comingUp.map((c) => (
                  <div className="lf2-note" key={c.id}>
                    {c.href ? (
                      <Link href={c.href}>
                        <h5>{c.title}</h5>
                      </Link>
                    ) : (
                      <h5>{c.title}</h5>
                    )}
                    <div className="t">
                      {c.whenLabel}
                      {c.note ? ` · ${c.note}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── The record ── */}
        <div className="lf2-record">
          <div className="lf2-record-grid">
            <section>
              <div className="lf2-h">Fees</div>
              {fees ? (
                <>
                  {fees.rows.map((f) => (
                    <div className="lf2-row" key={f.id}>
                      <span>
                        {f.label}
                        <em className="lf2-when">{f.onLabel}</em>
                      </span>
                      <span className="amt">{formatPaise(f.amountPaise)}</span>
                    </div>
                  ))}
                  {fees.rows.length === 0 ? (
                    <div className="lf2-none">No payments recorded yet.</div>
                  ) : null}
                  <div className="lf2-row lf2-tot">
                    <span>Outstanding</span>
                    <span className={`amt${fees.duePaise === 0 ? " settled" : ""}`}>
                      {formatPaise(fees.duePaise)}
                    </span>
                  </div>
                  <Link className="lf2-more" href="/student/fees">
                    Full ledger
                  </Link>
                </>
              ) : (
                <div className="lf2-none">No fee assigned yet.</div>
              )}
            </section>

            <section>
              <div className="lf2-h">Notes</div>
              {data.notes.recent.length === 0 ? (
                <div className="lf2-none">No notes shared yet.</div>
              ) : (
                data.notes.recent.map((n) => (
                  <div className="lf2-note" key={n.id}>
                    <Link href={`/student/notes/${n.id}`}>
                      <h5>{n.title}</h5>
                    </Link>
                    <div className="t">
                      {n.updatedLabel} · {n.subject}
                    </div>
                  </div>
                ))
              )}
              <Link className="lf2-more" href="/student/notes">
                All {data.notes.total} notes
              </Link>
            </section>

            <section>
              <div className="lf2-h">From {data.teacherName}</div>
              {data.notices.length === 0 ? (
                <div className="lf2-none">Nothing on the noticeboard.</div>
              ) : (
                data.notices.map((n) => (
                  <div className="lf2-notice" key={n.id}>
                    <div className="t">{n.atLabel}</div>
                    <TeacherHand>{n.text}</TeacherHand>
                  </div>
                ))
              )}
            </section>

            <section>
              <div className="lf2-h">
                Your doubts{data.doubts.thisMonth > 0 ? ` · ${data.doubts.thisMonth} this month` : ""}
              </div>
              {data.doubts.recent.length === 0 ? (
                <div className="lf2-none">Nothing asked yet — the tutor is all ears.</div>
              ) : (
                data.doubts.recent.map((d) => (
                  <div className="lf2-doubt" key={d.q + d.onLabel}>
                    <p>{d.q}</p>
                    <div className="t">
                      {d.onLabel} · {d.answered ? "answered" : "waiting"}
                    </div>
                  </div>
                ))
              )}
              <Link className="lf2-more" href="/student/ai">
                Ask a doubt
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The tilt spring carries over unchanged — mouse only, full motion only. */
function HeroBoard({
  live,
  start,
  end,
  clock,
  progress,
  teacherName,
  enrolled,
}: {
  live: NonNullable<DashboardData["live"]>;
  start: number;
  end: number;
  clock: number;
  progress: number;
  teacherName: string;
  enrolled: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const st = useRef({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, running: false });
  const [pending, startTransition] = useTransition();

  const paint = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { x, y } = st.current;
    el.style.transform = `rotateX(${y.toFixed(3)}deg) rotateY(${x.toFixed(3)}deg)`;
  }, [ref]);

  const tick = useCallback(() => {
    const s = st.current;
    const k = 120;
    const c = 22;
    const dt = 1 / 60;
    s.vx += (-k * (s.x - s.tx) - c * s.vx) * dt;
    s.vy += (-k * (s.y - s.ty) - c * s.vy) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    paint();
    const settled =
      Math.abs(s.x - s.tx) < 0.01 &&
      Math.abs(s.y - s.ty) < 0.01 &&
      Math.abs(s.vx) < 0.01 &&
      Math.abs(s.vy) < 0.01;
    if (settled) {
      s.running = false;
      raf.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [paint]);

  const kick = useCallback(() => {
    if (st.current.running) return;
    st.current.running = true;
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    st.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 6;
    st.current.ty = -((e.clientY - r.top) / r.height - 0.5) * 5;
    kick();
  };

  const onLeave = () => {
    st.current.tx = 0;
    st.current.ty = 0;
    kick();
  };

  const join = () => {
    startTransition(async () => {
      const result = await joinMeetingAction(live.meetingId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.url) window.open(result.url, "_blank", "noopener");
    });
  };

  const minutesIn = Math.max(0, Math.round((clock - start) * 60));

  return (
    <div className="lf2-hero-wrap" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        className="lf2-hero"
        ref={ref}
        style={{ ["--lf2-progress" as string]: progress }}
      >
        <div className={`lbl${live.teacherJoined ? "" : " waiting"}`}>
          {live.teacherJoined ? `Live now · started ${hhmm(start)}` : "Starting soon"}
        </div>
        <h2>{live.title}</h2>
        <p>
          {live.teacherJoined
            ? `${minutesIn} minutes in · ${enrolled} enrolled · ${teacherName}`
            : `Waiting for ${teacherName} to open the board`}
        </p>
        <div className="lf2-actions">
          <button className="btn" onClick={join} disabled={pending || !live.teacherJoined}>
            {pending ? "Joining…" : live.teacherJoined ? "Join class" : "Waiting…"}
          </button>
        </div>
        <div className="lf2-prog">
          <div className="lf2-prog-track">
            <i />
          </div>
          <div className="lf2-prog-meta">
            <span>
              {hhmm(start)} – {hhmm(end)}
            </span>
            <span>{Math.round(progress * 100)}% through</span>
          </div>
        </div>
      </div>
    </div>
  );
}
