import type { RetrievedChunk } from "./vectorSearch.js";

/*
  Reciprocal Rank Fusion merges results from vector search and
  full text search into a single ranked list.

  For each chunk appearing in either result list, its RRF score is:
    score = sum over each list of: 1 / (k + rank_in_that_list)

  k=60 is the standard constant from the original RRF paper.
  It dampens the impact of very high ranks and prevents any single
  top result from dominating the merged score too heavily.

  A chunk appearing in both lists gets contributions from both,
  naturally ranking higher than chunks appearing in only one.
*/
const RRF_K = 60;

export interface FusedChunk extends RetrievedChunk {
  rrfScore: number;
  sources: ("vector" | "fts")[];
}

export const reciprocalRankFusion = (
  vectorResults: RetrievedChunk[],
  ftsResults: RetrievedChunk[],
  topK: number
): FusedChunk[] => {
  const scores = new Map<string, FusedChunk>();

  const addResults = (
    results: RetrievedChunk[],
    source: "vector" | "fts"
  ) => {
    results.forEach((chunk, rank) => {
      const rrfContribution = 1 / (RRF_K + rank + 1);
      const existing = scores.get(chunk.id);

      if (existing) {
        existing.rrfScore += rrfContribution;
        existing.sources.push(source);
      } else {
        scores.set(chunk.id, {
          ...chunk,
          rrfScore: rrfContribution,
          sources: [source],
        });
      }
    });
  };

  addResults(vectorResults, "vector");
  addResults(ftsResults, "fts");

  return Array.from(scores.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);
};