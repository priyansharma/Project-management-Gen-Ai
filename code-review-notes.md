# Code Review Notes

## AI-Assisted Review Summary

Per `tool-workflow.md`, AI-generated code was reviewed by reading every generated file, running the dev server/build, and checking TypeScript/lint diagnostics after each change rather than accepting output blindly. Kiro-generated route handlers consistently follow the same shape across `src/app/api/**`: extract Bearer token → `authService.validateSession` → 401 if missing/invalid → parse/validate body or query params with the matching Zod schema → delegate to the service layer → wrap the result in the shared response envelope → route errors through `handleApiError`. That consistency made review fast, since deviations from the pattern stood out immediately (e.g. a route missing a token check would be obvious next to the others).

## My Review Observations

- Ownership enforcement is handled inside the service layer (`project.service.ts`, `task.service.ts`) rather than scattered across route handlers, which reduces the chance of an endpoint forgetting the check — confirmed by reading `findById`/`update`/`delete` in both services and the "ownership isolation" property test.
- All list endpoints (`/api/projects`, `/api/tasks`) share the same pagination shape (`page`, `pageSize`, `total`, `totalPages`), which keeps the frontend hooks (`useProjects`, `useTasks`) and `Pagination` component reusable without per-endpoint special-casing.
- The `sanitize()` transform is applied inside the Zod schemas themselves (via `.transform(sanitize)`), not as a separate manual step in each route — this is safer since it's impossible to call the schema and skip sanitization.
- 401 vs 404 distinction is used correctly for ownership: accessing another user's resource returns 404, not 403, avoiding resource-existence leakage — matches Requirement 8.3/8.7/9.3/10.2/12.4 and Property 14.
- `handleApiError` never returns raw error messages for unknown/unexpected errors (logs server-side via `console.error`, returns a generic message) — checked against Property 18 and its property test.

## Changes Made After Review

_[List concrete changes made after reviewing AI output during the assessment, e.g. "Tightened `updateProjectSchema`'s progress bounds after noticing the initial version allowed negative values" or "Added the missing 404 check in `/api/projects/[id]/tasks` POST for a project owned by another user."]_

## Suggestions Rejected (and why)

_[List any AI suggestions you didn't take, and your reasoning, e.g. "Kiro suggested adding a Redis-backed session store for logout invalidation; rejected in favor of the simpler JWT + application-level invalidation approach since the requirements don't call for horizontal session revocation guarantees and it would add an infra dependency out of scope for this assessment."]_
