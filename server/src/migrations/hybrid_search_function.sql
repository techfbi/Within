-- Vector similarity search function
-- Called by vectorSearch.ts via supabaseAdmin.rpc()
CREATE OR REPLACE FUNCTION match_chunks_vector(
  query_embedding vector(1536),
  match_workspace_id uuid,
  match_document_id uuid,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  workspace_id uuid,
  chunk_index int,
  content text,
  page_number int,
  section_title text,
  token_count int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.workspace_id,
    dc.chunk_index,
    dc.content,
    dc.page_number,
    dc.section_title,
    dc.token_count,
    1 - (dc.embedding <=> query_embedding) AS similarity -- Convert that cosine distance (<=>) into a similarity-style score where higher is better
  FROM document_chunks dc
  WHERE
    dc.workspace_id = match_workspace_id
    AND (match_document_id IS NULL OR dc.document_id = match_document_id)
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Full text search function
-- Called by fullTextSearch.ts via supabaseAdmin.rpc()
CREATE OR REPLACE FUNCTION match_chunks_fts(
  query_text text,
  match_workspace_id uuid,
  match_document_id uuid,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  workspace_id uuid,
  chunk_index int,
  content text,
  page_number int,
  section_title text,
  token_count int,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.workspace_id,
    dc.chunk_index,
    dc.content,
    dc.page_number,
    dc.section_title,
    dc.token_count,
    ts_rank(dc.content_tsv, plainto_tsquery('english', query_text))::float AS rank
  FROM document_chunks dc
  WHERE
    dc.workspace_id = match_workspace_id
    AND (match_document_id IS NULL OR dc.document_id = match_document_id)
    AND dc.content_tsv @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;