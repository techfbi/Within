import type { Request, Response, NextFunction } from "express";
import { ragStream } from "../services/rag/rag.service.js";
import { conversationRepo } from "../repositories/conversation.repo.js";
import { workspaceRepo } from "../repositories/workspace.repo.js";
import type { QueryBody } from "../validators/query.schema.js";
import type { ConversationMessage } from "../services/ai/groqProvider.js";
import type { Citation } from "../types/database.js";
import { logger } from "../utils/logger.js";

export const queryController = {
  query: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { workspaceId } = req.params as { workspaceId: string };
    const { question, conversationId, documentId } = req.body as QueryBody;
    const userId = req.user!.id;
    const accessToken = req.accessToken!;

    try {
      //Security check if user actually own this workspace
      await workspaceRepo.verifyOwnership(workspaceId, userId);

      /*
        Resolve or create conversation.
        If conversationId is provided, verify it belongs to this workspace.
        If not provided, create a new conversation.
      */
      let activeConversationId = conversationId;

      if (activeConversationId) {
        const conversation = await conversationRepo.findById(
          activeConversationId,
          accessToken
        );
        if (conversation.workspace_id !== workspaceId) {
          res.status(403).json({
            error: { code: "FORBIDDEN", message: "Access denied" },
          });
          return;
        }
      } else {
        const newConversation = await conversationRepo.create(workspaceId);
        activeConversationId = newConversation.id;
      }

      /*
        Load conversation history for context.
        Limit to last 10 messages to avoid exceeding token budget.
      */
      const allMessages = await conversationRepo.getMessages(
        activeConversationId,
        accessToken
      );

      const history: ConversationMessage[] = allMessages
        .slice(-10)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      /*
        Save the user message immediately before streaming starts.
      */
      await conversationRepo.addMessage(
        activeConversationId,
        "user",
        question
      );

      /*
        Set SSE headers. The client receives a stream of events
        rather than a single JSON response.
      */
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Conversation-Id", activeConversationId);
      res.flushHeaders();

      const startMs = Date.now();
      let fullText = "";

      await ragStream({
        query: question,
        workspaceId,
        documentId,
        conversationHistory: history,
        onToken: (token) => {
          /*
            Send each token as an SSE data event.
            The client accumulates these into the full response.
          */
          res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
        },
        onComplete: async (text: string, citations: Citation[]) => {
          fullText = text;

          const queryMetadata = {
            generation_ms: Date.now() - startMs,
            chunks_used: citations.length,
            model: "llama-3.3-70b-versatile",
          };

          await conversationRepo.addMessage(
            activeConversationId!,
            "assistant",
            fullText,
            citations,
            queryMetadata
          );

          /*
            Auto-title the conversation from the first user question
            if it does not already have a title.
          */
          const isFirstMessage = allMessages.length === 0;
          if (isFirstMessage) {
            const title = question.slice(0, 60) + (question.length > 60 ? "..." : "");
            await conversationRepo.updateTitle(activeConversationId!, title);
          }

          /*
            Send the final event with citations and conversation ID
            so the client can update its state after streaming ends.
          */
          res.write(
            `data: ${JSON.stringify({
              type: "done",
              conversationId: activeConversationId,
              citations,
            })}\n\n`
          );

          res.end();
        },
      });
    } catch (err) {
      logger.error("Query controller error", {
        workspaceId,
        error: err instanceof Error ? err.message : String(err),
      });

      /*
        If headers have already been sent (streaming started),
        we cannot send a normal error response. Send an SSE error
        event instead so the client knows something went wrong.
      */
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "Something went wrong" })}\n\n`
        );
        res.end();
        return;
      }

      next(err);
    }
  },
};