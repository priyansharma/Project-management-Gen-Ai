# API Contract

All endpoints (except `/api/auth/*`) require a Bearer token in the `Authorization` header, validated via `authService.validateSession`. All responses are JSON. List endpoints return `pagination: { total, page, pageSize, totalPages }`.

---

## Endpoint: Register

Method: POST
Path: `/api/auth/register`
Purpose: Create a new user account.

### Request

```
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "supersecret123"
}
```

### Response (201)

```
{
  "success": true,
  "data": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" },
  "message": "User registered successfully"
}
```

### Validation Rules

- `name`: string, 1–100 chars, sanitized (trim + strip HTML)
- `email`: valid email format, max 255 chars, sanitized
- `password`: string, 8–128 chars (never returned in responses; stored as bcrypt hash)

### Error Responses

- 400 — missing/malformed body, or Zod validation failure (`errors: [{ field, message }]`)
- 400 — email already registered

---

## Endpoint: Login

Method: POST
Path: `/api/auth/login`
Purpose: Authenticate a user and issue a session token.

### Request

```
{ "email": "jane@example.com", "password": "supersecret123" }
```

### Response (200)

```
{ "success": true, "data": { "token": "jwt...", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } } }
```

Token has a 24-hour expiry.

### Validation Rules

- `email`: valid email format
- `password`: min 8 chars

### Error Responses

- 400 — validation failure
- 401 — email not found or password mismatch (generic message, does not reveal which field was wrong)

---

## Endpoint: Logout

Method: POST
Path: `/api/auth/logout`
Purpose: Invalidate the current session. Idempotent.

### Request

No body. Bearer token in `Authorization` header.

### Response (200)

```
{ "success": true }
```

### Validation Rules

- None (no request body)

### Error Responses

- 401 — missing or invalid session token

---

## Endpoint: Dashboard

Method: GET
Path: `/api/dashboard`
Purpose: Return aggregate stats and recent items for the authenticated user.

### Request

No body/params.

### Response (200)

```
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 10, "activeProjects": 3, "completedProjects": 4,
      "totalTasks": 50, "pendingTasks": 30, "completedTasks": 20
    },
    "recentProjects": [ /* up to 5 Project objects, ordered by updatedAt desc */ ],
    "recentTasks": [ /* up to 5 Task objects, ordered by updatedAt desc */ ]
  }
}
```

### Validation Rules

- None (no input)

### Error Responses

- 401 — missing/invalid session token

---

## Endpoint: List Projects

Method: GET
Path: `/api/projects`
Purpose: Paginated, searchable, filterable list of the authenticated user's projects.

### Request

Query params: `page` (default 1), `pageSize` (default 10, max 50), `search` (name contains, case-insensitive), `status` (`Planned`|`Active`|`Completed`)

### Response (200)

```
{
  "success": true,
  "data": [ { "id": "uuid", "name": "...", "status": "Active", "priority": "High", "startDate": null, "endDate": null, "progress": 40, "ownerId": "uuid", "createdAt": "...", "updatedAt": "..." } ],
  "pagination": { "total": 10, "page": 1, "pageSize": 10, "totalPages": 1 }
}
```

### Validation Rules

- `page`: int ≥ 1
- `pageSize`: int, 1–50
- `status`: must be a valid `ProjectStatus` if provided

### Error Responses

- 400 — invalid `status`/`page`/`pageSize`
- 401 — missing/invalid session token

---

## Endpoint: Create Project

Method: POST
Path: `/api/projects`
Purpose: Create a project owned by the authenticated user.

### Request

```
{
  "name": "Website Redesign",
  "description": "Optional text",
  "status": "Planned",
  "priority": "High",
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-09-01T00:00:00.000Z",
  "progress": 0
}
```

### Response (201)

```
{ "success": true, "data": { "id": "uuid", "name": "Website Redesign", "...": "..." } }
```

### Validation Rules

- `name`: required, 1–255 chars, sanitized
- `description`: optional, max 5000 chars, defaults to "", sanitized
- `status`: optional `ProjectStatus`, defaults to `Planned`
- `priority`: required `Priority`
- `startDate`/`endDate`: optional ISO datetime strings; if both present, `endDate >= startDate`
- `progress`: optional int 0–100, defaults to 0

### Error Responses

- 400 — validation failure (including date-order violation)
- 401 — missing/invalid session token

---

## Endpoint: Get / Update / Delete Project

Method: GET / PUT / DELETE
Path: `/api/projects/[id]`
Purpose: Fetch a single project (with its tasks), partially update it, or delete it (cascading to its tasks).

### Request (PUT)

```
{ "status": "Active", "progress": 25 }
```

Any subset of: `name`, `description`, `status`, `priority`, `startDate`, `endDate`, `progress`.

### Response (200, GET)

```
{ "success": true, "data": { "id": "uuid", "...": "...", "tasks": [ /* Task[] */ ] } }
```

### Response (200, DELETE)

```
{ "success": true }
```

### Validation Rules

- Same field constraints as create, but all fields optional (`updateProjectSchema` = partial)

### Error Responses

- 400 — validation failure
- 401 — missing/invalid session token
- 404 — project does not exist, or is owned by a different user

---

## Endpoint: Project Tasks

Method: GET / POST
Path: `/api/projects/[id]/tasks`
Purpose: List tasks for a specific project, or create a task inside it.

### Request (POST)

```
{ "title": "Design mockups", "status": "Todo", "priority": "Medium", "description": "", "dueDate": null }
```

(`projectId` is taken from the URL, not the body.)

### Response (201, POST)

```
{ "success": true, "data": { "id": "uuid", "title": "Design mockups", "projectId": "uuid", "...": "..." } }
```

### Validation Rules

- `title`: required, 1–255 chars, sanitized
- `description`: optional, max 1024 chars, defaults to "", sanitized
- `status`: required `TaskStatus`
- `priority`: required `Priority`
- `dueDate`: optional ISO datetime, nullable

### Error Responses

- 400 — validation failure
- 401 — missing/invalid session token
- 404 — project does not exist or is not owned by the caller

---

## Endpoint: List Tasks (global)

Method: GET
Path: `/api/tasks`
Purpose: Paginated, searchable, filterable list of all tasks across the authenticated user's projects.

### Request

Query params: `page`, `pageSize`, `search` (title contains), `status` (`TaskStatus`), `priority` (`Priority`)

### Response (200)

```
{ "success": true, "data": [ /* Task[] */ ], "pagination": { "total": 50, "page": 1, "pageSize": 10, "totalPages": 5 } }
```

### Validation Rules

- Same pagination rules as projects; `status`/`priority` must be valid enum values if provided (combined with AND logic)

### Error Responses

- 400 — invalid filter/pagination values
- 401 — missing/invalid session token

---

## Endpoint: Get / Update / Delete Task

Method: GET / PUT / DELETE
Path: `/api/tasks/[id]`
Purpose: Fetch, partially update, or delete a single task.

### Request (PUT)

```
{ "status": "Done" }
```

Any subset of: `title`, `description`, `status`, `priority`, `dueDate` (`projectId` is not updatable).

### Response (200, PUT/GET)

```
{ "success": true, "data": { "id": "uuid", "title": "...", "status": "Done", "...": "..." } }
```

### Response (200, DELETE)

```
{ "success": true }
```

### Validation Rules

- Same field constraints as create, all optional (`updateTaskSchema` = partial, omits `projectId`)

### Error Responses

- 400 — validation failure
- 401 — missing/invalid session token
- 404 — task does not exist, or its project is not owned by the caller
