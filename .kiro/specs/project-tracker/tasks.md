# Implementation Plan: Project Tracker

## Overview

Implement a full-stack Next.js 15 project tracker application with authentication, project/task CRUD, dashboard analytics, and comprehensive testing. The implementation follows an incremental approach: foundational setup → data layer → authentication → core CRUD → dashboard → frontend components → integration and wiring.

## Tasks

- [x] 1. Set up project structure, shared types, and utilities
  - [x] 1.1 Create directory structure and core TypeScript types
    - Create the `src/types/index.ts` file defining all shared types: `ApiSuccessResponse<T>`, `ApiErrorResponse`, `FieldError`, `PaginatedResponse<T>`, `ProjectStatus`, `TaskStatus`, `Priority` enums, `User`, `Project`, `ProjectWithTasks`, `Task`, `DashboardStats`, `ProjectListParams`, `TaskListParams`
    - Create `src/lib/utils.ts` with the `sanitize` function (trim whitespace + strip HTML tags)
    - Create `src/lib/error-handler.ts` with centralized `handleApiError` function supporting ZodError, AppError, PrismaClientKnownRequestError, and unknown errors
    - _Requirements: 13.3, 13.4, 14.1, 14.2_

  - [x] 1.2 Write property test for input sanitization
    - **Property 17: Input sanitization**
    - Test that for any string input, sanitize removes all leading/trailing whitespace and all HTML tags
    - **Validates: Requirements 13.3**

  - [x] 1.3 Write property test for error response format consistency
    - **Property 18: Error response format consistency**
    - Test that for any error scenario (4xx/5xx), the response matches `{ success: false, message: string }` and 500 responses contain no internal details
    - **Validates: Requirements 14.1, 14.2**

- [x] 2. Set up database layer with Prisma
  - [x] 2.1 Configure Prisma schema and generate client
    - Create `prisma/schema.prisma` with User, Project, Task models, all enums (ProjectStatus, TaskStatus, Priority), relations, indexes, and table mappings as defined in design
    - Create `src/lib/prisma.ts` with singleton Prisma client instance
    - Run `prisma generate` and `prisma migrate dev` to establish the database
    - _Requirements: 6.1, 10.1, 13.4_

  - [x] 2.2 Create Zod validation schemas
    - Create `src/validators/auth.schema.ts` with `registerSchema` and `loginSchema`
    - Create `src/validators/project.schema.ts` with `createProjectSchema` (including date refinement), `updateProjectSchema`, and `projectListParamsSchema`
    - Create `src/validators/task.schema.ts` with `createTaskSchema`, `updateTaskSchema`, and `taskListParamsSchema`
    - All string fields must use the `sanitize` transform
    - _Requirements: 1.3, 2.3, 6.3, 6.4, 6.5, 10.4, 10.5, 11.4, 12.2, 13.1, 13.2, 13.3_

  - [x] 2.3 Write property tests for validation schemas
    - **Property 2: Invalid input rejection with field-level errors**
    - Test that any request body violating a Zod schema produces a 400 with field-level errors
    - **Property 9: Date constraint enforcement**
    - Test that endDate < startDate is always rejected, and endDate >= startDate always passes
    - **Validates: Requirements 1.3, 2.3, 6.3, 6.4, 6.5, 10.4, 10.5, 13.1, 13.2**

