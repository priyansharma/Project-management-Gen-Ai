# Requirements Document

## Introduction

Project Tracker is a full-stack web application built with Next.js 15 (App Router) that enables authenticated users to manage projects, tasks, milestones, and progress from a single dashboard. The application uses PostgreSQL with Prisma ORM for data persistence, Auth.js for authentication, and Material UI for the interface. All authenticated users share the same permissions with no role-based access control.

## Glossary

- **Application**: The Project Tracker full-stack Next.js web application
- **User**: An authenticated individual interacting with the Application
- **Dashboard**: The main landing page displaying summary statistics and recent activity
- **Project**: A manageable unit of work containing a name, description, status, priority, dates, and progress percentage
- **Task**: A discrete work item belonging to a single Project, containing a title, description, status, priority, and due date
- **Auth_Service**: The authentication module responsible for user registration, login, logout, and session management
- **API**: The Next.js Route Handlers serving as the backend interface
- **Validator**: The Zod-based validation layer that checks all input data
- **Database**: The PostgreSQL database accessed through Prisma ORM
- **Project_Status**: An enumeration with values Planned, Active, or Completed
- **Task_Status**: An enumeration with values Todo, In Progress, or Done
- **Priority**: An enumeration with values Low, Medium, or High

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to create an account with my name, email, and password, so that I can access the Project Tracker application.

#### Acceptance Criteria

1. WHEN a visitor submits a valid registration form with name, email, and password, THE Auth_Service SHALL create a new User record in the Database with a UUID identifier, the provided name, the provided email, and a bcrypt-hashed password, and SHALL return a 201 status code with the response `{ "success": true, "message": "..." }`
2. WHEN a visitor submits a registration form with an email that already exists in the Database, THE Auth_Service SHALL return a 400 status code with the response `{ "success": false, "message": "..." }`
3. WHEN a visitor submits a registration form with missing or invalid fields, THE Validator SHALL return a 400 status code with a structured error response indicating each invalid field, where name must be between 1 and 100 characters, email must be a valid email format, and password must be between 8 and 128 characters
4. THE Auth_Service SHALL store passwords using bcrypt hashing and SHALL NOT store plaintext passwords

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my projects and tasks.

#### Acceptance Criteria

1. WHEN a User submits valid login credentials (email and password), THE Auth_Service SHALL authenticate the User and return a session token with a 24-hour expiry and a 200 status code
2. WHEN a User submits credentials with an email that does not exist in the Database or a password that does not match the stored hash, THE Auth_Service SHALL return a 401 status code with the response `{ "success": false, "message": "..." }` without indicating which field was incorrect
3. WHEN a User submits a login form with a missing email, an email not matching a valid email format, a missing password, or a password shorter than 8 characters, THE Validator SHALL return a 400 status code with a structured error response describing each invalid field

### Requirement 3: User Logout

**User Story:** As a logged-in user, I want to log out of the application, so that my session is terminated securely.

#### Acceptance Criteria

1. WHEN a logged-in User requests logout, THE Auth_Service SHALL invalidate the current session and return a 200 status code with the response `{ "success": true }`
2. WHEN a User with an invalidated or expired session attempts to access a protected resource, THE API SHALL return a 401 status code with the response `{ "success": false, "message": "..." }`
3. WHEN a User requests logout with an invalid or missing session token, THE Auth_Service SHALL return a 401 status code
4. IF a User sends multiple logout requests for the same session, THEN THE Auth_Service SHALL return a 200 status code for each request without error, ensuring logout is idempotent

### Requirement 4: Route Protection

**User Story:** As a system owner, I want unauthenticated users to be redirected away from protected pages, so that application data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated request is made to a protected API endpoint, THE API SHALL return a 401 status code with the response `{ "success": false, "message": "..." }`
2. WHEN an unauthenticated User or a User with an expired session navigates to a protected page, THE Application SHALL redirect the User to the Login page and preserve the originally-requested URL
3. THE Application SHALL allow unauthenticated access to the Login page, the Register page, and any public static assets required for rendering those pages
4. WHEN a User successfully logs in after being redirected from a protected page, THE Application SHALL redirect the User back to the originally-requested URL

