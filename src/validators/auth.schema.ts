import { z } from "zod";
import { sanitize } from "@/lib/utils";

export const registerSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitize),
  email: z.string().email().max(255).transform(sanitize),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
