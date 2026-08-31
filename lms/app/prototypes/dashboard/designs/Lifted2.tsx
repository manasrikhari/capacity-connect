"use client";

/* LIFTED 2.0 — same bones as Lifted, resurfaced. See lifted2.css for the five
   changes: classroom-wall ground instead of AI-cream, night-board hero with
   the whiteboard dot grid, Caveat for the teacher's words, an inked signature
   drawn once on load, and mono reserved for machine data. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ATTENDANCE, BATCH, DOUBTS, FEES, LIVE, NOTES, NOTES_TOTAL, NOTICES, TESTS, UPCOMING, rupees,
} from "./data";
import "./lifted2.css";

const HOUR_PX = 54;
const ROWS = 12;
const LESSON_MINS = 90;
const ELAPSED_MINS = 42;

/* Keep the real clock while it falls inside teaching hours; otherwise pin the
   lesson to a representative midday so the day always reads as plausible. */
const WINDOW_FROM = 11.5;
const WINDOW_TO = 14.75;
const FALLBACK_START = 12.5;

const AROUND = [
  { rel: -3.5, mins: 60, title: "Vectors & resolution", state: "past" as const, attended: true },
  { rel: -1.75, mins: 45, title: "Doubt clinic", state: "past" as const, attended: false },
  { rel: 2, mins: 90, title: UPCOMING[0].title, state: "next" as const, note: UPCOMING[0].note },
  { rel: 3.75, mins: 60, title: UPCOMING[1].title, state: "next" as const, note: UPCOMING[1].note },
];

const WEEK = [
  { d: "Mon", n: 24, classes: 1 },
  { d: "Tue", n: 25, classes: 0 },
  { d: "Wed", n: 26, classes: 1, missed: true },
  { d: "Thu", n: 27, classes: 1 },
  { d: "Fri", n: 28, classes: 0 },
  { d: "Sat", n: 29, classes: 3, today: true },
];

const hhmm = (t: number) =>
  `${String(Math.floor(t)).padStart(2, "0")}:${String(Math.round((t % 1) * 60)).padStart(2, "0")}`;

type Thread = {
  a: { top: number; left: number; w: number };
  v: { top: number; left: number; h: number };
  b: { top: number; left: number; w: number };
  dot: { top: number; left: number };
};

export type Ground = "sage" | "porcelain" | "plum";

