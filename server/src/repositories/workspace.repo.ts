import { supabaseAdmin, createUserClient } from "../config/supabase.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.schema.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Database } from "../types/database.js";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
type WorkspaceUpdate = Database["public"]["Tables"]["workspaces"]["Update"];

export const workspaceRepo = {
  findAllByUser: async (accessToken: string): Promise<WorkspaceRow[]> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("workspaces")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  findById: async (workspaceId: string, accessToken: string): Promise<WorkspaceRow> => {
    const client = createUserClient(accessToken);

    const { data, error } = await client
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (error || !data) throw new NotFoundError("Workspace");
    return data;
  },

  create: async (userId: string, input: CreateWorkspaceInput): Promise<WorkspaceRow> => {
    const payload: WorkspaceInsert = {
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Workspace creation returned no data");

    return data;
  },

  update: async (
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceInput
  ): Promise<WorkspaceRow> => {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("workspaces")
      .select("id, user_id")
      .eq("id", workspaceId)
      .single();

    if (findError || !existing) throw new NotFoundError("Workspace");
    if (existing.user_id !== userId) throw new ForbiddenError();

    const payload: WorkspaceUpdate = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .update(payload)
      .eq("id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Workspace update returned no data");

    return data;
  },

  delete: async (workspaceId: string, userId: string): Promise<void> => {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("workspaces")
      .select("id, user_id")
      .eq("id", workspaceId)
      .single();

    if (findError || !existing) throw new NotFoundError("Workspace");
    if (existing.user_id !== userId) throw new ForbiddenError();

    const { error } = await supabaseAdmin
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (error) throw error;
  },

  verifyOwnership: async (workspaceId: string, userId: string): Promise<void> => {
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("user_id")
      .eq("id", workspaceId)
      .single();

    if (error || !data) throw new NotFoundError("Workspace");
    if (data.user_id !== userId) throw new ForbiddenError();
  },
};