import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";
import { sanitize } from "@/lib/utils";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255).transform(sanitize),
  description: z.string().max(1024).optional().default("").transform(sanitize),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const taskListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListParams = z.infer<typeof taskListParamsSchema>;
