# Acceptance Criteria

## Core

- [x] Users can register with name, email, and password; passwords are bcrypt-hashed and never stored in plaintext.
- [x] Users can log in with email/password and receive a session token with a 24-hour expiry.
- [x] Users can log out; logout is idempotent (repeated calls always return 200).
- [x] Unauthenticated requests to protected API routes return 401; unauthenticated page visits redirect to `/login?callbackUrl=<original>`.
- [x] Dashboard shows total/active/completed project counts, total/pending/completed task counts, and the 5 most recently updated projects and tasks, all scoped to the logged-in user.
- [x] Users can create, list (paginated, searchable, filterable by status), view (with tasks), partially update, and delete projects.
- [x] Deleting a project also deletes all of its tasks in a single transaction (no orphaned tasks).
- [x] Users can create, list (paginated, searchable, filterable by status/priority), view, partially update, and delete tasks within a project they own.
- [x] A user can never read, update, or delete another user's project or task (404 on any cross-user access attempt).
- [x] Seed script populates 1 user, 10 projects (all statuses/priorities represented), and 50 tasks (all statuses/priorities represented, ≥2 tasks per project), and is safe to re-run without creating duplicates.
- [x] A dedicated 404 page renders for unmatched routes and is reachable without an auth redirect.

## Validation

- [x] All request bodies and query params are validated against Zod schemas before reaching service/business logic.
- [x] Registration: name 1–100 chars, valid email format (max 255 chars), password 8–128 chars.
- [x] Login: valid email format, password present (min 8 chars).
- [x] Project: name required (≤255 chars), valid `ProjectStatus`/`Priority` enum values, `endDate >= startDate` when both are provided, `progress` between 0–100.
- [x] Task: title required (≤255 chars), description ≤1024 chars, valid `TaskStatus`/`Priority` enum values, `projectId` must be a valid UUID.
- [x] Pagination params: `page >= 1`, `1 <= pageSize <= 50`.
- [x] Invalid enum values for status/priority filters return 400 with a descriptive message.
- [x] All string inputs are trimmed and stripped of HTML tags before persistence (XSS mitigation).

## Error Handling

- [x] Every error response is JSON with `Content-Type: application/json` and body `{ success: false, message: string }`, with `errors: FieldError[]` added for validation failures.
- [x] Status codes are consistent: 400 (validation/malformed body), 401 (auth failure), 404 (not found / not owned), 500 (unexpected error).
- [x] 500 responses use a generic message and never leak stack traces, file paths, SQL text, or internal variable names.
- [x] Missing or non-JSON request bodies are rejected with 400 before validation runs.
- [x] Client displays a toast for API error responses (visible ≥5s or until dismissed) and a distinct "server unreachable" toast on network failure or 10s timeout.

## Testing

- [x] Property-based tests (fast-check, ≥100 iterations each) cover: registration hashing, login round-trip, logout idempotence, route protection, dashboard count accuracy and recency ordering, project defaults, date-constraint enforcement, pagination metadata, search/filter correctness, ownership isolation, partial-update field preservation, cascading delete, input sanitization, error-response format, and seed-script idempotence.
- [x] Unit tests cover the sanitize utility, the centralized error handler, the auth service, the auth routes, and the auth middleware.
- [x] `npm test` (Vitest) passes locally — 12 test files / 84 tests passing as of the last run.

## Documentation

- [x] `prisma/schema.prisma` documents all models, enums, relations, and indexes.
- [x] `.kiro/specs/project-tracker/requirements.md` documents all functional requirements in EARS format with acceptance criteria.
- [x] `.kiro/specs/project-tracker/design.md` documents architecture, API contracts, data models, correctness properties, and testing strategy.
- [x] `.kiro/specs/project-tracker/tasks.md` documents the incremental implementation plan with requirement traceability.
- [x] `.env.example` documents required environment variables without real secret values.
