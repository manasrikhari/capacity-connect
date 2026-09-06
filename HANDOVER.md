# Capacity Connect — PS 26075 Implementation Handover

Branch: `feat/capacity-connect`. This tracks the multi-phase plan to complete
Problem Statement 26075 and add the WMO/IMD-aligned differentiators. Phases ship
independently; the product stays coherent if you stop after any phase.

**Verification gate (run from `lms/`):**
```bash
npx tsc --noEmit && npm run lint && npm run test
# full: also `npm run build` (needs a DB; see Local dev below)
```
Current state: **tsc 0 errors · lint 0 errors (50 pre-existing warnings) · 258 tests pass.**
(Backend also typechecks: `cd backend && npx tsc --noEmit`.)

> **Prisma client:** after pulling, run `cd lms && npx prisma generate` before
> `tsc` — the checked-in schema is ahead of the generated client, which is
> gitignored. Do the same in `backend/` if its schema moved.

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

## ✅ Phase 2 — Onboarding & catalogue (COMPLETE)

Schema/notifications/eligibility as before, plus the front-of-house that landed
on the branch: **public course catalogue** (`/courses`, `/courses/[slug]`,
`/calendar` — never exposes `joinCode`; `lib/catalogue.ts` pure + `catalogue-db.ts`),
**two front doors** (self-serve request-enrolment + nomination via `/spoc` and
`/invite/[token]`; `lib/invite.ts`, `lib/spoc.ts`), **progressive profile**
onboarding (`components/welcome/OnboardingForm.tsx`), and the **public profile**
`/p/[slug]` (`lib/public-profile.ts`, whitelisted fields only).

## ✅ Phase 3 — SWAYAM course experience (COMPLETE)

`CourseWeek`, the `DiscussionThread`/`DiscussionPost` forum, rubric-graded
`Assignment`/`AssignmentSubmission`, per-week progress and content views
(`lib/course-week.ts`/`-db.ts`, `lib/discussion-db.ts`, `lib/rubric.ts`;
migrations `…0004_phase3_swayam_weeks`, `…0005_content_views`).

## 🟢 Phase 4 — Live classroom (LARGELY COMPLETE)

Three services: `lms/` (3000, Prisma + `/api/live/*` receivers), `backend/`
(3001, Express + `livekit-server-sdk`, webhook handler + `notifyLms`), `live/`
(3002, pure LiveKit frontend). backend→LMS calls ride the existing
`LIVE_OPENGRAPES_JWT_SECRET` `live-service` JWT (`authenticateLiveService`).

### Done and committed
- **Honesty fix** — `setMeetingStatus` reports `hasNotes` from whether a
  `MeetingMinutes` row exists, not `true` unconditionally.
- **Auto-attendance** — `POST /api/live/attendance` (LMS) + `lib/attendance.ts`
  (pure roster/threshold logic, 15 tests); backend `PresenceService` accumulates
  presence from `participant_joined/left` webhooks (identity→LMS-user map captured
  at token mint) and posts the roster on `room_finished`.
- **Transcription → minutes → knowledge** — backend `transcribeAudio` (Gemini,
  same key rotation as OCR) feeds a per-room `TranscriptService`; `/api/summary`
  gives a rolling summary; on end-class the transcript is posted to LMS
  `POST /api/live/transcript`, which stores it on `LiveSession.transcript`,
  distils minutes (`lib/minutes.ts` — Groq or extractive fallback, 6 tests) and
  registers a `LIVE_CLASS` `KnowledgeSource`. Migrations `…0006`, `…0007`.

### NOT yet done in Phase 4
- [ ] **Room Composite egress → `RECORDED_LECTURE` library item.** No
      `EgressClient` exists (`backend/src/config/livekit.ts`) and it needs a
      LiveKit egress storage target (S3/GCS) — deferred rather than shipping an
      uncalled LMS receiver. Plan: start egress on session-start when storage
      env is set; handle `egress_ended` in `LivekitService.handleWebhook`; POST
      the file URL to a new `POST /api/live/recording` that creates the
      `LibraryItem` (uploader = batch owner, `type: RECORDED_LECTURE`).
- [ ] Enable `participant_*` (and `egress_*`) webhooks on the LiveKit project —
      without them attendance/egress never fire.

## 🟢 Phase 5 — Forecast simulator + Competency Passport (CORE LANDED)

### Done and committed
- **`lib/forecast-verification.ts`** — deterministic POD/FAR/CSI/bias/accuracy
  from a 2×2 contingency table built off IMD colour thresholds, + a CSI→grade
  band for the passport. 11 boundary tests.
- **`lib/competency.ts` `scoreTrainee`** — trainee attainment + passport band +
  per-skill gaps (counterpart to `scoreTrainer`). 4 tests.

### NOT yet done in Phase 5
- [ ] Schema: `Competency`/`CompetencyEvidence`, `WeatherCase`.
- [ ] In-classroom drill on the tldraw whiteboard — per-trainee board by varying
      the `roomName` segment in `live/`'s `useSync` uri (`${roomName}:${traineeId}`);
      no backend change needed for the board id itself.
- [ ] Assessed briefing + viva board; `/passport` PDF signed with the certificate HMAC.

## 🟡 Phase 6 — Hardening (PARTIAL)

Landed: training-needs analytics + the ministry analyst that cannot invent a
figure (`lib/analyst.ts`, `…/platform`). Remaining: SPOC national view,
offline/low-bandwidth, Hindi, GIGW accessibility, anonymous three-way feedback.

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
