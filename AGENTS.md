# 🤖 AI Agent & LLM Coding Guidelines for Capacity Connect

**Read this document before making any changes in this repository.**

This monorepo is designed to allow multiple AI agents (Claude, Antigravity, Cursor) and human developers to work concurrently without merge conflicts.

---

## 🎯 1. Monorepo Workspaces & Port Boundaries

| Workspace | Port | Purpose | Rule |
| :--- | :--- | :--- | :--- |
| `backend/` | `3001` | Modular Express REST API & LiveKit token server | **Never create monolithic routers**. Put new routes in `src/routes/<domain>.ts` and services in `src/services/<domain>.service.ts`. Mount in `src/app.ts`. |
| `lms/` | `3000` | Next.js LMS Dashboards, CMS, Quizzes | Follow Next.js App Router subfolder conventions (`app/admin/<feature>/` and `app/student/<feature>/`). |
| `live/` | `3002` | LiveKit Classroom, Tldraw Whiteboard | Extract reusable logic into `live/hooks/` and UI into `live/components/classroom/`. |

---

## 🛡️ 2. Rules to Prevent Merge Conflicts

1. **Additive Design (Create New Files)**:
   - When adding a new capability, create a **new file** rather than modifying existing service files.
   - Example: For AI essay evaluations, create `backend/src/services/assessmentEvaluation.service.ts` and `backend/src/routes/assessmentEvaluation.ts`.

2. **Decoupled Route Registration**:
   - Only add a single line to `backend/src/app.ts`:
     ```ts
     import newRouter from './routes/newDomain';
     app.use('/api/new-domain', newRouter);
     ```

3. **Prisma Schema Changes**:
   - Always verify that existing enum values (`Role`, `ApprovalStatus`, `SessionStatus`) and relations remain intact.
   - Run `npm run prisma:generate` after editing `schema.prisma`.

4. **Environment Variables**:
   - Never hardcode secrets. Always use `process.env` or `ENV` from `src/config/env.ts`.
   - Update `.env.example` in the relevant workspace when introducing a new variable.

5. **Type Safety & Build Verification**:
   - Always ensure `npx tsc --noEmit` passes in `backend/`.
   - Do not use `any` when explicit TypeScript interfaces can be defined.
