# Capacity Connect

Capacity building and training management for the **Ministry of Earth Sciences** and the **India Meteorological Department**. Built for Smart India Hackathon 2026, Problem Statement 26075.

One platform, three roles. A ministry **Admin** governs the national picture, an IMD **Trainer** runs courses, and a **Trainee** learns, is assessed, and earns a credential anyone can verify without an account.

## Contents

- [Quick start](#quick-start)
- [The three roles](#the-three-roles)
- [Admin (MoES)](#admin-moes)
- [Trainer (IMD)](#trainer-imd)
- [Trainee](#trainee)
- [Public pages](#public-pages)
- [Live classroom](#live-classroom)
- [How the signature features work](#how-the-signature-features-work)
- [Project structure](#project-structure)
- [Environment](#environment)
- [Checks and contributing](#checks-and-contributing)

## Quick start

Requires Node.js 20+ and PostgreSQL.

```bash
npm install
cp lms/.env.example lms/.env          # set DATABASE_URL and DIRECT_URL
cp backend/.env.example backend/.env  # live/ needs no env file locally

cd lms
npx prisma migrate deploy
npm run db:seed                       # loads the MoES/IMD demo dataset
cd ..

npm run dev:all                       # LMS :3000, API :3001, classroom :3002
```

Open http://localhost:3000 and sign in:

| Role | Sign-in | Lands on |
| :--- | :--- | :--- |
| Admin (MoES) | `admin` / `Admin@2026` | `/platform` |
| Trainer (IMD) | `trainer` / `1234` | `/admin` |
| Trainee | `trainee` / `1234` | `/student` |

Other seeded accounts use their full email with `trainer123` or `trainee123`, for example `trainer.nwp@imd.gov.in` or `trainee.radar@imd.gov.in`. Bare usernames are a development convenience and are rejected when `NODE_ENV=production`.

The seed builds a complete scenario: 15 users, four courses (`NWP-2026`, `DWR-2026`, `AGRO-2026`, `CYC-2025`), 16 competencies, a 34-node knowledge graph, nine assessments with recorded attempts, certificates, announcements and library items.

## The three roles

The database enum values are historical. The UI labels are the ministry-facing ones, mapped in `lms/lib/roles.ts`.

| Database role | UI label | Portal | Scope |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Admin (MoES) | `/platform` | The whole institution: every trainer, course, trainee and metric |
| `ADMIN` | Trainer (IMD) | `/admin` | The courses they own, one active course at a time |
| `STUDENT` | Trainee | `/student` | The courses they are enrolled in |

Signing in routes each role to its own portal, and every page re-checks the role on the server rather than trusting the redirect. A course is a `Batch` in the schema; a trainer and a trainee both work "inside" one active course at a time, selected from their hub and remembered in a cookie.

---

## Admin (MoES)

The ministry portal at `/platform`. Top navigation: Dashboard, Competency, Skills, Announcements, Knowledge graph, Verify.

### Capacity dashboard `/platform`

National training capacity across trainers, courses and trainees.

- **Awaiting approval** sits first and is always shown, so the one thing needing action never moves. Approve or reject each trainer in place.
- **Outcomes**: Attendance, Certification rate, Assessment pass rate (green at 60% or above) and Certified personnel, each stating its denominator and its threshold, such as `27 attempts · pass mark 50%`.
- **Scale**: Trainers, Courses, Trainees and Enrolments.
- **Certified by department** and **Trainees by domain** bar charts, each captioned with its scale because one is an absolute percentage and the other is relative to the largest bar.
- **All trainers** table: status, plan, courses owned, trainees taught, with Approve, Suspend, Reinstate and Reject as the status allows.
- **All courses** table: course, trainer, trainee count, status, created date.
- **Suspended trainers** card with one-click Reinstate.

### Competency mapping `/platform/competency`

Rank approved trainers against a course's required competencies and assign the best fit. This is the answer to the problem statement's "identify suitable trainers per subject".

- Pick a course, then read a ranked list of every approved trainer with a match score out of 100, a progress meter, and a **Qualified** or **Mandatory gap** badge.
- Expand any trainer for a per-skill breakdown showing their level against the required level, marked **Met**, **Partial** or **Missing**, and a summary line such as `2 mandatory skills missing`.
- **Assign to course** transfers ownership of the course to the chosen trainer.

### Skills catalogue `/platform/skills`

The national competency taxonomy used by course requirements, trainer matching and the knowledge graph. Add a skill with a name, a category and a description, or delete one. Categories are Radar & Telemetry, NWP Modeling, Satellite Meteorology, Agro-Meteorology, Disaster Warning and WMO BIP-M Core.

### Announcements CMS `/platform/announcements`

Publish training-calendar notes, MoES advisories and achievements to the public homepage.

- Table of every announcement with category, published or draft status, featured star, view count and last-updated date.
- Compose with a title, summary, category, banner URL and a markdown body with a **Write / Preview** tab pair.
- Publish or unpublish, feature or unfeature, edit and delete. The public URL slug is derived from the title and de-duplicated automatically, and `publishedAt` is stamped only on the first publish.

### Knowledge graph editor `/platform/graph`

Curate the knowledge base that grounds the MeghDoot assistant.

**Import from a PDF or link** drafts concepts and links for review exactly as the trainer page does, but saves them nationally so every course can cite them. The manual forms below remain for precise edits.

- **Add a node**: name, one of ten types (concept, instrument, model, skill, standard, product, process, organisation, hazard, dataset), category, description, a citable source, an equation, and aliases.
- **Add a relation**: source node, target node, one of twenty relation types such as `MEASURES`, `REQUIRES_SKILL`, `GOVERNED_BY` or `PREREQUISITE_OF`, and a weight from 0.1 to 5.
- Filterable node and relation tables with delete. Every write invalidates the cache immediately, so a node added here is cited by the assistant on the very next question. That makes a compelling live demo.

---

## Trainer (IMD)

The trainer portal at `/admin`. The hub lists the courses you own; entering one switches the sidebar to that course's tools.

### Course hub `/admin`

Active courses, total trainees and pending requests at a glance, then a card per course showing level, trainee count, pending count and test count. **Create a course** captures name, domain, level, description, department, WMO tier and start and end dates, then generates an eight-character join code.

### Course dashboard `/admin/dashboard`

Approved trainees and active tests, plus preview cards for pending requests with inline Approve and Reject, upcoming meetings, recent notes and the fee position. A **Start meeting** button opens the live classroom, showing a pulsing indicator while a session is running.

### Trainees `/admin/students`

Approve, reject, revoke or restore access for anyone who joined with the course code. Approvals notify the trainee in real time.

### Meetings `/admin/meetings`

Schedule classes with a title, description, date and time, duration and an optional link. While a class is live, a board offers Rejoin and End class. For past classes you can:

- **Mark attendance** from a roster of approved trainees, with a "mark all present" shortcut and a running present count.
- Read the **AI-generated minutes** of the session.
- Download the **whiteboard notes** as a PDF.

### Notes and notices

**Notes** `/admin/notes` publishes markdown study material, with LaTeX rendered in both the card previews and the full note. Whiteboard exports from ended classes appear here automatically as read-only entries. **Notices** `/admin/notices` posts short announcements that land on every trainee's dashboard.

### Assessments `/admin/tests`

Create MCQ tests, then manage their questions.

- **Test settings**: title, subject, **duration in minutes** (blank means untimed), **pass mark** as a percentage, an optional **competency** the test certifies, and an optional closing date.
- **Question fields**: the stem, four options, the correct answer, marks, difficulty, an optional competency tag, and an **explanation shown to trainees on their results page**.
- **Generate with AI** `/admin/tests/[id]/generate` drafts 5 to 20 questions from a topic, a difficulty mix, and optionally the course's own notes as source material. Everything lands in an editable review table before insertion, with a live preview of any formula. Marks are set from difficulty: easy 1, medium 2, hard 3. Without a model key it draws from a built-in offline bank and says so.
- **Results** `/admin/tests/[id]/results` ranks every attempt by score with percentages and submission times.

### Library `/admin/library`

A resource shelf grouped into recorded lectures, presentations, documents and manuals. Add an item either by **uploading a file** (drag and drop, with a live progress bar, up to 200 MB, accepting video, PDF, slides, documents and images) or by **linking an external URL** such as YouTube or Drive. Each item carries a description, subject, duration and a competency tag.

### Competency `/admin/competency`

- **Required competencies**: define what the course demands as rows of skill, minimum level 1 to 5, weight, and whether it is mandatory. These drive both trainer matching and trainee recommendations.
- **My skills**: declare what you can teach, with a level and years of experience. Verification is granted by the ministry admin, so trainers cannot mark their own skills verified.
- **How you match this course**: your own match score and per-skill breakdown, the same view the ministry sees.

### Certificates `/admin/certificates`

A roster of approved trainees with their best assessment score and attendance, and one of three states: an **Issue** button, an already-issued certificate number with its grade and a **Revoke** button, or a plain-language reason why the trainee is not yet eligible.

### Feedback `/admin/feedback`

Averages for overall, content, trainer and infrastructure, a rating distribution, and the written comments. Comments are **anonymised**: only the author's designation is shown, never their name.

### Knowledge `/admin/knowledge`

Teach MeghDoot your course material without building a graph by hand. Upload a PDF, paste a link, or paste a passage, and the concepts inside come back as an editable draft. Nothing is saved until you press save.

- Every proposed concept is editable: name, type, description, category and aliases, with any row removable.
- Proposed links between concepts are shown as sentences you can re-point or delete.
- What you save is scoped to your course, so only your trainees see it. A national concept can be linked to, but never overwritten by a course.
- With no AI key configured it still works, drafting from the document's own heading structure and labelling the result an offline draft.

### MeghDoot AI `/admin/ai` and profile `/admin/profile`

The same assistant trainees get, in both modes. The profile page holds your professional identity and shows which of your skills the ministry has verified.

---

## Trainee

The trainee portal at `/student`. The hub covers all your courses; entering one switches the sidebar to that course.

### Joining a course

Enter the join code your trainer shared, sign in, and your request sits as **Pending** until the trainer approves it. The course shows a "Waiting" card until then, and you can cancel the request yourself.

### Course hub `/student` and dashboard `/student/dashboard`

The hub shows your top three recommendations, your joined courses with live-class indicators and counts of meetings, tests due and notes.

The dashboard is the week board for the active course:

- The **next or live class**, with a join control once the trainer is in the room.
- A **week strip** and a **timetable rail** on a real time axis, with attended and missed classes marked and the live slot lit up.
- **Attendance** as a percentage with a per-class register, **results** for every attempt including your **rank within the cohort**, recent notes, notices from your trainer, and your doubts.
- A prompt to leave feedback once the course end date has passed.

### Meetings, notes and library

**Meetings** `/student/meetings` joins the live class and, for past ones, opens the minutes and the whiteboard PDF, with an Attended or Missed badge. **Notes** `/student/notes` renders markdown and LaTeX. **Library** `/student/library` filters by type, subject and competency, and plays each item in place: YouTube embeds, a native video player, an inline PDF viewer, or a download.

### Assessments `/student/tests`

One attempt per test, graded on submission.

- Timed tests show a **countdown** that survives a page refresh, turns red in the final minute, and **auto-submits at zero**.
- The result view shows your score against the test's own pass mark, every question colour-coded with your answer and the correct one, the **explanation** where the trainer wrote one, and which competency the question assessed.
- Passing a test tagged with a competency raises your level in it automatically.

### Recommendations `/student/recommendations`

Courses matched to your skill gaps, assessment history and posting, each with a transparent reason rather than an opaque score. Cards show a fit multiplier such as `2.4×` and chips explaining exactly why:

- `Closes a 2-level gap in Radar Velocity De-aliasing (required 4, you have 2)`
- `You scored 45% in Radar Velocity De-aliasing`
- `Your posting at DWR Machilipatnam matches this Radar & Telemetry course`
- `Offered by your department (IMD)` and `Counts toward WMO BIP-M`

**Request to join** creates a pending enrolment without leaving the page.

### Competencies `/student/competency`

A radar chart of your average level in each WMO competency area, and a list of every skill with its provenance badge: **Certified** from a certificate, **Assessment** from a test, or **Self-declared**. You can declare a skill, but you cannot lower a level you earned from an assessment or certificate.

### Certificates `/student/certificates`

Earned certificates with their number, grade and score, plus every course where you can **Claim** one or a plain-language reason why not. Eligibility is approved enrolment, at least one attempt, a best score of 60% or better, and 75% attendance where attendance has been marked. Grades are Distinction at 85%, Merit at 70%, otherwise Pass.

The printable sheet is A4 landscape with Government of India, MoES and IMD wordmarks in text, the recipient and course, the grade, the certificate number, a verification URL and a **QR code** that opens the public verifier. **Print / Save as PDF** uses the browser's print dialog.

### Profile `/student/profile` and MeghDoot `/student/ai`

The profile holds qualifications, experience, interests and posting, which feed the recommender. Your skills and certificates are summarised alongside, each with a verify link.

MeghDoot has two modes. **Course assistant** answers from your course notes, class summaries and doubts. **MeghDoot Copilot** answers from the meteorology knowledge graph and shows the exact nodes it used as citation chips. Both support image attachments, a thinking-process accordion, saved chat threads, and a context panel for attaching a note or a class summary to your next question.

---

## Public pages

No account required.

- **`/`** the homepage: hero, published announcements, upcoming courses with live counts of certified personnel and trainees, a certificate-verification box, and sign-in.
- **`/announcements`** filterable by category, with `/announcements/<slug>` for each. Drafts return 404 and published pages count views.
- **`/verify`** and **`/verify/<hash>`** check a certificate by number or signature and answer with one of four states: **Valid**, **Revoked**, **Tampered** or **Not found**, alongside the recipient, course, grade and issue date. The endpoint is rate-limited per IP.

## Live classroom

Starting a class hands off from the LMS to the classroom app on port 3002 through a short-lived signed token, which the backend exchanges for a LiveKit room token after verifying the signature and the user's enrolment. The room provides WebRTC video and audio, a collaborative tldraw whiteboard with live cursors, screen sharing with annotation, chat, participants, an in-session AI doubt solver, speech transcription, and rolling summaries that become the minutes of the meeting.

## How the signature features work

**Trainer matching** scores each trainer as the weighted average of `min(1, level ÷ required)` across the course's requirements, times 100, with +5 for a verified skill and up to +5 for experience. A trainer qualifies with no missing mandatory skill and a score of 60 or more; any missing mandatory skill caps the displayed score at 45.

**Recommendations** multiply three factors: the weighted sum of your skill gaps, 1.4 if you failed a related assessment, and 1.3 if your posting or department matches the course. Each factor becomes one of the reason chips, so the ranking is always explainable.

**Certificates** are signed with HMAC-SHA256 over the certificate number, recipient, course and issue date. The public verifier recomputes that signature, so an altered record reports **Tampered** rather than passing as genuine.

**MeghDoot** extracts terms from your question, scores seed nodes in the knowledge graph, walks up to two hops in both directions, and grounds the answer on the resulting paths, returning the nodes it used as citations.

**Everything works without an API key.** Without `DEEPSEEK_API_KEY`, MeghDoot answers from the graph alone, showing the connecting paths and sources, and the question generator uses the offline bank. Matching, recommendations and certificates never call a model at all.

## Project structure

| Workspace | Port | Responsibility |
| :--- | :--- | :--- |
| [`lms/`](./lms) | 3000 | Every portal and domain feature. Next.js 16, Prisma 7, Auth.js v5, Tailwind v4 |
| [`backend/`](./backend) | 3001 | Live-classroom token exchange and the AI doubt solver. Express, Prisma 6 |
| [`live/`](./live) | 3002 | LiveKit classroom and tldraw whiteboard. Next.js 16 |

The ports are fixed; the classroom handoff and CORS depend on them. The two Prisma workspaces use separate databases.

Inside `lms/`, `app/platform`, `app/admin` and `app/student` hold one folder per feature with its own `actions.ts`; `lib/` holds the scoring, graph, certificate and metrics logic as dependency-free modules with unit tests in `lib/__tests__/`; `prisma/` holds the schema, migrations and seed.

**Build features in `lms/`.** The backend's profile, competency, certificate, feedback, announcement and analytics routers are historical and unused; only its live-meeting endpoints are on the critical path.

## Environment

Beyond the database and Auth.js basics in `lms/.env.example`:

| Variable | Notes |
| :--- | :--- |
| `CERTIFICATE_SECRET` | Signs certificate hashes, 16 characters minimum. Changing it invalidates issued certificates. |
| `UPLOAD_DIR` | Library uploads, defaults to `./uploads`. Swap `lms/lib/storage.ts` for object storage on serverless hosts. |
| `LIVE_OPENGRAPES_JWT_SECRET` | Must be identical in `lms/.env` and `backend/.env`. |
| `DEEPSEEK_API_KEY` | Optional. Without it every AI feature falls back deterministically. |
| `GROQ_API_KEY` | Optional. Extracts concepts from uploaded documents; without it ingestion drafts from headings. |
| `FIRECRAWL_API_KEY` | Optional. Enables the "paste a link" tab. PDF upload and pasted text work without it. |

`npm run prisma:generate` covers the backend only; the LMS client is generated by its own `postinstall`.

## Checks and contributing

```bash
cd lms && npx tsc --noEmit && npm run lint && npm run test && npm run build
```

Branch from `dev`, never commit to `dev` or `main`. Add new files rather than restructuring shared ones: a folder per feature under the relevant portal, pure logic in `lib/` with tests, and additive schema changes only.

More detail in [lms/README.md](./lms/README.md), [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md), [AGENTS.md](./AGENTS.md) and [lms/DESIGN.md](./lms/DESIGN.md).

## License

MIT. Team OpenGrapes.