export function Lifted2({ ground = "sage" }: { ground?: Ground }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const realClock = now ? now.getHours() + now.getMinutes() / 60 : FALLBACK_START + ELAPSED_MINS / 60;
  const realStart = realClock - ELAPSED_MINS / 60;
  const live = realStart >= WINDOW_FROM && realStart <= WINDOW_TO;
  const start = live ? realStart : FALLBACK_START;
  const clock = live ? realClock : start + ELAPSED_MINS / 60;
  const end = start + LESSON_MINS / 60;
  const progress = Math.min(Math.max((clock - start) / (end - start), 0), 1);

  const dayStart = Math.floor(start) - 4;
  const at = (t: number) => (t - dayStart) * HOUR_PX;
  const hours = Array.from({ length: ROWS }, (_, i) => hhmm(dayStart + i));

  /* The leader thread, measured: the cut-out moves with the real clock, so the
     line from hole to card is aimed after layout. */
  const mainRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const cutRef = useRef<HTMLDivElement | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);

  const measure = useCallback(() => {
    const m = mainRef.current?.getBoundingClientRect();
    const h = heroRef.current?.getBoundingClientRect();
    const c = cutRef.current?.getBoundingClientRect();
    if (!m || !h || !c || window.innerWidth < 1000) { setThread(null); return; }
    const exitY = c.top + 18 - m.top;
    const targetY = h.top + h.height / 2 - m.top;
    const midX = (h.right + c.left) / 2 - m.left;
    const heroRight = h.right - m.left;
    setThread({
      a: { top: exitY, left: midX, w: c.left - m.left - midX },
      v: { top: Math.min(exitY, targetY), left: midX, h: Math.abs(exitY - targetY) },
      b: { top: targetY, left: heroRight + 5, w: midX - heroRight - 5 },
      dot: { top: targetY - 4, left: heroRight + 1 },
    });
  }, []);

  useLayoutEffect(measure, [measure, start, clock]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className={`lf2${ground === "sage" ? "" : ` g-${ground}`}`}>
      <div className="lf2-bar">
        <h1>This week</h1>
        <span className="who">
          {BATCH.studentShort} · {BATCH.subject} {BATCH.name} · {BATCH.teacher}
        </span>
      </div>

      <div className="lf2-in">
        <div className="lf2-main" ref={mainRef}>
          {/* ── Hero column ── */}
          <div>
            <div className="lf2-lbl">Happening now</div>
            <HeroCard start={start} end={end} clock={clock} progress={progress} cardRef={heroRef} />

            <div className="lf2-stats">
              <div className="lf2-stat">
                <b>{ATTENDANCE.percent}%</b>
                <span>Attendance</span>
                <div className="lf2-reg">
                  {ATTENDANCE.register.map((v, i) => (
                    <i key={i} className={v ? "on" : "off"} />
                  ))}
                </div>
                <div className="lf2-meta">
                  {ATTENDANCE.attended} of {ATTENDANCE.total} classes · {ATTENDANCE.missed.length} missed
                </div>
              </div>
              <div className="lf2-stat due">
                <b>{rupees(FEES.due)}</b>
                <span>Outstanding · due 5 Sep</span>
                <div className="lf2-meter" aria-hidden="true">
                  <i style={{ width: `${(FEES.paid / FEES.total) * 100}%` }} />
                </div>
                <div className="lf2-meta">
                  {rupees(FEES.paid)} of {rupees(FEES.total)} paid
                </div>
              </div>
            </div>

            <div className="lf2-results">
              <div className="lf2-h">Results</div>
              {TESTS.graded.map((t) => (
                <div className="lf2-res" key={t.title}>
                  <div className="lf2-res-top">
                    <span>{t.title}</span>
                    <span className="amt">
                      {t.score}/{t.outOf}
                    </span>
                  </div>
                  <div className="lf2-bar-track" aria-hidden="true">
                    <i style={{ width: `${(t.score / t.outOf) * 100}%` }} />
                  </div>
                  <div className="lf2-res-sub">
                    {t.on} · rank {t.rank} of {BATCH.enrolled}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── The rail ── */}
          <div className="lf2-rail">
            <div className="lf2-lbl">Today, on the clock</div>
            <div className="lf2-week">
              {WEEK.map((d) => (
                <span
                  key={d.d}
                  className={`lf2-chip${d.today ? " is-today" : ""}${d.missed ? " is-missed" : ""}`}
                >
                  <b>{d.d}</b>
                  <i>{d.n}</i>
                  <u>{d.classes ? "•".repeat(d.classes) : " "}</u>
                </span>
              ))}
            </div>
            <div className="lf2-day">
              {hours.map((h) => (
                <div className="lf2-hour" key={h} data-h={h} />
              ))}

              {AROUND.map((b) => {
                const s = start + b.rel;
                return (
                  <div
                    key={b.title}
                    className={`lf2-block ${b.state}${b.state === "past" && !b.attended ? " missed" : ""}`}
                    style={{ top: at(s), height: (b.mins / 60) * HOUR_PX - 5 }}
                  >
                    <h4>{b.title}</h4>
                    <div className="t">
                      {hhmm(s)} – {hhmm(s + b.mins / 60)}
                      {b.note ? ` · ${b.note}` : ""}
                    </div>
                    {b.state === "past" ? (
                      <span className="tag">{b.attended ? "Attended" : "Missed"}</span>
                    ) : null}
                  </div>
                );
              })}

              <div
                className="lf2-cut"
                ref={cutRef}
                style={{ top: at(start), height: (LESSON_MINS / 60) * HOUR_PX - 5 }}
                aria-label={`${LIVE.title} — lifted off the schedule, live now`}
              >
                <span>
                  Lifted — live now
                  <br />
                  {hhmm(start)} – {hhmm(end)}
                </span>
              </div>

              <div
                className="lf2-block ghost"
                style={{ top: at(start + 5), height: HOUR_PX - 5 }}
              >
                <h4>{TESTS.open.title}</h4>
                <div className="t">
                  Closes {TESTS.open.closes} · {TESTS.open.questions} questions
                </div>
              </div>

              <div
                className="lf2-now"
                data-now={hhmm(clock)}
                style={{ ["--lf2-now" as string]: `${at(clock)}px` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {thread ? (
            <>
              <i className="lf2-thread seg-a" style={{ top: thread.a.top, left: thread.a.left, width: thread.a.w }} />
              <i className="lf2-thread seg-v" style={{ top: thread.v.top, left: thread.v.left, height: thread.v.h }} />
              <i className="lf2-thread seg-b" style={{ top: thread.b.top, left: thread.b.left, width: thread.b.w }} />
              <i className="lf2-thread-dot" style={{ top: thread.dot.top, left: thread.dot.left }} />
            </>
          ) : null}
        </div>

        {/* ── The record ── */}
        <div className="lf2-record">
          <div className="lf2-record-grid">
            <section>
              <div className="lf2-h">Fees</div>
              {FEES.instalments.map((f) => (
                <div className="lf2-row" key={f.term}>
                  <span>
                    {f.term}
                    <em className="lf2-when">{f.on}</em>
                  </span>
                  <span className={`amt${f.status === "due" ? " due" : ""}`}>{rupees(f.amount)}</span>
                </div>
              ))}
              <div className="lf2-row lf2-tot">
                <span>Outstanding</span>
                <span className="amt">{rupees(FEES.due)}</span>
              </div>
            </section>

            <section>
              <div className="lf2-h">Notes</div>
              {NOTES.slice(0, 4).map((n) => (
                <div className="lf2-note" key={n.title}>
                  <h5>{n.title}</h5>
                  <div className="t">
                    {n.when} · {n.pages} pages
                  </div>
                </div>
              ))}
              <a className="lf2-more" href="#">
                All {NOTES_TOTAL} notes
              </a>
            </section>

            <section>
              <div className="lf2-h">From {BATCH.teacher}</div>
              {NOTICES.map((n) => (
                <div className="lf2-notice" key={n.text}>
                  <div className="t">{n.at}</div>
                  <p>{n.text}</p>
                </div>
              ))}
            </section>

            <section>
              <div className="lf2-h">Your doubts · {DOUBTS.thisMonth} this month</div>
              {DOUBTS.recent.map((d) => (
                <div className="lf2-doubt" key={d.q}>
                  <p>{d.q}</p>
                  <div className="t">
                    {d.on} · {d.answered ? "answered" : "waiting"}
                  </div>
                </div>
              ))}
              <a className="lf2-more" href="#">
                Ask a doubt
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The tilt spring carries over unchanged — mouse only, full motion only. */
function HeroCard({
  start, end, clock, progress, cardRef,
}: {
  start: number; end: number; clock: number; progress: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = cardRef;
  const raf = useRef<number | null>(null);
  const st = useRef({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, running: false });

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
      Math.abs(s.x - s.tx) < 0.01 && Math.abs(s.y - s.ty) < 0.01 &&
      Math.abs(s.vx) < 0.01 && Math.abs(s.vy) < 0.01;
    if (settled) { s.running = false; raf.current = null; return; }
    raf.current = requestAnimationFrame(tick);
  }, [paint]);

  const kick = useCallback(() => {
    if (st.current.running) return;
    st.current.running = true;
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

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

  return (
    <div className="lf2-hero-wrap" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        className="lf2-hero"
        ref={ref}
        style={{ ["--lf2-progress" as string]: progress }}
      >
        <div className="lbl">Live now · started {hhmm(start)}</div>
        <h2>{LIVE.title}</h2>
        <p>
          {Math.round((clock - start) * 60)} minutes in · {LIVE.present} of {BATCH.enrolled} present · {BATCH.teacher}
        </p>
        <div className="lf2-actions">
          <button className="btn">Join class</button>
          <button className="btn ghost">Open whiteboard</button>
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
