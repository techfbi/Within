import { supabaseAdmin } from "../../config/supabase.js";
import { LIMITS } from "../../config/limits.js";
import type { RetrievedChunk } from "./vectorSearch.js";

/*
  Performs full text search using PostgreSQL tsvector on the
  content_tsv generated column. Useful for exact terminology,
  proper nouns, identifiers, and technical terms that vector
  similarity search handles poorly.
*/
export const fullTextSearch = async (
  query: string,
  workspaceId: string,
  documentId?: string
): Promise<RetrievedChunk[]> => {
  const { data, error } = await supabaseAdmin.rpc("match_chunks_fts", {
    query_text: query,
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
    score: row.rank,
  }));
};