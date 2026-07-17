# Candidate Information

Name: _[your name]_ / Role: _[role applied for]_ / Primary Technology Stack: TypeScript, Next.js 15 (App Router), React 19, PostgreSQL, Prisma
Primary AI Tool Used: Kiro (spec-driven AI IDE) / Project Option Selected: Project Tracker (project & task management dashboard)
Assessment Start Date: _[fill in]_ / Submission Date: _[fill in]_

## Project Summary

Project Tracker is a full-stack Next.js 15 application that lets authenticated users manage projects and tasks from a single dashboard. Users register and log in, then create projects (name, description, status, priority, dates, progress), break projects into tasks (title, description, status, priority, due date), and track everything from a dashboard showing live counts and recently updated items. Data is scoped per-user with no shared visibility between accounts.

## Tools Used

- **Kiro** for the full spec-driven workflow: requirements (EARS format) → design (architecture, Prisma schema, API contracts, correctness properties) → tasks (incremental implementation plan) → code generation and property/unit test generation.
- **Prisma** for schema modeling, migrations, and the seed script.
- **Vitest + fast-check** for unit and property-based tests.
- **Material UI + React Hook Form + Zod** for the frontend forms and layout.
- **TanStack Query** for client-side data fetching/caching.

## Setup Summary

1. `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
3. `npx prisma migrate dev` to create the schema in PostgreSQL.
4. `npm run` (prisma seed script, configured via the `prisma.seed` field in `package.json`) to populate 1 user, 10 projects, and 50 tasks.
5. `npm run dev` to start the app at `http://localhost:3000`.
6. `npm test` to run the Vitest suite (unit + property tests, 12 files / 84 tests, all passing as of this writing).
