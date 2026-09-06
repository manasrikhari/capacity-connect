# Capacity Connect — PS 26075 Implementation Handover

Branch: `feat/capacity-connect`. This tracks the multi-phase plan to complete
Problem Statement 26075 and add the WMO/IMD-aligned differentiators. Phases ship
independently; the product stays coherent if you stop after any phase.

**Verification gate (run from `lms/`):**
```bash
npx tsc --noEmit && npm run lint && npm run test
# full: also `npm run build` (needs a DB; see Local dev below)
```
Current state: **tsc 0 errors · lint 0 errors (46 pre-existing warnings) · 102 tests pass.**

---

## Local dev environment

No system Postgres/Docker on this Mac. Local dev uses **embedded-postgres** on
port **55432** living in the session scratchpad. To recreate:

```bash
# 1) boot an embedded postgres cluster on :55432 with a start.js that creates
#    databases `capacity_lms` and `capacity_backend` (user/pass postgres/postgres)
# 2) point lms/.env at it:
#    DATABASE_URL="postgresql://postgres:postgres@localhost:55432/capacity_lms?schema=public"
#    DIRECT_URL=  (same)
cd lms
npm install                       # deps hoist to repo-root node_modules (workspaces)
npx prisma migrate deploy
npm run db:seed
npm run dev                       # http://localhost:3000
```

Seed logins: admin `admin@moes.gov.in / Admin@2026`; trainer alias `trainer / 1234`;
trainee alias `trainee / 1234`; pending trainer `trainer.hydro@imd.gov.in / trainer123`.

> **Migrations note:** `prisma migrate dev` is interactive-only and fails in this
> non-interactive shell. Generate migration SQL with
> `prisma migrate diff --from-schema <old> --to-schema prisma/schema.prisma --script`
> into a new `prisma/migrations/<ts>_<name>/migration.sql`, then `prisma migrate deploy`.
> This is how both existing Phase 1/2 migrations were made.

---

## ✅ Phase 1 — Access & roles (COMPLETE, committed, verified end-to-end)

- **Trainee lockout / redirect loop fixed** — new trainees are `APPROVED` at
  creation (`lib/auth.ts` `events.createUser`); existing rows backfilled in the
  migration; `/blocked` whitelisted in `proxy.ts` STUDENT branch. Verified: a
  PENDING student reaches `/blocked` (200), `/student` → 307, no loop.
- **Privilege escalation closed** — `app/welcome/actions.ts` no longer promotes
  the caller; it files a `TrainerRequest` (`components/welcome/TrainerRequestCard.tsx`).
  Verified: approving a request promotes STUDENT→ADMIN and writes an `AuditLog`.
- **Pending staff can sign in** — `signIn` lets them reach the four-state
  `app/blocked/page.tsx`.
- **Role management** — `updateUserRoleAction` in `app/platform/actions.ts`
  (guards: last super-admin, active-course owner) + `AuditLog` on every change;
  role `<select>` in the trainers table; `approve/rejectTrainerRequestAction`.
- **`/platform/people`** — searchable, paginated, filterable directory
  (`components/ui/Pagination.tsx` — first pagination + `contains` search in app).
- **`BatchStaff`** (+ `BatchStaffRole`) — IMD disjoint academic/exam/result cells.
- **Publish resources to homepage** — `LibraryItem.isPublic` + trainer toggle
  (`components/library/LibraryList.tsx`) + `LandingResources` section;
  `/api/files` serves public items without a session. Verified live.
- **Profile work history** — `Profile.experience` (Json) +
  `components/profile/ExperienceField.tsx`.

Migration: `lms/prisma/migrations/20260906000001_phase1_governed_roles/`.

---

## 🟡 Phase 2 — Onboarding & catalogue (IN PROGRESS)

