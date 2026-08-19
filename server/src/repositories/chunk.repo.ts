import { supabaseAdmin } from "../config/supabase.js";
import type { EmbeddedChunk } from "../services/ingestion/embedder.js";
import { logger } from "../utils/logger.js";

/*
  Inserts embedded chunks into document_chunks in batches.
  Uses upsert on (document_id, chunk_index) so the operation
  is idempotent — safe to re-run if a job is retried after
  partial completion without creating duplicate chunks.
*/
export const chunkRepo = {
  insertBatch: async (
    documentId: string,
    workspaceId: string,
    chunks: EmbeddedChunk[]
  ): Promise<void> => {
    /*
      Insert in batches of 50 to avoid hitting Supabase's
      request payload size limits with large embedding arrays.
      Each 1536-dimension embedding is roughly 12KB as JSON.
      50 chunks = ~600KB per request, well within limits.
    */
    const INSERT_BATCH_SIZE = 50;

    for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
      const batch = chunks.slice(i, i + INSERT_BATCH_SIZE);

      const rows = batch.map((chunk) => ({
        document_id: documentId,
        workspace_id: workspaceId,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
        page_number: chunk.pageNumber,
        section_title: chunk.sectionTitle,
        token_count: chunk.tokenCount,
        metadata: {},
      }));

      const { error } = await supabaseAdmin
        .from("document_chunks")
        .upsert(rows, {
          onConflict: "document_id,chunk_index",
          ignoreDuplicates: false,
        });

      if (error) {
        logger.error("Chunk batch insert failed", {
          documentId,
          batchStart: i,
          batchSize: batch.length,
          error: error.message,
        });
        throw error;
      }

      logger.info("Chunk batch inserted", {
        documentId,
        batchNumber: Math.floor(i / INSERT_BATCH_SIZE) + 1,
        totalBatches: Math.ceil(chunks.length / INSERT_BATCH_SIZE),
      });
    }
  },

  deleteByDocument: async (documentId: string): Promise<void> => {
    const { error } = await supabaseAdmin
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (error) throw error;
  },
};