# AI-Assisted Development Workflow

**Primary AI tool used:** Kiro (spec-driven AI IDE), for this Project Management Gen-AI app.

**Providing project context:** Opened relevant files/folders directly in chat (e.g. `design.md`, `schema.prisma`, route handlers) and relied on Kiro's spec files (`requirements.md`, `design.md`, `tasks.md`) as persistent, structured context instead of re-explaining the project each time.

**Requirement analysis:** Described the feature in plain language, let Kiro draft `requirements.md` in EARS format (user stories + acceptance criteria), then ran an automated requirements analysis pass to catch gaps before moving on.

**Planning and design:** Had Kiro turn approved requirements into a `design.md` covering architecture, data models (Prisma schema), and API routes, keeping it aligned with the existing Next.js App Router structure.

**Code generation:** Broke the design into discrete tasks in `tasks.md` and generated code (routes, components, Prisma models) task-by-task rather than all at once, so each change stayed reviewable.

**Validating AI-generated code:** Read every generated file, ran the build/dev server, and checked TypeScript/lint diagnostics after each change before accepting it.

**Testing:** Asked Kiro to generate targeted tests alongside new features/routes and ran them via the project's test/build scripts to confirm behavior matched the acceptance criteria.

**Debugging:** Fed actual error output/logs back to Kiro rather than descriptions, and asked for root-cause analysis instead of surface patches when a fix didn't work on the first try.

**Code review:** Used diffs/diagnostics to review AI-written code for correctness, security (auth checks, input validation), and consistency with existing project conventions before committing.

**Information avoided sharing:** Real credentials/secrets (`.env` values, API keys, DB connection strings), actual user PII, and production data — used placeholders instead.

**Reusing this workflow:** Start every new feature/bugfix as a spec (requirements → design → tasks), keep AI context scoped to relevant files, generate and verify code incrementally per task, and gate progress on review/testing before moving to the next task.