- [x] 3. Implement authentication service and API routes
  - [x] 3.1 Implement Auth.js configuration and auth service
    - Create `src/lib/auth.ts` with Auth.js (NextAuth) configuration using JWT strategy with 24-hour expiry
    - Create `src/services/auth.service.ts` implementing registration (bcrypt hashing, UUID generation), login (credential verification, token generation), logout (session invalidation), and session validation
    - _Requirements: 1.1, 1.4, 2.1, 3.1_

  - [x] 3.2 Implement auth API route handlers
    - Create `src/app/api/auth/register/route.ts` (POST) — validate input, check email uniqueness, create user, return 201
    - Create `src/app/api/auth/login/route.ts` (POST) — validate input, authenticate, return token with 200
    - Create `src/app/api/auth/logout/route.ts` (POST) — invalidate session, return 200
    - Handle duplicate email (400), invalid credentials (401 without revealing which field), and validation errors (400)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 3.4_

  - [x] 3.3 Implement route protection middleware
    - Create `src/middleware.ts` protecting all routes except `/login`, `/register`, `/api/auth/*`, and public static assets
    - Redirect unauthenticated users to `/login?callbackUrl=<original-url>`
    - Return 401 JSON for unauthenticated API requests
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.4 Write property tests for authentication
    - **Property 1: Registration produces valid user with hashed password**
    - Test that for any valid registration input, the created user has a UUID id, provided name/email, and bcrypt-hashed password
    - **Property 3: Login round trip**
    - Test that for any registered user, correct credentials yield a 200 with token having 24h expiry
    - **Property 4: Logout idempotence**
    - Test that calling logout N times always returns 200 and session is invalid after first call
    - **Property 5: Route protection for unauthenticated requests**
    - Test that any protected endpoint without valid token returns 401
    - **Validates: Requirements 1.1, 1.4, 2.1, 3.1, 3.4, 4.1, 4.2**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement project service and API routes
  - [x] 5.1 Implement project service layer
    - Create `src/services/project.service.ts` with `create`, `findById`, `findAll`, `update`, `delete` methods
    - Implement ownership checks (return null/false for non-owned resources)
    - Implement pagination logic with `page`, `pageSize` (default 10, max 50), `search` (case-insensitive name contains), `status` filter
    - Implement cascading delete (project + all tasks in single transaction)
    - _Requirements: 6.1, 7.1, 7.2, 7.4, 7.5, 8.1, 8.3, 8.4, 8.7, 9.1, 9.3, 9.4_

  - [x] 5.2 Implement project API route handlers
    - Create `src/app/api/projects/route.ts` — GET (list with pagination/search/filter), POST (create)
    - Create `src/app/api/projects/[id]/route.ts` — GET (detail with tasks), PUT (partial update), DELETE (cascade)
    - Create `src/app/api/projects/[id]/tasks/route.ts` — GET (list tasks for project), POST (create task in project)
    - Apply validation, ownership checks, and centralized error handling
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4_

  - [x] 5.3 Write property tests for project operations
    - **Property 8: Project creation applies defaults correctly**
    - Test that for any valid input, created project has UUID id, defaults for description/status/progress, correct ownerId
    - **Property 10: Pagination metadata correctness**
    - Test that totalPages = ceil(T/S), returned items count matches formula
    - **Property 11: Project search filters correctly**
    - Test that all results contain search term (case-insensitive) and no matching project is excluded
    - **Property 13: Status and priority filter correctness**
    - Test that all returned items match ALL specified filter values (AND logic)
    - **Property 14: Ownership isolation**
    - Test that user B never receives user A's resources (always 404)
    - **Property 15: Partial update preserves unchanged fields**
    - Test that only specified fields change, all others remain identical
    - **Property 16: Cascading delete removes all associated records**
    - Test that deleting a project removes it and all N associated tasks
    - **Validates: Requirements 6.1, 7.1, 7.2, 7.4, 7.5, 8.3, 8.4, 8.7, 9.1, 9.3, 9.4**

- [x] 6. Implement task service and API routes
  - [x] 6.1 Implement task service layer
    - Create `src/services/task.service.ts` with `create`, `findById`, `findAll`, `findByProject`, `update`, `delete` methods
    - Implement ownership checks through project ownership (task belongs to project, project owned by user)
    - Implement pagination, search (title contains, case-insensitive), status filter, priority filter with AND logic
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 12.1, 12.3, 12.4, 12.5_

  - [x] 6.2 Implement task API route handlers
    - Create `src/app/api/tasks/route.ts` — GET (global task list with pagination/search/filters)
    - Create `src/app/api/tasks/[id]/route.ts` — GET (single task), PUT (partial update), DELETE
    - Apply validation, ownership checks (through project ownership), and centralized error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 6.3 Write property tests for task operations
    - **Property 12: Task search filters correctly**
    - Test that all returned tasks have title containing search term (case-insensitive)
    - **Validates: Requirements 11.2**

- [x] 7. Implement dashboard service and API route
  - [x] 7.1 Implement dashboard service and API
    - Create `src/services/dashboard.service.ts` with `getStats` (counts), `getRecentProjects` (top 5 by updatedAt), `getRecentTasks` (top 5 by updatedAt)
    - Create `src/app/api/dashboard/route.ts` — GET (return stats + recent items)
    - All counts and items must be scoped to the authenticated user
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Write property tests for dashboard
    - **Property 6: Dashboard count accuracy**
    - Test that computed counts match actual filtered counts from user's data
    - **Property 7: Dashboard recent items ordering**
    - Test that recent lists have ≤5 items, all owned by user, ordered by updatedAt descending
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [~] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend: authentication pages
  - [x] 9.1 Create auth page layouts and forms
    - Create `src/app/(auth)/login/page.tsx` with `LoginForm` component using React Hook Form + Zod client-side validation
    - Create `src/app/(auth)/register/page.tsx` with `RegisterForm` component using React Hook Form + Zod client-side validation
    - Implement login redirect: after successful login, redirect to callbackUrl or dashboard
    - Implement Material UI form components with proper validation error display
    - _Requirements: 1.1, 1.3, 2.1, 2.3, 4.4_

  - [x] 9.2 Create API client and TanStack Query setup
    - Create `src/lib/api-client.ts` with fetch wrapper: 10-second timeout (AbortController), error normalization, JSON parsing
    - Create TanStack Query client configuration in provider with `staleTime: 30000`, `retry: 1`, global `onError` toast handler
    - Create `src/components/providers.tsx` wrapping QueryClientProvider and Material UI ThemeProvider
    - _Requirements: 14.3, 14.4, 16.3, 16.4_

