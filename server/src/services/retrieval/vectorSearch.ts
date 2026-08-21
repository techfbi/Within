import { supabaseAdmin } from "../../config/supabase.js";
import { LIMITS } from "../../config/limits.js";

export interface RetrievedChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  section_title: string | null;
  token_count: number | null;
  score: number;
}

/*
  Performs approximate nearest neighbour search using the HNSW
  index on the embedding column. Filters strictly by workspace_id
  so a query can never return chunks from another user's workspace.
  Optionally filters by document_id when the user wants to narrow
  the query to a specific document.
*/
export const vectorSearch = async (
  queryEmbedding: number[],
  workspaceId: string,
  documentId?: string
): Promise<RetrievedChunk[]> => {
    //w're asking Supabase/PostgreSQL to execute a database function named: match_chunks_vector.
  const { data, error } = await supabaseAdmin.rpc("match_chunks_vector", {
    query_embedding: queryEmbedding,
    match_workspace_id: workspaceId,
    match_document_id: documentId ?? null,
    match_count: LIMITS.RETRIEVAL_TOP_K,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    document_id: row.document_id,
    workspace_id: row.workspace_id,
    chunk_index: row.chunk_index,
    content: row.content,
    page_number: row.page_number,
    section_title: row.section_title,
    token_count: row.token_count,
    score: row.similarity,
  }));
};