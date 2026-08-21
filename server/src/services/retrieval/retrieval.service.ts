import OpenAI from "openai";
import { env } from "../../config/env.js";
import { vectorSearch } from "./vectorSearch.js";
import { fullTextSearch } from "./fullTextSearch.js";
import { reciprocalRankFusion } from "./hybridFusion.js";
import { LIMITS } from "../../config/limits.js";
import { logger } from "../../utils/logger.js";
import type { FusedChunk } from "./hybridFusion.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/*
  Embeds the user query using the same model used to embed
  document chunks. Must use identical model and dimensions
  or the cosine similarity comparison is meaningless.
*/
const embedQuery = async (query: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    dimensions: 1536,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error("Query embedding returned no data");

  return embedding;
};

/*
  Runs vector search and full text search in parallel then
  merges results using Reciprocal Rank Fusion.
  Returns the top CONTEXT_TOP_K chunks sorted by RRF score.
  If the top result's RRF score is below MIN_RELEVANCE_SCORE
  the retrieval is considered insufficient.
*/
export const retrieve = async (
  query: string,
  workspaceId: string,
  documentId?: string
): Promise<{ chunks: FusedChunk[]; insufficient: boolean }> => {
  const startMs = Date.now();

  const [queryEmbedding] = await Promise.all([embedQuery(query)]);

  /*
    Run both retrieval methods in parallel.
    If FTS fails (e.g. query contains no indexable tokens)
    we fall back to vector results only rather than failing
    the entire retrieval.
  */
  const [vectorResults, ftsResults] = await Promise.allSettled([ //Promise.allSettled() instead of Promise.all() bcos Promise.all() fails everything if one promise fails
    vectorSearch(queryEmbedding, workspaceId, documentId),
    fullTextSearch(query, workspaceId, documentId),
  ]);

  const vector = vectorResults.status === "fulfilled" ? vectorResults.value : [];
  const fts = ftsResults.status === "fulfilled" ? ftsResults.value : [];

  if (vectorResults.status === "rejected") {
    logger.error("Vector search failed", {
      error: (vectorResults.reason as Error).message,
    });
  }

  if (ftsResults.status === "rejected") {
    logger.warn("Full text search failed, using vector only", {
      error: (ftsResults.reason as Error).message,
    });
  }

  const fused = reciprocalRankFusion(vector, fts, LIMITS.CONTEXT_TOP_K);

  const retrievalMs = Date.now() - startMs;

  logger.info("Retrieval complete", {
    workspaceId,
    documentId,
    vectorCount: vector.length,
    ftsCount: fts.length,
    fusedCount: fused.length,
    retrievalMs,
  });

  const topScore = fused[0]?.rrfScore ?? 0;
  const insufficient = fused.length === 0 || topScore < LIMITS.MIN_RELEVANCE_SCORE;

  return { chunks: fused, insufficient };
};