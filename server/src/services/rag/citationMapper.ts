import { supabaseAdmin } from "../../config/supabase.js";
import type { CitationReference } from "./contextBuilder.js";
import type { Citation } from "../../types/database.js";
import { logger } from "../../utils/logger.js";

/*
  Extracts [Doc N] citation markers from the AI generated response
  and maps them back to the actual document metadata.
  Returns an array of Citation objects ready to be stored
  on the message record.
*/
export const mapCitations = async (
  responseText: string,
  citationMap: CitationReference[],
  workspaceId: string
): Promise<Citation[]> => {
  /*
    Find all [Doc N] references in the response text.
    A response may cite the same document multiple times
    so we deduplicate by chunk_id.
  */
  const docIndexPattern = /\[Doc (\d+)\]/g; //It searches for things like: [Doc 1], [Doc 2]
  const referencedIndexes = new Set<number>(); //stores unique values.
  let match: RegExpExecArray | null;

  while ((match = docIndexPattern.exec(responseText)) !== null) {
    const index = parseInt(match[1] ?? "0", 10);
    if (index > 0) referencedIndexes.add(index);
  }

  if (referencedIndexes.size === 0) return [];

  /*
    Look up the document titles for all referenced chunks.
    We need the title from the documents table since chunk
    records only store document_id.
  */
  const referenced = citationMap.filter((c) =>
    referencedIndexes.has(c.index)
  );

  if (referenced.length === 0) return [];

  const documentIds = [...new Set(referenced.map((c) => c.document_id))];

  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select("id, title")
    .in("id", documentIds)
    .eq("workspace_id", workspaceId);

  if (error) {
    logger.warn("Citation document lookup failed", { error: error.message });
    return [];
  }

  const titleMap = new Map(
    (documents ?? []).map((d) => [d.id, d.title])
  );

  const citations: Citation[] = referenced.map((ref) => ({
    document_id: ref.document_id,
    document_title: titleMap.get(ref.document_id) ?? "Unknown document",
    page_number: ref.page_number,
    section_title: ref.section_title,
    chunk_excerpt: ref.chunk_excerpt,
  }));

  return citations;
};