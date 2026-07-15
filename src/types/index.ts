// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================
// Enums
// ============================================================

export enum ProjectStatus {
  Planned = "Planned",
  Active = "Active",
  Completed = "Completed",
}

export enum TaskStatus {
  Todo = "Todo",
  InProgress = "InProgress",
  Done = "Done",
}

export enum Priority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

// ============================================================
// Data Models
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  ownerId: string;
  tasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

// ============================================================
// Query Parameter Types
// ============================================================

export interface ProjectListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatus;
}

export interface TaskListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
}
