# PR Description

## Summary

Implements Project Tracker, a full-stack Next.js 15 application for managing projects and tasks: authentication, per-user ownership isolation, project/task CRUD with pagination/search/filtering, a dashboard with aggregate stats and recent-item lists, a responsive Material UI frontend, a seed script, and a Vitest + fast-check test suite.

## Features Implemented

- User registration, login, and idempotent logout with JWT-based sessions (24h expiry) via Auth.js.
- Route protection middleware: 401 for unauthenticated API calls, redirect-to-login-with-callback for unauthenticated page visits.
- Project CRUD: create (with defaults), paginated list with search + status filter, get-with-tasks, partial update, cascading delete.
- Task CRUD: create (scoped to an owned project), global paginated list with search + status/priority filter, get, partial update, delete.
- Dashboard: total/active/completed project counts, total/pending/completed task counts, 5 most recently updated projects and tasks — all scoped to the authenticated user.
- Ownership isolation: any cross-user access to a project/task returns 404.
- Responsive frontend: collapsible sidebar below 768px, stat-card grid reflow, scrollable/stacked tables on mobile, skeleton loaders, toast notifications for errors.
- Dedicated 404 page reachable without an auth redirect.
- Idempotent database seed script (1 user, 10 projects, 50 tasks, all statuses/priorities represented).

## Technical Changes

- `prisma/schema.prisma` — `User`, `Project`, `Task` models with `ProjectStatus`, `TaskStatus`, `Priority` enums, relations, and indexes.
- `src/validators/*.schema.ts` — Zod schemas for auth, project, and task, including the `sanitize()` transform and the `endDate >= startDate` refinement.
- `src/services/*.service.ts` — business logic layer (auth, project, task, dashboard), owning ownership checks, pagination, and cascade-delete transactions.
- `src/app/api/**/route.ts` — Route Handlers implementing the REST API per `api-contract.md`.
- `src/middleware.ts` — auth gating for protected pages/APIs.
- `src/lib/error-handler.ts` — centralized error → JSON response mapping (`ZodError`, `AppError`, Prisma known errors, unknown → 500).
- `src/app/(auth)/**`, `src/app/(protected)/**`, `src/components/**`, `src/hooks/**` — frontend pages, Material UI components, and TanStack Query hooks.

## Database Changes

Initial migration `prisma/migrations/20260714090715_init` creates the `users`, `projects`, and `tasks` tables with the enums, foreign keys (cascade delete from `User`→`Project` and `Project`→`Task`), and indexes described in `design-notes.md`.

## Testing Done

`npm test` (Vitest) — 12 test files, 84 tests, all passing: unit tests for the sanitize utility, error handler, auth service, auth routes, and middleware; property-based tests (fast-check, ≥100 iterations each) covering all 19 correctness properties in `design.md` (validation, sanitization, pagination, search/filter correctness, ownership isolation, partial-update field preservation, cascading delete, dashboard accuracy/ordering, auth round-trip/idempotence, error-format consistency, seed idempotence). See `test-strategy.md` for the full mapping and known gaps (no frontend component tests or E2E yet).

## AI Usage Summary

Built using Kiro's spec-driven workflow (requirements → design → tasks) with task-by-task code and test generation, each change reviewed against diagnostics/build output before acceptance. Full detail in `tool-workflow.md`, `implementation-plan.md`, and `reflection.md`.

## Screenshots / Demo Notes

_[Attach dashboard, project list (table + grid view), project detail, and task list screenshots/GIFs here.]_

## Known Limitations

- No frontend component or E2E test coverage yet (manual verification only for skeleton loaders, responsive breakpoints, and toast behavior).
- No integration test suite against a live seeded test database; property/unit tests exercise the service layer directly.
- No password-reset flow, no role-based access beyond flat per-user ownership, no soft-delete/archive for projects.
- Session invalidation on logout is application-level (JWT strategy), not a revocable server-side session store.

## Future Improvements

- Add Playwright E2E coverage for the core flow (login → create project → add task → dashboard).
- Add frontend component tests (React Testing Library) for responsive/loading/error states.
- Add an integration test suite against a real test database for the seed script and full request/response cycle.
- Consider a password-reset flow and project sharing/collaboration if the product scope expands beyond single-owner data.
