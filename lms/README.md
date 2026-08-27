# Batch LMS

A full-stack Learning Management System for a single tutoring "batch" — built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL, and NextAuth.js (Auth.js).

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
- **Authorization** is re-verified on the server for every server action and protected page (via `requireAdmin()` / `requireApprovedStudent()`) — UI restrictions alone are never relied upon for security.
