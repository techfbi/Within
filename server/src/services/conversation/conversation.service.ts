import { conversationRepo } from "../../repositories/conversation.repo.js";
import { workspaceRepo } from "../../repositories/workspace.repo.js";

export const conversationService = {
  getAllByWorkspace: (workspaceId: string, accessToken: string) =>
    conversationRepo.findAllByWorkspace(workspaceId, accessToken),

  getById: (conversationId: string, accessToken: string) =>
    conversationRepo.findById(conversationId, accessToken),

  getMessages: (conversationId: string, accessToken: string) =>
    conversationRepo.getMessages(conversationId, accessToken),

  create: (workspaceId: string, title?: string) =>
    conversationRepo.create(workspaceId, title),

  /*
    Verifies the conversation belongs to a workspace owned
    by this user before returning messages. Prevents a user
    from reading another user's conversation by guessing IDs.
  */
  getMessagesVerified: async (
    conversationId: string,
    userId: string,
    accessToken: string
  ) => {
    const conversation = await conversationRepo.findById(
      conversationId,
      accessToken
    );

    await workspaceRepo.verifyOwnership(conversation.workspace_id, userId);

    return conversationRepo.getMessages(conversationId, accessToken);
  },

  delete: async (
    conversationId: string,
    userId: string,
    accessToken: string
  ): Promise<void> => {
    const conversation = await conversationRepo.findById(
      conversationId,
      accessToken
    );

    await workspaceRepo.verifyOwnership(conversation.workspace_id, userId);

    const { error } = await (await import("../../config/supabase.js"))
      .supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) throw error;
  },
};