### Requirement 5: Dashboard Display

**User Story:** As a user, I want to see a summary dashboard when I log in, so that I can quickly understand the state of my projects and tasks.

#### Acceptance Criteria

1. WHEN an authenticated User navigates to the Dashboard, THE Application SHALL display the following counts derived only from Projects and Tasks owned by the User: Total Projects, Active Projects (status = Active), Completed Projects (status = Completed), Total Tasks, Pending Tasks (status = Todo or In Progress), and Completed Tasks (status = Done)
2. WHEN an authenticated User navigates to the Dashboard, THE Application SHALL display the 5 most recently updated Projects belonging to the User, ordered by last-updated date descending
3. WHEN an authenticated User navigates to the Dashboard, THE Application SHALL display the 5 most recently updated Tasks from the User's Projects, ordered by last-updated date descending
4. WHEN the GET /api/dashboard endpoint is called, THE API SHALL return the dashboard data within 500ms under local conditions
5. IF the authenticated User has no Projects or Tasks, THEN THE Application SHALL display zero for all counts and show an empty-state message indicating no Projects or Tasks exist

### Requirement 6: Project Creation

**User Story:** As a user, I want to create a new project with relevant details, so that I can organize and track my work.

#### Acceptance Criteria

1. WHEN a User submits a valid project creation form, THE API SHALL create a new Project record in the Database with a UUID, the provided name, description (optional, defaulting to empty string), status (defaulting to Planned), priority, start date (optional), end date (optional), progress (defaulting to 0), and the User's ID as ownerId
2. WHEN a Project is created successfully, THE API SHALL return a 201 status code with the created Project data
3. WHEN a User submits a project creation form with invalid or missing required fields, THE Validator SHALL return a 400 status code with an error message indicating which fields failed validation
4. THE Validator SHALL enforce that Project name is a non-empty string with a maximum length of 255 characters, status is a valid Project_Status value, and priority is a valid Priority value
5. IF a project creation form provides both start date and end date, THEN THE Validator SHALL verify that end date is equal to or later than start date and return a 400 status code with an error message indicating the date constraint violation if validation fails

### Requirement 7: Project Listing and Search

**User Story:** As a user, I want to view, search, and filter my projects, so that I can quickly find the projects I need.

#### Acceptance Criteria

1. WHEN a User requests the project list without pagination parameters, THE API SHALL return the first page of Projects owned by the authenticated User, using a default page size of 10 and a maximum page size of 50, sorted by creation date in descending order
2. WHEN a User provides a search query parameter, THE API SHALL return Projects whose name contains the search term (case-insensitive), applying the search as an AND condition with any other active filters
3. IF a User provides a status filter parameter that is not a valid Project_Status value, THEN THE Validator SHALL return a 400 status code with a descriptive error message
4. WHEN a User provides a valid status filter parameter, THE API SHALL return only Projects matching the specified Project_Status
5. WHEN a User requests the project list with pagination parameters (page and pageSize), THE API SHALL return the corresponding subset of Projects along with metadata containing the total count, current page number, page size, and total number of pages
6. THE Application SHALL support both table and grid view displays for the Project list, with the table view showing name, status, priority, start date, end date, and progress, and the grid view showing name, status, priority, and progress

### Requirement 8: Project View and Update

**User Story:** As a user, I want to view project details and update project information, so that I can track and adjust my projects as they evolve.

#### Acceptance Criteria

