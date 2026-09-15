import { z } from "zod";

export const conversationParamsSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
});

export const workspaceConversationParamsSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});