- [x] 10. Implement frontend: protected layout and dashboard
  - [x] 10.1 Create protected layout with sidebar navigation
    - Create `src/app/(protected)/layout.tsx` with auth check and redirect
    - Create `src/components/ui/Sidebar.tsx` — navigation links (Dashboard, Projects, Tasks), collapsible to hamburger on mobile (<768px)
    - Create `src/components/ui/TopBar.tsx` — user info display and logout button
    - Implement responsive behavior: sidebar as overlay on mobile, fixed on desktop
    - Ensure all interactive elements have minimum 44×44px touch targets on mobile
    - _Requirements: 4.2, 15.1, 15.2, 15.3, 15.4_

  - [x] 10.2 Implement dashboard page with stat cards and recent lists
    - Create `src/app/(protected)/dashboard/page.tsx`
    - Create `src/components/dashboard/StatsGrid.tsx` — 6 stat cards (total/active/completed projects, total/pending/completed tasks)
    - Create `src/components/dashboard/RecentProjectsTable.tsx` — 5 most recent projects
    - Create `src/components/dashboard/RecentTasksList.tsx` — 5 most recent tasks
    - Create `src/hooks/useDashboard.ts` — TanStack Query hook for fetching dashboard data
    - Implement skeleton loaders shown within 100ms of fetch initiation
    - Implement empty state message when no projects/tasks exist
    - Responsive: stat cards stack single-column below 768px, multi-column grid above
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 15.2, 16.2_

- [x] 11. Implement frontend: project management pages
  - [x] 11.1 Implement project list page with search, filters, and view toggle
    - Create `src/app/(protected)/projects/page.tsx`
    - Create `src/components/projects/SearchBar.tsx` — search input + status filter dropdown
    - Create `src/components/projects/ViewToggle.tsx` — table/grid view switch
    - Create `src/components/projects/ProjectTable.tsx` — table showing name, status, priority, start date, end date, progress
    - Create `src/components/projects/ProjectGrid.tsx` — card grid showing name, status, priority, progress
    - Create `src/components/ui/Pagination.tsx` — page controls with page number and size selection
    - Create `src/hooks/useProjects.ts` — TanStack Query hook for project list with pagination, search, filters
    - Implement skeleton loaders and responsive table (scrollable container below 768px)
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 15.2, 16.2_

  - [x] 11.2 Implement project detail page with task management
    - Create `src/app/(protected)/projects/[id]/page.tsx`
    - Create `src/components/projects/ProjectHeader.tsx` — name, status badge, edit/delete actions
    - Create `src/components/projects/ProjectForm.tsx` — React Hook Form with Zod validation for editing project fields
    - Create `src/components/tasks/TaskList.tsx` — display tasks within project context
    - Create `src/components/tasks/CreateTaskDialog.tsx` — Material UI dialog for new task creation
    - Implement project update and delete functionality with confirmation dialog
    - _Requirements: 8.1, 8.4, 9.1, 10.1, 14.3_

- [x] 12. Implement frontend: task management page
  - [x] 12.1 Implement global task list page
    - Create `src/app/(protected)/tasks/page.tsx`
    - Create `src/components/tasks/TaskCardGrid.tsx` — card-based layout showing status, priority, due date
    - Create `src/hooks/useTasks.ts` — TanStack Query hook for task list with pagination, search, status/priority filters
    - Implement task update (inline or modal) and delete functionality
    - Implement search bar with status and priority filter dropdowns
    - Implement skeleton loaders and responsive card layout
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 12.1, 12.5, 15.1, 16.2_

- [x] 13. Implement 404 page and toast notifications
  - [x] 13.1 Create 404 page and wire up toast notifications
    - Create `src/app/not-found.tsx` with "404" indicator, explanatory message, and "Back to Dashboard" link
    - Ensure 404 page is accessible to unauthenticated users without redirect
    - Wire up toast notifications (Material UI Snackbar or similar) for API errors — visible at least 5 seconds, manually dismissible
    - _Requirements: 17.1, 17.2, 14.3_

- [x] 14. Implement seed script
  - [x] 14.1 Create database seed script
    - Create `prisma/seed.ts` generating 1 user (known email/password), 10 projects (all statuses and priorities represented, each appearing ≥2 times), 50 tasks (distributed ≥2 per project, each TaskStatus ≥10 times, each Priority ≥10 times)
    - Implement idempotency: check for existing seed data and remove before re-inserting
    - Configure `prisma` seed command in `package.json`
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 14.2 Write property test for seed script idempotence
    - **Property 19: Seed script idempotence**
    - Test that running seed N times always results in exactly 1 user, 10 projects, 50 tasks
    - **Validates: Requirements 18.3**

- [~] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- TypeScript is used throughout (frontend and backend)
- All API routes use centralized error handling for consistent response format
- TanStack Query handles client-side caching with 30-second stale time
- Responsive design uses Material UI breakpoints (768px as primary breakpoint)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "5.1", "6.1", "7.1"] },
    { "id": 6, "tasks": ["5.2", "6.2", "7.2"] },
    { "id": 7, "tasks": ["5.3", "6.3", "9.1", "9.2"] },
    { "id": 8, "tasks": ["10.1", "10.2"] },
    { "id": 9, "tasks": ["11.1", "12.1", "13.1"] },
    { "id": 10, "tasks": ["11.2", "14.1"] },
    { "id": 11, "tasks": ["14.2"] }
  ]
}
```
