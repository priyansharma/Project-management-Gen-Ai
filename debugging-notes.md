# Debugging Notes

> Fill in the specifics of each real issue you hit during the assessment. The structure below is set up per the codebase's actual layers (validators → services → routes → middleware) so you can drop in the concrete problem, root cause, and fix for each one.

## Issue 1

### Problem

_[Describe the observed bug, e.g. "Deleting a project with tasks left orphaned Task rows" or "PUT /api/projects/[id] overwrote fields not included in the request body."]_

### How I Investigated

_[e.g. Reproduced via a direct Prisma query / added a failing property test in `tests/properties/project.property.test.ts` / inspected `project.service.ts`'s `delete`/`update` implementation.]_

### How AI Helped

Per the project's workflow (`tool-workflow.md`), the actual error output/logs (not a description) were fed back to Kiro, and the request was for root-cause analysis rather than a surface-level patch — especially important here since the service layer centralizes ownership checks and cascade logic, so a shallow fix risks reintroducing the bug elsewhere (e.g. in `task.service.ts`'s parallel logic).

### What I Validated

_[e.g. Ran the relevant property test in `tests/properties/project.property.test.ts` (Property 15: partial update / Property 16: cascading delete) and confirmed it now passes across 100+ generated inputs; re-ran `npm test` to confirm no regressions elsewhere.]_

### Final Fix

_[Describe the actual code change, e.g. wrapping delete in a Prisma `$transaction`, or building the update payload from only defined fields instead of spreading the full parsed object.]_

---

## Issue 2

### Problem

_[e.g. "Login returned 401 for valid credentials intermittently" or "Date validation accepted endDate < startDate when only one was a Date object vs ISO string."]_

### How I Investigated

_[What logs/output you captured, which file you opened first, what you isolated.]_

### How AI Helped

_[What you asked Kiro to look at, and what it surfaced — e.g. pointing out that `createProjectSchema`'s `.refine()` compares `new Date(data.endDate)` but a `null` value on an optional field needs an explicit guard.]_

### What I Validated

_[Which test(s) you added or re-ran, and what confirmed the fix — e.g. `tests/properties/validation.property.test.ts` Property 9.]_

### Final Fix

_[The concrete change made.]_
