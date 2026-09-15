import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { conversationController } from "../controllers/conversation.controller.js";
import {
  conversationParamsSchema,
  workspaceConversationParamsSchema,
} from "../validators/conversation.schema.js";

/*
  Two routers, one mounted under workspaces for workspace-scoped
  conversation listing, one mounted directly for individual
  conversation access by ID.
*/
export const workspaceConversationRouter = Router({ mergeParams: true });
export const conversationRouter = Router();

workspaceConversationRouter.use(requireAuth);
conversationRouter.use(requireAuth);

workspaceConversationRouter.get(
  "/",
  validate({ params: workspaceConversationParamsSchema }),
  conversationController.getAllByWorkspace
);

conversationRouter.get(
  "/:conversationId",
  validate({ params: conversationParamsSchema }),
  conversationController.getById
);

conversationRouter.get(
  "/:conversationId/messages",
  validate({ params: conversationParamsSchema }),
  conversationController.getMessages
);

conversationRouter.delete(
  "/:conversationId",
  validate({ params: conversationParamsSchema }),
  conversationController.delete
);