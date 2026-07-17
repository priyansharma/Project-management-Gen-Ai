# Design Notes

## Architecture Overview (frontend, backend, database)

Next.js 15 App Router provides both frontend and backend in one codebase: React Server/Client Components render the UI, and colocated Route Handlers under `src/app/api/**` serve as a REST-style backend. The backend is layered as `route handler → Zod validator → service layer → Prisma → PostgreSQL`, with a centralized error handler (`src/lib/error-handler.ts`) turning any thrown error (ZodError, known AppError, Prisma error, or unknown) into the same JSON envelope. Auth.js issues JWT-based sessions (24h expiry), and `src/middleware.ts` gates access to protected pages/APIs at the edge before a request reaches a page or route handler. The frontend uses TanStack Query as the data layer between components and the API client (`src/lib/api-client.ts`), giving 30s+ stale-time caching and a global error→toast handler.

## Frontend Design

- **Layouts**: `(auth)` route group for `/login` and `/register` (no sidebar); `(protected)` route group for `/dashboard`, `/projects`, `/projects/[id]`, `/tasks` (Sidebar + TopBar shell, auth-gated).
- **State/data**: `useDashboard`, `useProjects`, `useTasks` hooks wrap TanStack Query for fetching/caching; `react-hook-form` + `@hookform/resolvers` (Zod) drive all forms (login, register, project form, task dialogs).
- **UI library**: Material UI (`@mui/material`, `@mui/icons-material`, Emotion) for components, theming, and responsive breakpoints.
- **Responsiveness**: Sidebar collapses to a hamburger overlay below 768px; stat cards go single-column below 768px and multi-column at/above it; tables become scrollable/stacked below 768px; interactive elements keep a 44×44px minimum touch target on mobile.
- **Feedback**: skeleton loaders appear within 100ms of a fetch starting; toast notifications (Snackbar-style) surface API and network errors.

## Backend Design

- **Route handlers** (`src/app/api/**/route.ts`) are thin: extract/verify the Bearer token via `authService.validateSession`, parse/validate input with the relevant Zod schema, delegate to a service, and shape the JSON response. See `design.md`'s API endpoint table for the full route list.
- **Service layer** (`src/services/*.service.ts`) owns business logic and Prisma access: `auth.service.ts` (register/login/logout/session validation), `project.service.ts` and `task.service.ts` (CRUD + ownership checks + pagination/search/filter), `dashboard.service.ts` (stats + recent-item queries).
- **Auth model**: Bearer token in the `Authorization` header, validated per-request via `authService.validateSession`; no role-based access — every authenticated user has identical permissions scoped to their own `ownerId`.
- **Response envelope**: `{ success: true, data?, message? }` for success, `{ success: false, message, errors? }` for errors, and `{ success: true, data: T[], pagination: { total, page, pageSize, totalPages } }` for list endpoints.

## Database Design

PostgreSQL via Prisma, three models:

- **User** (`users`): `id` (UUID), `name` (varchar 100), `email` (unique, varchar 255), `password` (bcrypt hash), timestamps. One-to-many with `Project` (cascade delete).
- **Project** (`projects`): `id` (UUID), `name` (varchar 255), `description` (text, default ""), `status` (`ProjectStatus`: Planned/Active/Completed, default Planned), `priority` (`Priority`: Low/Medium/High), `startDate`/`endDate` (nullable), `progress` (int 0–100, default 0), `ownerId` → `User`, timestamps. Indexed on `ownerId`, `status`, `name`. One-to-many with `Task` (cascade delete).
- **Task** (`tasks`): `id` (UUID), `title` (varchar 255), `description` (text, default ""), `status` (`TaskStatus`: Todo/InProgress/Done, default Todo), `priority` (`Priority`), `dueDate` (nullable), `projectId` → `Project`, timestamps. Indexed on `projectId`, `status`.

Cascading deletes are enforced both at the Prisma relation level (`onDelete: Cascade`) and implemented explicitly as a transaction in `project.service.ts` for the project+tasks delete flow.

## Validation Strategy

Zod schemas in `src/validators/*.schema.ts` are the single source of truth for input shape, applied server-side in every route handler before any service logic runs. Schemas enforce type, length, and enum constraints (`registerSchema`, `loginSchema`, `createProjectSchema`/`updateProjectSchema`/`projectListParamsSchema`, `createTaskSchema`/`updateTaskSchema`/`taskListParamsSchema`), plus a cross-field refinement on `createProjectSchema` requiring `endDate >= startDate` when both are present. All string fields run through a shared `sanitize()` transform (trim + strip HTML tags) to guard against XSS. Query-string pagination params use `z.coerce.number()` so string query params coerce to numbers before range checks.

## Error Handling Strategy

A single `handleApiError(error)` function in `src/lib/error-handler.ts` is called from every route handler's `catch` block: `ZodError` → 400 with per-field `errors[]`; a custom `AppError` → its own status code and message; `Prisma.PrismaClientKnownRequestError` with code `P2002` (unique constraint) → 400 "already exists"; anything else → logged server-side and returned as a generic 500, so stack traces/query text never reach the client. Route handlers themselves return 401 directly for missing/invalid Bearer tokens and 404 directly for missing/not-owned resources (via services returning `null`/`false`), keeping those two paths explicit rather than exception-driven.

## Testing Strategy

See `test-strategy.md` for full detail. Summary: Vitest for unit and integration-style tests, fast-check (`@fast-check/vitest`) for property-based tests (≥100 iterations each) against the 19 correctness properties defined in `design.md`, covering validation, sanitization, pagination, ownership isolation, cascading delete, dashboard accuracy, and error-format consistency. Current state: 12 test files, 84 tests, all passing via `npm test`.
