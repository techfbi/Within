import { z } from "zod";

export const documentParamsSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  documentId: z.string().uuid("Invalid document ID"),
});

export const workspaceOnlyParamSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

export const uploadDocumentBodySchema = z.object({
  title: z
    .string()
    .min(1, "Document title is required")
    .max(200, "Title must be 200 characters or fewer")
    .trim()
    .optional(),
});

export type DocumentParams = z.infer<typeof documentParamsSchema>;
export type UploadDocumentBody = z.infer<typeof uploadDocumentBodySchema>;