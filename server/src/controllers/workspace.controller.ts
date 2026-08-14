import type { Request, Response, NextFunction } from "express";
import { workspaceService } from "../services/workspace/workspace.service.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.schema.js";

export const workspaceController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaces = await workspaceService.getAll(
        req.user!.id,
        req.accessToken!
      );
      res.json({ workspaces });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      /* params are validated upstream by the validate middleware
         so workspaceId is guaranteed to be a UUID string here */
      const { workspaceId } = req.params as { workspaceId: string };

      const workspace = await workspaceService.getById(
        workspaceId,
        req.user!.id,
        req.accessToken!
      );
      res.json({ workspace });
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspace = await workspaceService.create(
        req.user!.id,
        req.body as CreateWorkspaceInput
      );
      res.status(201).json({ workspace });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      /* params are validated upstream by the validate middleware
         so workspaceId is guaranteed to be a UUID string here */
      const { workspaceId } = req.params as { workspaceId: string };

      const workspace = await workspaceService.update(
        workspaceId,
        req.user!.id,
        req.body as UpdateWorkspaceInput
      );
      res.json({ workspace });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      /* params are validated upstream by the validate middleware
         so workspaceId is guaranteed to be a UUID string here */
      const { workspaceId } = req.params as { workspaceId: string };

      await workspaceService.delete(workspaceId, req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};