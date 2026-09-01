# OpenGrapes App Design — the promoted Lifted 2.0 system

The student-dashboard design "Lifted 2.0" was approved and promoted to the whole
LMS. Its decisions now live in the shared token layer
([app/opengrapes.css](app/opengrapes.css)) and every screen follows them.
This file is the contract; when in doubt, copy an existing pattern from
`components/ui/` rather than inventing one.

## The world in one paragraph

The app is a **ledger on plum paper**: a flat, calm page (`--paper-page
#F0EEF3`) where content sits in hairline-ruled sections, not floating glass
cards. Ink is warm near-black. **Plum owns interaction** (buttons, links,
active nav, focus). **Sage is semantic-only** (paid / present / correct).
**Terracotta is status-only** (due / missed / live) — never decoration. The
only *raised, dark* surface is the **night board** (`--board #20261E` with the
17px chalk dot grid): it means *happening now / live*, and nothing else may be
raised or dark.

## Color roles (use Tailwind utilities from the token bridge)

| Role | Utility / token |
|---|---|
| Page ground | `bg-page` (#F0EEF3) — the body already has it |
| Card / raised paper | `bg-paper` (#F9F8FB) |
| Sunken wells, meter tracks | `bg-sunken` (#E5E1EC) |
| Hairlines | `border-hair`; stronger rules `border-hair-strong` |
| Headings / key figures | `text-ink-900` (#16140F) |
| Body text | `text-ink-700` (#2E2B24) |
| Muted captions | `text-ink-500` (#5E5A67) — AA on the page ground |
| Faint metadata | `text-ink-300` (#6B6776) — smallest text only |
| Interaction accent | `plum-600` bg / `plum-700` text-on-light; tints `plum-50/100` |
| Paid / present / correct | `sage-600` (tint `sage-50/100`) |
| Due / missed / unpaid / wrong | `text-status-unpaid` (#B6604E) |
| Partially paid / pending | `text-status-partial` (#C18A3D) |
| Live | `status-live` (#C0524A) — dot + label only |
| The board | `bg-board border-board-edge text-chalk`, captions `text-chalk-muted`, grid via `bg-dot-grid` |

**Banned:** `violet-*`, `slate-*`, `emerald-*`, `indigo-*`, `white`/`black`
utilities, colored shadows, gradients. Pure `#000`/`#fff` never appear.

## Type voices (already loaded in `app/layout.tsx`)

- **Spectral (`font-display`)** — the institution: page titles, card titles
  (global `h1–h5` rule applies it), big figures (scores, amounts, percents).
  Figures use weight 400, `tabular-nums`.
- **Hanken Grotesk (`font-sans`)** — the interface: body, buttons, labels.
  Section heads are **sans 600, sentence case, 14px, ink-900** over a hairline
  (`border-b border-hair-strong pb-2`) — *not* mono eyebrows.
- **Spline Sans Mono (`font-mono`)** — machine data ONLY: times, dates-as-data,
  amounts in rows, ranks, codes, counts-as-metadata. Micro-caps style:
  `font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300`.
- **Caveat (`font-hand`)** — the teacher's hand: ONLY text a teacher authored
  (notices, feedback). Render via the `TeacherHand` component
  (`components/ui/TeacherHand.tsx`), which falls back to the body face for
  non-Latin scripts. System/AI text never uses it.

## Shape, depth, motion

- Controls (buttons, inputs, chips): `rounded-[10px]` (`--radius-md`).
- Cards/sections: `rounded-2xl` (16px) when boxed; prefer *unboxed* hairline
  sections on the page for record/ledger content.
- Shadows: none on paper sections; `--shadow-sm/md` (warm, from tokens) only on
  overlays (modals, drawers) and the board. No colored shadows.
- Motion tokens only: press `var(--dur-press) var(--ease-out)` with
  `active:scale-[0.97]`; modals/drawers `--dur-panel`/`--ease-drawer`; exits
  faster than enters. **No entrance animations** on page load. Honor
  `prefers-reduced-motion` (gentler, not zero) and
  `prefers-reduced-transparency` (solid instead of blur).
- Live indicators pulse with the existing `live-pulse` keyframes /
  `animate-pulse` on a `bg-status-live` dot.

## Component recipes (the primitives already implement these — reuse them)

- **Button** `components/ui/Button.tsx` — primary: `bg-plum-600 text-paper
  hover:bg-plum-700`; secondary: paper w/ hair border, plum text; outline:
  transparent w/ hair border, ink text; danger: unpaid-tinted; ghost: ink text,
  plum-50 hover. All `rounded-[10px]`, press-scale, `font-medium`.
- **Card** — `bg-paper border border-hair rounded-2xl p-5`, no shadow, no blur.
  `CardTitle` = Spectral via global heading rule, `text-ink-900`.
- **Badge** — mono micro-caps chip: colors map to plum / sage / partial /
  unpaid / neutral / board. Use semantically (sage=positive, unpaid=negative).
- **StatCard** — the Lifted stat: hairline-top section, Spectral 30px+ figure
  in ink-900 (terracotta when it's a due amount), sans 500 12.5px label in
  ink-500. No icon tiles.
- **Field** — inputs on paper: `bg-paper border-hair rounded-[10px]`, focus =
  plum ring (`focus:border-plum-300 focus:ring-2 focus:ring-plum-100`).
- **Modal** — native `<dialog>`, paper panel, hairline header, backdrop
  `bg-ink-900/30` + blur (solid under reduced-transparency).
- **EmptyState** — dashed `border-hair-strong` well on `bg-sunken/40`, ink-500
  text, plum action. Friendly, one sentence.
- **The board (hero)** — only for "happening now": `bg-board bg-dot-grid
  border-board-edge text-chalk rounded-3xl` + warm deep shadow; chalk buttons.

## States (every screen must have all three)

- **Loading**: route-level `loading.tsx` skeletons in `bg-sunken` pulse blocks
  shaped like the actual page (not the hub).
- **Empty**: `EmptyState` with a specific sentence and, where sensible, the
  action that fills it.
- **Error**: route-group `error.tsx` ("Something tore the page — try again")
  with a retry button; server actions return `ActionState` errors → toast.

## Voice

Sentence case everywhere (headings, buttons, labels). Concrete, calm copy:
"No class on the board", "All 12 notes", "due 5 Sep". Money is always
`formatPaise`; times via the `lib/utils.ts` formatters.

## The one rule

Only one thing on any page may be raised and dark: the live board. If nothing
is live, nothing is raised.
