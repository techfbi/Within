import { supabaseAdmin, createUserClient } from "../config/supabase.js";
import { NotFoundError } from "../utils/errors.js";
import type { Database, DocumentStatus } from "../types/database.js";
import { workspaceRepo } from "./workspace.repo.js";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

export const documentRepo = {
  findAllByWorkspace: async (
    workspaceId: string,
    accessToken: string
  ): Promise<DocumentRow[]> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  findById: async (
    documentId: string,
    workspaceId: string,
    accessToken: string
  ): Promise<DocumentRow> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !data) throw new NotFoundError("Document");
    return data;
  },

  create: async (payload: DocumentInsert): Promise<DocumentRow> => {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Document creation returned no data");

    return data;
  },

  updateStatus: async (
    documentId: string,
    status: DocumentStatus,
    processingError?: string
  ): Promise<void> => {
    const update: DocumentUpdate = {
      status,
      processing_error: processingError ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("documents")
      .update(update)
      .eq("id", documentId);

    if (error) throw error;
  },

  updatePageCount: async (
    documentId: string,
    pageCount: number
  ): Promise<void> => {
    const { error } = await supabaseAdmin
      .from("documents")
      .update({
        page_count: pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (error) throw error;
  },

  delete: async (
  documentId: string,
  workspaceId: string,
  userId: string
): Promise<string> => {
  /*
    First verify the workspace belongs to this user.
    workspaceRepo.verifyOwnership throws ForbiddenError if not.
  */
  await workspaceRepo.verifyOwnership(workspaceId, userId);

  /*
    Fetch the document to confirm it exists in this workspace
    and to get the storage_path for file cleanup after deletion.
  */
  const { data: existing, error: findError } = await supabaseAdmin
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .single();

  if (findError || !existing) throw new NotFoundError("Document");

  const { error } = await supabaseAdmin
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) throw error;

  return existing.storage_path;
},
};