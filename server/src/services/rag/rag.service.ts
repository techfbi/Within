import { retrieve } from "../retrieval/retrieval.service.js";
import { buildContext } from "./contextBuilder.js";
import { streamGroqResponse } from "../ai/groqProvider.js";
import { mapCitations } from "./citationMapper.js";
import type { ConversationMessage } from "../ai/groqProvider.js";
import type { Citation } from "../../types/database.js";
import { logger } from "../../utils/logger.js";

export interface RAGStreamOptions {
  query: string;
  workspaceId: string;
  documentId?: string;
  conversationHistory: ConversationMessage[];
  onToken: (token: string) => void;
  onComplete: (fullText: string, citations: Citation[]) => void;
}

/*
  Orchestrates the full RAG pipeline for a single query.
  Retrieval → context building → streaming generation → citation mapping.
  Calls onToken for each streamed token so the HTTP layer can
  forward them to the client via SSE as they arrive.
  Calls onComplete when the full response and citations are ready.
*/
export const ragStream = async (options: RAGStreamOptions): Promise<void> => {
  const startMs = Date.now();

  //Start retrieval
  const { chunks, insufficient } = await retrieve(
    options.query,
    options.workspaceId,
    options.documentId
  );

  logger.info("RAG retrieval complete", {
    workspaceId: options.workspaceId,
    chunkCount: chunks.length,
    insufficient,
  });

  //Build context
  const context = buildContext(chunks, insufficient);

  logger.info("Context built", {
    workspaceId: options.workspaceId,
    totalTokens: context.totalTokens,
    citationCount: context.citationMap.length,
  });

  let fullText = "";

  //Stream AI response
  await streamGroqResponse({
    systemPrompt: context.systemPrompt,
    contextSection: context.contextSection,
    conversationHistory: options.conversationHistory,
    userQuery: options.query,
    onToken: (token) => {
      fullText += token;
      options.onToken(token);
    },
    onComplete: async () => {
      const citations = await mapCitations(
        fullText,
        context.citationMap,
        options.workspaceId
      );

      const totalMs = Date.now() - startMs;

      logger.info("RAG complete", {
        workspaceId: options.workspaceId,
        totalMs,
        citationCount: citations.length,
      });

      options.onComplete(fullText, citations);
    },
  });
};