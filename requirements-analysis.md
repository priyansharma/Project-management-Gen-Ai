# Requirement Analysis

## Selected Project Option

Project Tracker — a full-stack project and task management application with authentication, dashboard analytics, and per-user data ownership. Built on Next.js 15 (App Router), PostgreSQL via Prisma, Auth.js (NextAuth) for sessions, Material UI for the interface, and Zod for validation.

## My Understanding (in your own words)

The app needs to let a user sign up, log in, and then manage two related resources: **Projects** and **Tasks** (each Task belongs to exactly one Project). Every user only sees their own data — there's no team sharing or roles, just simple per-owner isolation. On top of CRUD for both resources, there's a dashboard that aggregates counts (total/active/completed projects, total/pending/completed tasks) and shows the 5 most recently updated projects and tasks. All API responses follow one consistent envelope (`{ success, data/message }` or `{ success, message, errors }`), all input is validated with Zod and sanitized against XSS, and the UI has to remain usable from a 320px mobile viewport up through desktop.

## Functional Requirements

- User registration (name, email, password) with bcrypt password hashing and duplicate-email rejection.
- User login returning a session token (24h expiry) and logout that invalidates the session and is idempotent.
- Route protection: unauthenticated API calls get 401, unauthenticated page visits redirect to `/login?callbackUrl=...`.
- Dashboard: stats (6 counts) + 5 most recent projects + 5 most recent tasks, all scoped to the logged-in user.
- Project CRUD: create (with defaults for description/status/progress), list with pagination/search/status filter, get by id (with tasks), partial update, cascade delete (project + its tasks).
- Task CRUD: create (tied to a project the user owns), list with pagination/search/status+priority filter, get by id, partial update, delete.
- Ownership isolation: any access to another user's project/task returns 404 (not 403, to avoid leaking existence).
- Seed script producing 1 user, 10 projects (covering all statuses/priorities), 50 tasks (covering all statuses/priorities, ≥2 tasks/project), and idempotent on repeated runs.
- 404 page for unmatched routes, reachable without auth redirect.

## Non-Functional Requirements

- Consistent JSON error envelope (`{ success: false, message }`, plus `errors[]` for field-level validation failures) with correct HTTP status codes (400/401/404/500) and no leaked internals in 500 responses.
- Input validation via Zod on every request body/query, with trimming + HTML-tag stripping (XSS mitigation) on all string fields.
- SQL injection prevention via Prisma's parameterized queries (no raw SQL).
- Performance: API responses within 500ms locally at 100-record scale; skeleton loaders within 100ms of a fetch starting; 10s client-side request timeout.
- Responsive design at 320px/768px/1024px breakpoints, hamburger sidebar below 768px, 44×44px minimum touch targets on mobile.
- Client-side caching via TanStack Query (≥30s stale time) to reduce redundant calls.

## Assumptions

- Single-tenant ownership model: no admin role, no shared/team projects — every authenticated user has identical permissions over only their own data.
- "Session token" is implemented via Auth.js JWT strategy rather than a server-side session store, so logout invalidation is handled at the application layer (the API routes and auth service treat the token as invalid going forward) rather than by revoking a stateless JWT itself.
- Search is a simple case-insensitive substring match (`contains`), not full-text search.
- Pagination defaults (page size 10, max 50) are fixed constants rather than per-user configurable settings.
- Dates (`startDate`/`endDate`/`dueDate`) are stored and compared as UTC `DateTime` values; no timezone-per-user handling.

## Clarifications (questions for a product owner)

- Should there be any role beyond a single flat "authenticated user" tier (e.g. admin, project collaborators/sharing)?
- Should deleted projects be soft-deleted/archived for audit purposes instead of hard-deleted along with their tasks?
- Is full-text/fuzzy search needed for project and task names, or is substring match sufficient long-term?
- Should there be a password reset / forgot-password flow, or is that out of scope for this iteration?
- Are file attachments, comments, or activity history on tasks/projects planned for a future iteration?

## Edge Cases

- Registering with an email that already exists → 400, no user created.
- Login with a correct email but wrong password (and vice versa) → 401 with a generic message that doesn't reveal which field was wrong.
- Logout called multiple times on the same session → always 200, never an error.
- Requesting/updating/deleting a project or task that doesn't exist → 404.
- Requesting/updating/deleting a project or task owned by a different user → 404 (not 403).
- Project creation with `endDate` earlier than `startDate` → 400 with a date-constraint error.
- Task creation referencing a `projectId` that doesn't exist or isn't owned by the caller → 404.
- Pagination request beyond the last page → empty `data` array with correct `totalPages`/`total` metadata, not an error.
- Status/priority filter values that aren't valid enum members → 400.
- Missing or non-JSON request body → 400 ("Request body is missing or malformed").
- A user with zero projects/tasks viewing the dashboard → all counts zero, empty-state message shown.
- Deleting a project that has tasks → all tasks removed in the same transaction, no orphaned rows.
- Network failure or a request exceeding the 10s client timeout → "server unreachable" toast rather than a silent failure.