1. WHEN a User requests a specific Project by ID, THE API SHALL return a 200 status code with the Project data (name, description, status, priority, start date, end date, progress) including associated Tasks, if the User is the owner
2. WHEN a User requests a Project that does not exist, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
3. WHEN a User requests a Project owned by a different User, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
4. WHEN a User submits a valid project update containing one or more updatable fields (name, description, status, priority, start date, end date, progress), THE API SHALL update only the provided fields on the Project record and return the full updated Project data with a 200 status code
5. WHEN a User submits a project update with invalid fields, THE Validator SHALL return a 400 status code with a descriptive error message indicating which fields failed validation
6. WHEN a User submits a project update for a Project that does not exist, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
7. WHEN a User submits a project update for a Project owned by a different User, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`

### Requirement 9: Project Deletion

**User Story:** As a user, I want to delete a project I no longer need, so that my project list remains relevant and organized.

#### Acceptance Criteria

1. WHEN a User requests deletion of a Project they own, THE API SHALL delete the Project and all associated Tasks from the Database and return a 200 status code with the response `{ "success": true }`
2. WHEN a User requests deletion of a Project that does not exist, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
3. WHEN a User requests deletion of a Project owned by a different User, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
4. WHEN a User requests deletion of a Project they own that has associated Tasks, THE API SHALL delete all associated Tasks before deleting the Project in a single transaction, ensuring no orphaned Task records remain

### Requirement 10: Task Creation

**User Story:** As a user, I want to create tasks within a project, so that I can break down project work into manageable items.

#### Acceptance Criteria

1. WHEN a User submits a valid task creation form with a title, status, priority, and projectId, THE API SHALL create a new Task record in the Database with a UUID, the provided title (maximum 255 characters), the provided status, the provided priority, the optional description (maximum 1024 characters, defaulting to empty string if omitted), the optional due date (defaulting to null if omitted), and the provided projectId, returning a 201 status code with the created Task data
2. WHEN a User submits a task creation form referencing a Project they do not own, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
3. IF a User submits a task creation form referencing a projectId that does not exist in the Database, THEN THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
4. WHEN a User submits a task creation form with invalid or missing required fields (title, status, priority, or projectId), THE Validator SHALL return a 400 status code with a structured error response describing each invalid field
5. THE Validator SHALL enforce that Task title is a non-empty string of at most 255 characters, description (if provided) is a string of at most 1024 characters, status is a valid Task_Status value, priority is a valid Priority value, and projectId is a valid UUID format

### Requirement 11: Task Listing and Search

**User Story:** As a user, I want to view, search, and filter tasks, so that I can quickly find specific tasks across my projects.

#### Acceptance Criteria

1. WHEN a User requests the task list, THE API SHALL return only Tasks belonging to Projects owned by the authenticated User, supporting pagination parameters and returning the appropriate subset of Tasks along with total count metadata
2. WHEN a User provides a search query parameter, THE API SHALL return Tasks whose title contains the search term (case-insensitive)
3. WHEN a User provides a priority filter parameter, a status filter parameter, or both, THE API SHALL return only Tasks matching all specified filter values, combining multiple filters with AND logic
4. IF a User provides a filter parameter with a value that is not a valid Priority or Task_Status enumeration value, THEN THE Validator SHALL return a 400 status code with a descriptive error message indicating the invalid parameter
5. THE Application SHALL display Tasks using card-based layout with status, priority, and due date visible

### Requirement 12: Task Update and Deletion

**User Story:** As a user, I want to update task details or delete tasks, so that I can maintain accurate task information.

#### Acceptance Criteria

1. WHEN a User submits a valid task update containing one or more updatable fields (title, description, status, priority, due date), THE API SHALL update only the provided fields on the Task record and return the full updated Task data with a 200 status code
2. WHEN a User submits a task update with invalid fields, THE Validator SHALL return a 400 status code with a descriptive error message indicating which fields failed validation
3. WHEN a User requests a Task that does not exist, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
4. WHEN a User attempts to update or delete a Task belonging to a Project they do not own, THE API SHALL return a 404 status code with the response `{ "success": false, "message": "..." }`
5. WHEN a User requests deletion of a Task, THE API SHALL remove the Task from the Database and return a 200 status code with the response `{ "success": true }`

### Requirement 13: Input Validation and Sanitization

**User Story:** As a system owner, I want all user inputs validated and sanitized, so that the application is protected from malformed or malicious data.

#### Acceptance Criteria

1. THE Validator SHALL validate all incoming request bodies against Zod schemas before processing
2. WHEN validation fails, THE Validator SHALL return a 400 status code with a structured error response containing field-level errors, each specifying the field path and the reason for failure
3. THE Validator SHALL trim leading and trailing whitespace and strip HTML tags from all string inputs to prevent XSS attacks
4. THE API SHALL use parameterized queries through Prisma ORM to prevent SQL injection
5. IF a request body is absent or is not valid JSON, THEN THE Validator SHALL return a 400 status code with an error message indicating the body is missing or malformed

### Requirement 14: Error Handling

**User Story:** As a user, I want consistent and informative error responses, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an API endpoint encounters an error, THE API SHALL return a JSON response with Content-Type `application/json` in the format `{ "success": false, "message": "..." }` with the appropriate HTTP status code: 400 for validation or malformed request errors, 401 for authentication or authorization failures, 404 for resources not found, or 500 for unexpected server errors
2. WHEN an unexpected server error occurs, THE API SHALL return a 500 status code with a generic error message that does not include stack traces, file paths, database query text, or internal variable names
3. WHEN the Application receives an error response from the API, THE Application SHALL display a toast notification containing the error message from the response body, visible for at least 5 seconds or until the User dismisses it manually
4. IF the Application fails to receive a response from the API due to a network connectivity error or request timeout exceeding 10 seconds, THEN THE Application SHALL display a toast notification indicating that the server is unreachable

### Requirement 15: Responsive Design

**User Story:** As a user, I want to access the application from any device, so that I can manage projects on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Application SHALL render all page content without horizontal scrolling and without content overflow or overlap on viewport widths of 320px (mobile), 768px (tablet), and 1024px or greater (desktop)
2. THE Application SHALL use Material UI responsive breakpoints to adapt layout components such that Dashboard Cards stack in a single column at viewports below 768px and display in a multi-column grid at 768px and above, and data tables switch to a scrollable container or stacked card layout at viewports below 768px
3. WHILE the viewport width is below 768px, THE Application SHALL collapse the Sidebar into a hamburger menu icon that, when tapped, displays the Sidebar as an overlay
4. THE Application SHALL ensure all interactive elements (buttons, links, menu items) have a minimum touch target size of 44×44 CSS pixels on viewports below 768px

### Requirement 16: Performance

**User Story:** As a user, I want the application to respond quickly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. THE API SHALL respond to all requests within 500ms under local development conditions with up to 100 records in the queried table
2. THE Application SHALL display skeleton loaders within 100ms of initiating a data fetch and SHALL continue displaying them until data arrives or an error occurs
3. THE Application SHALL use TanStack Query for client-side data caching with a stale time of at least 30 seconds and background refetching to minimize redundant API calls
4. IF a data fetch takes longer than 10 seconds, THEN THE Application SHALL abort the request and display a timeout error message to the User

### Requirement 17: 404 Page

**User Story:** As a user, I want to see a helpful page when I navigate to an invalid URL, so that I understand the page does not exist and can navigate elsewhere.

#### Acceptance Criteria

1. WHEN a User navigates to a URL that does not match any defined route, THE Application SHALL display a dedicated 404 page containing a visible "404" status indicator, a message stating that the requested page was not found, and a link labeled "Back to Dashboard" that navigates to the Dashboard page
2. IF an unauthenticated User navigates to an invalid URL, THEN THE Application SHALL display the 404 page without redirecting to the Login page

### Requirement 18: Seed Data

**User Story:** As a developer, I want pre-populated sample data available, so that I can test and demonstrate the application immediately after setup.

#### Acceptance Criteria

1. WHEN the database seed script is executed, THE Database SHALL be populated with 1 sample User (with a known email and password suitable for login), 10 sample Projects (covering all Project_Status values and all Priority values, with each status and priority appearing in at least 2 Projects), and 50 sample Tasks distributed across the Projects with each Project containing at least 2 Tasks
2. THE seed script SHALL generate Tasks covering all Task_Status values and all Priority values, with each Task_Status appearing in at least 10 Tasks and each Priority appearing in at least 10 Tasks across the sample Projects
3. IF the seed script is executed and seed data already exists in the Database, THEN THE seed script SHALL skip creation or remove existing seed data before re-inserting, ensuring no duplicate records are created
