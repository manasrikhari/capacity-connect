# Capacity Connect (LMS portal)

A full-stack platform for **digital capacity building in India's weather and climate services** (MoES / IMD) — built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL, and NextAuth.js (Auth.js). Historically this workspace began as a single-batch tutoring LMS; the core data model is reused and remapped for the ministry context.

## Roles & demo credentials

The `Role` enum values are unchanged in the database and mapped to MoES/IMD-facing labels (see `lib/roles.ts`):

| DB role | Label | Home | Demo login |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | **Admin** (MoES) | `/platform` | `admin` / `Admin@2026` |
| `ADMIN` | **Trainer** (IMD) | `/admin` | `trainer` / `1234` |
| `STUDENT` | **Trainee** | `/student` | `trainee` / `1234` |

The public homepage (`/`) shows published announcements, active-course previews, a certificate-verification widget, and the sign-in card. `/announcements` and `/verify` are reachable without signing in.

- Admins approve trainers, publish announcements (`/platform/announcements`), curate the GraphRAG knowledge graph (`/platform/graph`), and track national capacity metrics.
- **MeghDoot** is the in-app AI assistant, grounded in the knowledge graph. Editing a node/relation in the graph editor invalidates the GraphRAG cache immediately, so MeghDoot cites new content live.

## Features

**Students** sign in with Google. New sign-ups are `PENDING` until a teacher approves them.

- **Meetings** — view scheduled live sessions, join live meetings, see status (Upcoming / Live / Ended)
- **Notes** — browse study material shared by the teacher (rendered from markdown)
- **Tests** — attempt active MCQ tests (one attempt per test), auto-graded instantly with a result breakdown
- **Fees** — read-only view of total fee, amount paid, outstanding balance, and payment history

**Admins** sign in with email/password.

- **Students** — approve / reject pending sign-ups, revoke or restore access
- **Meetings** — schedule, edit, start, end, and delete live sessions
- **Notes** — create, edit, and delete study material
- **Tests** — create tests, manage MCQ questions (A–D options + correct answer + marks), activate/deactivate, view per-student results
- **Fees** — set each student's total fee and record payments; status (Paid / Partially paid / Unpaid) is always computed from payments, never stored

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL (`pg` driver adapter)
- [NextAuth.js (Auth.js v5)](https://authjs.dev) — Google OAuth (students) + Credentials (admin)
- [Zod](https://zod.dev) for validation
- [react-hot-toast](https://react-hot-toast.com) for notifications

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by the app (pooled, if your provider offers one) |
| `DIRECT_URL` | Direct (non-pooled) Postgres connection string, used by Prisma Migrate |
| `NEXTAUTH_URL` | Base URL of the app, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret used to sign session tokens — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (see below) |
| `CERTIFICATE_SECRET` | HMAC secret used to sign and verify certificate IDs at `/verify`. Any random string; keep it stable so previously issued certificates stay verifiable. |
| `UPLOAD_DIR` | Filesystem directory where uploaded resources (library items, resumes, banners) are written and served from. Defaults to a local `uploads/` folder if unset. |
| `OPENAI_API_KEY` / LLM provider keys | Optional. When absent, MeghDoot, assessment generation, and the recommender all fall back to deterministic offline logic (see notes below). |

### 3. Set up Google OAuth (for student sign-in)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or select an existing one).
2. Navigate to **APIs & Services → OAuth consent screen** and configure it (User type: External is fine for testing). Add your email as a test user if the app is in "Testing" mode.
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Choose **Web application** as the application type.
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (replace the host with your production URL when deploying)
6. Copy the generated **Client ID** and **Client Secret** into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

> Note: Admin accounts always use the email/password (Credentials) login, never Google — the app blocks Google sign-in for admin-role accounts.

### 4. Set up the database

```bash
npx prisma migrate dev
npm run db:seed
```

The seed script creates:

- An **admin** account: `admin@lms.com` / `admin123`
- 3 sample approved students (Aarav Sharma, Diya Patel, Rohan Mehta)
- Sample meetings, notes, an active "Algebra Basics Quiz" test, and fee/payment records

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as the admin to manage the batch, or sign in with Google as a student (new accounts will need approval from the **Students** page in the admin dashboard before they can access the dashboard).

## Other scripts

```bash
npm run build      # production build
npm run start      # run production build
npm run lint       # lint the codebase
npm run db:studio  # open Prisma Studio to inspect the database
npm run db:migrate # run/create Prisma migrations
```

## Notes on key design decisions

- **Money** is stored as integers in paise (₹ × 100) and only formatted as rupees in the UI.
- **Fee status** (Paid / Partially paid / Unpaid) is always derived from `sum(payments)` vs `totalAmount` at read time — it is never stored.
- **Meeting status** automatically shows as "Ended" in the UI once a meeting's scheduled time is more than 3 hours in the past, even if an admin never pressed "End Meeting".
- **Authorization** is re-verified on the server for every server action and protected page (via `requireAdmin()` / `requireSuperAdmin()` / `requireApprovedStudent()`) — UI restrictions alone are never relied upon for security.

## Capacity Connect notes

- **Offline / no-LLM fallbacks.** The platform runs fully without any LLM API key. When no provider is configured:
  - **MeghDoot** answers from the local GraphRAG knowledge graph (in-memory BFS over `KnowledgeNode`/`KnowledgeRelation`) instead of a chat model — grounded, citation-first, deterministic.
  - **Assessment generation** falls back to the seeded question bank / templates rather than model-generated items.
  - **The recommender** falls back to keyword/affinity matching (`lib/taxonomy.ts` `DOMAIN_KEYWORDS`) instead of embeddings.
  This keeps demos reproducible on an air-gapped machine.
- **GraphRAG cache.** `lib/graphrag-db.ts` caches the whole graph for 60s; the admin graph editor calls `invalidateGraphCache()` on every create/delete so MeghDoot reflects edits immediately.
- **Certificate verification.** Certificate IDs are HMAC-signed with `CERTIFICATE_SECRET` and checked at the public `/verify` page — no login required.
- **Backend `domain` routes are intentionally unused.** The Express backend (`backend/`, port 3001) ships a set of `domain` REST routes that are **not wired into the LMS**. The capacity-building features (competency, skills, announcements, knowledge graph, metrics) are implemented directly in the Next.js app via Prisma and server actions. The backend routes are kept for reference/future use and can be ignored when running the LMS portal.
- **Money** fields (paise) remain in the schema from the LMS lineage but are not surfaced on the ministry dashboard, which tracks attendance, completion, certification, and assessment pass-rate instead.
