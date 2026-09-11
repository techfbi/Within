import { supabaseAdmin, createUserClient } from "../config/supabase.js";
import { NotFoundError } from "../utils/errors.js";
import type { Database, MessageRole, Citation, QueryMetadata } from "../types/database.js";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export const conversationRepo = {
  findById: async (
    conversationId: string,
    accessToken: string
  ): Promise<ConversationRow> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error || !data) throw new NotFoundError("Conversation");
    return data;
  },

  findAllByWorkspace: async (
    workspaceId: string,
    accessToken: string
  ): Promise<ConversationRow[]> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  create: async (workspaceId: string, title?: string): Promise<ConversationRow> => {
    const payload: ConversationInsert = {
      workspace_id: workspaceId,
      title: title ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Conversation creation returned no data");

    return data;
  },

  getMessages: async (
    conversationId: string,
    accessToken: string
  ): Promise<MessageRow[]> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  addMessage: async (
    conversationId: string,
    role: MessageRole,
    content: string,
    citations: Citation[] = [],
    queryMetadata: QueryMetadata = {}
  ): Promise<MessageRow> => {
    const payload: MessageInsert = {
      conversation_id: conversationId,
      role,
      content,
      citations,
      query_metadata: queryMetadata,
    };

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Message insert returned no data");

    return data;
  },

  updateTitle: async (
    conversationId: string,
    title: string
  ): Promise<void> => {
    const { error } = await supabaseAdmin
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) throw error;
  },
};