### Done and committed
- **Schema + migration** (`20260906000002_phase2_onboarding`): `Notification`,
  `Department` (+ SPOC), `Invite`; `Batch.slug` (backfilled for seeded courses) +
  `Batch.eligibility` (Json); `Profile.cadre/publicSlug/isPublic/openToMentoring`
  (added in Phase 1's migration, used here).
- **Eligibility engine** (2.4) — `lib/eligibility.ts` pure function +
  `lib/__tests__/eligibility.test.ts` (11 tests, boundary cases). Not yet wired
  into any page.
- **Notification channel** (2.2) — `lib/notify.ts` (`notify`/`notifyMany`),
  `lib/mailer.ts` (Resend adapter, degrades to logged no-op like `safeTrigger`),
  `components/notifications/NotificationBell*.tsx` (bell in all three shells via a
  `slot` prop threaded through `components/layout/Sidebar.tsx`),
  `app/actions/notifications.ts` (mark read). Emitting on: trainer status change,
  trainer-request approve/reject, enrolment approve/reject
  (`app/admin/students/actions.ts`, `app/platform/actions.ts`).
- **Rejected enrolment surfaced** (2.2) — `lib/batch.ts` `getStudentHubData` now
  returns `rejected`; `app/student/page.tsx` renders a `RejectedBatchCard`
  (previously dropped silently).

### NOT yet done in Phase 2 — pick up here
- [ ] **2.3 Public course catalogue** — `/courses` + `/courses/[slug]` (faceted by
      domain/level/department/WMO tier, free-text search, pagination — reuse
      `components/ui/Pagination.tsx` + the `LibraryFilters` URL-param pattern).
      Never expose `Batch.joinCode`. Add a `/calendar` month view of the same query.
      **This is the highest-value remaining item** ("a course ranked 7th is
      unreachable today").
- [ ] **2.1 Two front doors** — self-serve "Request enrolment" on the course page
      (infer STUDENT role, reuse the join-code OAuth-cookie mechanism in
      `app/join/actions.ts`); nomination via `/spoc` (SPOC pastes/uploads staff),
      `Invite` consumed at `/invite/[token]`, `inviteTraineeAction(batchId,email[])`
      in `app/admin/students/actions.ts`.
- [ ] **2.5 Progressive profile** — ask org/department/cadre on the enrolment
      request (where eligibility needs it); completion meter on the profile.
- [ ] **2.6 Public profile** — `/p/[slug]` read-only (whitelist fields — never
      `phone`/`governmentId*`/`resumeUrl`); verified certificates, work history,
      competencies, "open to mentoring". Default unlisted; `publicSlug` handle.
- [ ] Wire `evaluateEligibility` into the course/enrolment pages (advisory summary).
- [ ] Emit notifications for nomination invite, course starting, deadline near,
      certificate issued (models exist; hooks pending).

**Notification bell caveat:** it renders `<NotificationBell/>` (a server component
doing 2 indexed queries) once for desktop + once for mobile per page. Fine, but if
you want a single fetch, hoist the query into each role layout and pass data down.

---

## ⬜ Phases 3–6 — not started (see the plan)

- **Phase 3 — SWAYAM course experience:** `CourseWeek`; discussion forum
  (`DiscussionThread`/`DiscussionPost` — the missing 4th quadrant); `Assignment`
  (non-MCQ assessment); per-week progress.
- **Phase 4 — connect the live classroom** (highest value/hour, mostly wiring):
  implement `POST /api/transcribe` (Groq Whisper) + `/summary/*`; POST minutes to
  the already-written `app/api/live/minutes`; auto-attendance from LiveKit
  webhooks (`participant_joined/left`); Room Composite egress → `RECORDED_LECTURE`
  library item; transcript → `KnowledgeSourceKind.LIVE_CLASS`. Fix the honesty bug
  in `app/admin/meetings/actions.ts` (`hasNotes: true` unconditional).
- **Phase 5 — forecast operations simulator + Competency Passport** (the
  differentiator): `Competency`/`CompetencyEvidence`, `WeatherCase`, in-classroom
  drill on the tldraw whiteboard (per-trainee board via `roomName` suffix),
  `lib/forecast-verification.ts` (deterministic POD/FAR/CSI from IMD colour
  thresholds — unit-test the boundaries), assessed briefing + viva board,
  `/passport` PDF signed with the certificate HMAC. Add `lib/competency.ts`
  `scoreTrainee` (+ tests) — currently only trainer scoring exists.
- **Phase 6 — hardening:** SPOC national view, training-needs analytics, offline/
  low-bandwidth, Hindi, GIGW accessibility, anonymous three-way feedback.

**If time is short, the plan says ship 1, 2, 4 and a narrow 5.**

---

## Key conventions (don't fight these)

- `proxy.ts` locks SUPER_ADMIN to `/platform/*` — new admin surfaces go there.
- `requireAdmin()` rejects SUPER_ADMIN; `requireSuperAdmin()` rejects ADMIN;
  `requireStaff()` allows both.
- Prisma client is generated to `app/generated/prisma/` (import `Prisma` namespace
  from `@/app/generated/prisma/client`, enums from `.../enums`). Uses the
  `@prisma/adapter-pg` driver adapter.
- Server actions return `ActionState` (`lib/action-state.ts`); client forms use
  `useActionState`. Publish/revalidate precedent: `app/platform/announcements/actions.ts`.
- Next.js 16 — `searchParams`/`params` are Promises. Read local docs under
  `node_modules/next/dist/docs/` before writing framework code (AGENTS.md).
- Graceful degradation is the house style: `safeTrigger` (Pusher), `sendMail`
  (mailer), deterministic fallbacks (`lib/question-bank.ts`).
