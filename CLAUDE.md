# CLAUDE.md — Assistant Operating Instructions

## 🏛️ Project Structure
- `backend/` (Port 3001) — Express + TypeScript modular REST backend with Prisma PostgreSQL.
- `lms/` (Port 3000) — Next.js 16 LMS Portal (Admin/Student Dashboards, Quizzes, Batches, Fees).
- `live/` (Port 3002) — Next.js 16 LiveKit WebRTC Video Classroom & Tldraw Whiteboard.

## 🛠️ Common Commands
- `npm run dev:all` — Start all 3 workspaces concurrently with clean logging.
- `npm run dev:backend` — Start Express API on port 3001.
- `npm run dev:lms` — Start LMS on port 3000.
- `npm run dev:live` — Start Live Classroom on port 3002.
- `npm run build:backend` — Compile TypeScript backend (`tsc`).
- `npm run prisma:generate` — Generate Prisma Client.

## 🛡️ Coding Rules for Conflict-Free Teamwork
1. **Never create monolithic files**: Place new API logic in `backend/src/routes/<domain>.ts` and `backend/src/services/<domain>.service.ts`.
2. **Never break existing ports**: LMS `:3000`, Backend `:3001`, Live Classroom `:3002`.
3. **Additive changes only**: Add new files or components rather than heavily refactoring existing shared files.
4. **LiveKit Cloud**: Cloud server endpoint is `wss://livekit.opengrapes.com`. No local Docker required.
