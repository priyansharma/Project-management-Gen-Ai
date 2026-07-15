import { z } from "zod";
import { ProjectStatus, Priority } from "@prisma/client";
import { sanitize } from "@/lib/utils";

/**
 * Base object schema for project creation (without the refine).
 * Used to derive both createProjectSchema and updateProjectSchema.
 */
const projectBaseSchema = z.object({
  name: z.string().min(1).max(255).transform(sanitize),
  description: z.string().max(5000).optional().default("").transform(sanitize),
  status: z.nativeEnum(ProjectStatus).optional().default("Planned"),
  priority: z.nativeEnum(Priority),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional().default(0),
});

const dateRefinement = {
  refinement: (data: { startDate?: string | null; endDate?: string | null }) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  options: {
    message: "End date must be equal to or later than start date",
    path: ["endDate"] as string[],
  },
};

export const createProjectSchema = projectBaseSchema.refine(
  dateRefinement.refinement,
  dateRefinement.options
);

export const updateProjectSchema = projectBaseSchema.partial().refine(
  dateRefinement.refinement,
  dateRefinement.options
);

export const projectListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListParams = z.infer<typeof projectListParamsSchema>;
