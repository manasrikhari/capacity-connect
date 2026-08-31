# Lifted 2.0 — student dashboard design (handoff)

The approved design for `/student/dashboard`, running on mock data at
`/prototypes/dashboard` (dev only). This folder is the complete deliverable:

| File | What it is |
| --- | --- |
| `Lifted2.tsx` | The dashboard component. Self-contained except for the shared token layer. |
| `lifted2.css` | All of its styles, scoped under `.lf2` (buttons included). |
| `data.ts` | The mock dataset. Every field maps 1:1 to something Prisma already stores. |

## To view it

```bash
npm run dev:lms
# then open http://localhost:3000/prototypes/dashboard
```

`lms/proxy.ts` has a dev-only exemption that lets `/prototypes/*` through without
auth (`NODE_ENV !== "production"` — it cannot leak into a build).

## The design in one paragraph

Stack × Timetable: one dark raised card (the live class, drawn as a chalk-green
**night board** with the landing page's 17px dot grid) on a flat ledger page,
with a **timetable rail** on the right carrying past and future classes on a
real time axis. The live slot on the rail is a dashed **cut-out** — the hole the
class left when it was lifted off the schedule — with an inked leader thread
that is measured in JS and drawn once on load. Only one thing on the page is
raised, so raised means *happening now*.

## Decisions already made (don't relitigate casually)

- **Ground: plum paper** (`#F0EEF3`), chosen over porcelain and classroom sage.
  The switcher on the handoff page compares all three; the component takes it
  as a `ground` prop and the page passes `"plum"`.
- **Ink deepened** to `#16140F` / `#2E2B24`, scoped inside `.lf2`. If this
  design becomes the app, fold those values into `app/opengrapes.css`.
- **Terracotta is status-only** (due / missed / live) — never decoration.
- **Caveat = teacher's hand.** Any field authored by the teacher (notices,
  feedback) renders in the hand face; system/AI text never does. Caveat covers
  Latin only — check script and fall back to the body face for Devanagari, and
  cap hand-rendered notes at a few lines.
- **Mono = machine data only** (times, amounts, ranks, codes). Section heads
  and captions are Hanken Grotesk 600 sentence case.
- All text on the ground clears WCAG AA (captions were tuned to ≥4.5:1;
  the 38px terracotta figure passes as large text).

## What it depends on

- `app/opengrapes.css` + the `@theme` bridge in `app/globals.css` (tokens:
  `--plum-*`, `--sage-*`, `--status-*`, radii, easing, durations).
- The four fonts loaded in `app/layout.tsx` via `next/font`:
  Spectral, Hanken Grotesk, Spline Sans Mono, Caveat
  (`--font-display-stack`, `--font-body-stack`, `--font-mono-stack`,
  `--font-hand-stack`).

## Integration notes

1. Replace `data.ts` with real queries — the shapes were designed to match the
   Prisma models (meetings, tests + attempts, notes, fee instalments,
   attendance, notices). The component only formats; it computes nothing you
   can't hand it.
2. The clock logic (`WINDOW_FROM/TO`, `FALLBACK_START`) exists to keep the
   *mock* plausible at any hour. In production, replace it with the actual
   meeting's start/end from the DB; keep the "no live class" case in mind —
   the hero needs an upcoming-class state (not designed yet, flagged openly).
3. The leader thread is measured (`measure()` + resize listener) because the
   cut-out's position follows the clock. Keep the `< 1000px` guard: on mobile
   the rail stacks below the hero and the thread must not render.
4. Motion rules already honored: `prefers-reduced-motion` (gentler, not zero),
   `prefers-reduced-transparency` (solid bar), hover gated to fine pointers,
   tilt spring mouse-only. Don't add entrance animations — the one-time thread
   draw is the page's single arrival moment.
5. When done: delete `app/prototypes/` and the `/prototypes` exemption in
   `lms/proxy.ts`.
