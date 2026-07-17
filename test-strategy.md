# Test Strategy

## Test Scope

Backend logic (validators, services, error handling, middleware, routes) is covered by Vitest unit tests and fast-check property-based tests. There is no frontend component test suite or E2E suite yet (both are called out as future work in `design.md`'s testing strategy). Current suite: 12 test files, 84 tests, all passing (`npm test`, i.e. `vitest --run`).

## Unit Tests

- `tests/unit/utils/sanitize.test.ts` — the `sanitize()` utility strips HTML tags and surrounding whitespace on concrete inputs.
- `tests/unit/utils/error-handler.test.ts` — `handleApiError` maps `ZodError`, `AppError`, `PrismaClientKnownRequestError` (P2002), and unknown errors to the correct status codes and JSON shape.
- `tests/unit/services/auth.service.test.ts` — register/login/logout/session-validation behavior on concrete cases (duplicate email, wrong password, expired/invalid token).
- `tests/unit/routes/auth.routes.test.ts` — register/login/logout route handlers return the correct status/body for valid and invalid requests.
- `tests/unit/middleware.test.ts` — route-protection middleware redirects unauthenticated page requests and returns 401 JSON for unauthenticated API requests, and allows `/login`, `/register`, `/api/auth/*` through.

## Component Tests

None currently implemented. If added, they'd use Vitest + React Testing Library against `StatsGrid`, `RecentProjectsTable`, `RecentTasksList`, `ProjectTable`/`ProjectGrid`, `TaskCardGrid`, and form components, focused on: skeleton-loader visibility, empty states, responsive class/layout changes at breakpoints, and toast rendering on error.

## API / Integration Tests

Route-level behavior is exercised indirectly through the unit tests above (auth routes) and through the property tests below, which call service functions directly against Prisma-backed logic rather than through a live HTTP server. There is no dedicated integration suite against a running test database yet (`design.md` calls this out under `tests/integration/` as planned but not yet present in the repo).

## Edge Case Tests

Covered via the property-based suite (`tests/properties/*.property.test.ts`), each mapped to a numbered correctness property from `design.md`:

- `validation.property.test.ts` — Property 2 (any schema-violating input yields 400 + field errors) and Property 9 (date-order constraint on projects).
- `auth.property.test.ts` — Property 1 (registration hashes password correctly), Property 3 (login round-trip + 24h expiry), Property 4 (logout idempotence), Property 5 (route protection for unauthenticated requests).
- `project.property.test.ts` — Property 8 (creation defaults), Property 10 (pagination metadata), Property 11 (search correctness), Property 13 (status/priority filter AND logic), Property 14 (ownership isolation), Property 15 (partial update preserves other fields), Property 16 (cascading delete).
- `task.property.test.ts` — Property 12 (task title search correctness).
- `dashboard.property.test.ts` — Property 6 (count accuracy) and Property 7 (recent-items ordering/limit/ownership).
- `error-response.property.test.ts` — Property 18 (every error response is `{ success: false, message }`, no leaked internals on 500).
- `seed.property.test.ts` — Property 19 (seed script idempotence across repeated runs).

Each property test runs ≥100 iterations via fast-check to cover a wide input space rather than a handful of examples.

## Tests Not Covered (and why)

- **Frontend component/UI tests** — not yet written; the manual acceptance criteria in `acceptance-criteria.md` (skeleton loaders, responsive breakpoints, toast duration) were verified by manual inspection during development rather than automated tests, per `tool-workflow.md`.
- **E2E tests (Playwright)** — listed as optional in `design.md` for critical flows (login → create project → add tasks → dashboard) but not implemented; scope/time did not extend to browser-level E2E for this assessment.
- **Integration tests against a live test database** — current property/unit tests exercise service and validator logic directly; a dedicated `tests/integration/` suite with a real seeded test database (as sketched in `design.md`) wasn't built out, since the property tests already give strong coverage of the same business rules at lower cost/flakiness.
- **Load/performance tests** — the 500ms response-time and 100-record scale targets from the requirements were not measured with an automated benchmark; only manual observation during local development.
