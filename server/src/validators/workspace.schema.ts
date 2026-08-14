import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(80, "Name must be 80 characters or fewer")
    .trim(),
  description: z
    .string()
    .max(400, "Description must be 400 characters or fewer")
    .trim() //strips accidental whitespace
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  description: z.string().max(400).trim().nullable().optional(),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"), // uuid validates the workspace ID format before we even hit the DB 
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;