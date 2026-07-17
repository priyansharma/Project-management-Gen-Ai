# Reflection

## What I Built

A full-stack Next.js 15 project & task tracker: authentication (register/login/logout with JWT sessions), route protection middleware, project and task CRUD with ownership isolation, pagination/search/filtering, a dashboard with live counts and recent-item lists, a responsive Material UI frontend, an idempotent database seed script, and a Vitest + fast-check test suite (12 files, 84 tests, all passing) covering the design's 19 correctness properties.

## How I Used AI (across the lifecycle)

Followed Kiro's full spec workflow rather than freeform prompting: plain-language feature description → `requirements.md` (EARS-format user stories + acceptance criteria) → automated requirements-analysis pass to catch gaps → `design.md` (architecture, Prisma schema, API contracts, 19 correctness properties, testing strategy) → `tasks.md` (dependency-ordered implementation plan with two checkpoints) → task-by-task code and test generation. Context was kept scoped by opening the relevant spec files and source files directly in chat instead of re-explaining the project each time. Full detail in `tool-workflow.md`.

## What AI Helped With Most

Translating approved requirements into a consistent, enforceable design — the API response envelope, the ownership-check pattern in the service layer, and the correctness-property list gave every subsequent piece of generated code (routes, services, tests) the same shape, which made review fast because deviations were obvious. Generating the matching property-based tests alongside each feature (rather than as an afterthought) was also high-leverage, since it caught edge cases (pagination boundaries, date-order validation, cascade delete) that example-based tests alone tend to miss.

## What AI Got Wrong

_[Fill in real instances from your session — e.g. a first-pass schema that didn't account for null vs. undefined on optional dates, or a service method that skipped an ownership check on one endpoint before being caught in review. See `debugging-notes.md` and `code-review-notes.md` for the specific issues.]_

## How I Validated AI Output

Every generated file was read before acceptance, `npm run build`/`npm run dev` and TypeScript/lint diagnostics were checked after each change, and generated tests were run via `npm test` to confirm behavior matched the acceptance criteria in `requirements.md` — not just that the code compiled. For anything touching auth or ownership, the relevant property test (`auth.property.test.ts`, `project.property.test.ts`'s ownership-isolation case) was treated as the actual source of truth rather than a manual read-through.

## What I Would Improve Next

Add the integration test suite against a real seeded test database and a small Playwright E2E flow (login → create project → add task → see it on dashboard) — both are called out as planned-but-not-built in `design.md`/`test-strategy.md`. Also worth adding: frontend component tests for the skeleton-loader and responsive-breakpoint behavior that were only verified manually.

## Reusable Workflow (prompts, rules, specs, templates)

Start every new feature or bugfix as a Kiro spec: requirements (EARS format, in plain language first) → design (architecture + explicit correctness properties, not just prose) → tasks (small, dependency-ordered, with checkpoints). Keep AI context scoped to the specific spec files and source files relevant to the current task rather than the whole repo. Generate code and its property/unit tests together, per task, so each change is independently reviewable and testable before moving to the next. Gate progress on `npm test` passing at each checkpoint rather than only at the end. Feed AI actual error output/logs when debugging, and explicitly ask for root-cause analysis instead of accepting the first patch that makes a symptom disappear.
