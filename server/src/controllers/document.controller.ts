import type { Request, Response, NextFunction } from "express";
import { documentService } from "../services/document/document.service.js";

export const documentController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params as { workspaceId: string };

      const documents = await documentService.getAll(
        workspaceId,
        req.user!.id,
        req.accessToken!
      );
      res.json({ documents });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, documentId } = req.params as {
        workspaceId: string;
        documentId: string;
      };

      const document = await documentService.getById(
        documentId,
        workspaceId,
        req.user!.id,
        req.accessToken!
      );
      res.json({ document });
    } catch (err) {
      next(err);
    }
  },

  upload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params as { workspaceId: string };

      if (!req.file) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "No file provided" },
        });
        return;
      }

      const document = await documentService.upload(
        workspaceId,
        req.user!.id,
        req.file,
        req.body?.title as string | undefined
      );

      res.status(202).json({ document });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, documentId } = req.params as {
        workspaceId: string;
        documentId: string;
      };

      await documentService.delete(documentId, workspaceId, req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};