import type { Request, Response, NextFunction } from "express";
import { conversationService } from "../services/conversation/conversation.service.js";

export const conversationController = {
  getAllByWorkspace: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { workspaceId } = req.params as { workspaceId: string };

      const conversations = await conversationService.getAllByWorkspace(
        workspaceId,
        req.accessToken!
      );
      res.json({ conversations });
    } catch (err) {
      next(err);
    }
  },

  getById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const conversation = await conversationService.getById(
        conversationId,
        req.accessToken!
      );
      res.json({ conversation });
    } catch (err) {
      next(err);
    }
  },

  getMessages: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { conversationId } = req.params as { conversationId: string };

      const messages = await conversationService.getMessagesVerified(
        conversationId,
        req.user!.id,
        req.accessToken!
      );
      res.json({ messages });
    } catch (err) {
      next(err);
    }
  },

  delete: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { conversationId } = req.params as { conversationId: string };

      await conversationService.delete(
        conversationId,
        req.user!.id,
        req.accessToken!
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};