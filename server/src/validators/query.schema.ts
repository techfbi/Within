import { z } from "zod";

export const queryBodySchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(2000, "Question must be 2000 characters or fewer")
    .trim(),
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
  documentId: z.string().uuid("Invalid document ID").optional(),
});

export const queryParamsSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

export type QueryBody = z.infer<typeof queryBodySchema>;