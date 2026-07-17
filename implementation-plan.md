# Implementation Plan

## Overview

The build followed Kiro's spec workflow end to end: requirements → design → tasks, then incremental implementation gated by two checkpoints. Work moved bottom-up through the stack — shared types/utilities and the Prisma schema first, then auth, then project/task services and routes, then the dashboard, then the frontend (auth pages → protected layout/dashboard → project pages → task pages), and finally the 404 page, toasts, and the seed script. This is captured in full detail in `.kiro/specs/project-tracker/tasks.md`.

## Task Breakdown

1. **Foundation** — shared TypeScript types (`src/types/index.ts`), `sanitize` utility, centralized `handleApiError`.
2. **Database layer** — `prisma/schema.prisma` (User/Project/Task models, enums, relations, indexes), Prisma client singleton, Zod schemas for auth/project/task.
3. **Authentication** — Auth.js JWT config, `auth.service.ts` (register/login/logout/session validation), auth API routes, route-protection middleware.
4. _Checkpoint 1 — all tests passing._
5. **Projects** — `project.service.ts` (CRUD, ownership checks, pagination, cascade delete) and `src/app/api/projects/**` routes.
6. **Tasks** — `task.service.ts` (CRUD, ownership via project, pagination/search/filter) and `src/app/api/tasks/**` routes.
7. **Dashboard** — `dashboard.service.ts` (stats + recent lists) and `src/app/api/dashboard/route.ts`.
8. _Checkpoint 2 — all tests passing._
9. **Frontend auth** — login/register pages and forms, API client with 10s timeout, TanStack Query provider.
10. **Frontend shell + dashboard** — protected layout, responsive sidebar/top bar, stats grid, recent lists.
11. **Frontend projects** — list page (search/filter/table-grid toggle/pagination), detail page (edit form, task list, create-task dialog).
12. **Frontend tasks** — global task list page with card grid, filters, and pagination.
13. **Polish** — 404 page, toast notification wiring.
14. **Seed script** — idempotent seed producing 1 user / 10 projects / 50 tasks.
15. _Final checkpoint — all tests passing._

## Milestones

- **M1 — Backend core complete**: auth, projects, tasks, dashboard APIs implemented and covered by property/unit tests (`npm test` green).
- **M2 — Frontend complete**: all pages implemented against the API, responsive across 320px/768px/1024px+.
- **M3 — Data & polish**: seed script, 404 page, and toast/error UX finished; full test suite green end to end.

## AI Usage Plan

Kiro was used throughout: drafting `requirements.md` from a plain-language feature description, turning approved requirements into `design.md` (architecture, Prisma schema, API contracts, correctness properties), breaking the design into `tasks.md`, and generating code and tests task-by-task so each change stayed small enough to review. Full detail is in `tool-workflow.md`.

## Risks

- **Ownership-check omissions**: forgetting a project/task ownership check in a route could leak or let a user mutate another user's data.
- **Validation drift**: client-side (React Hook Form + Zod) and server-side (route handler Zod schemas) validation getting out of sync.
- **Cascade-delete correctness**: deleting a project without properly removing all its tasks (orphaned rows) if not done in a transaction.
- **Pagination edge cases**: off-by-one errors in `totalPages`/`page` math, or requesting a page beyond the last page.
- **Error-detail leakage**: an unhandled exception path bypassing `handleApiError` and returning raw stack traces.

## Mitigation

- Ownership checks are centralized in the service layer (`project.service.ts` / `task.service.ts`), not duplicated ad hoc in route handlers, and are covered by the "ownership isolation" property test.
- Zod schemas live in `src/validators/*` and are imported by both server routes and (via shared types) client forms, avoiding duplicated validation logic.
- Cascading delete is implemented as a single Prisma transaction and covered by a dedicated property test.
- Pagination math is covered by a property test asserting `totalPages = ceil(total/pageSize)` and correct returned-item counts for arbitrary `(total, page, pageSize)` combinations.
- All route handlers funnel errors through `handleApiError`, and a property test asserts every error response matches `{ success: false, message }` with no internal details in 500s.
