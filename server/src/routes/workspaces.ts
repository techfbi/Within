import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { workspaceController } from "../controllers/workspace.controller.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceParamsSchema,
} from "../validators/workspace.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/", workspaceController.getAll);

router.post(
  "/",
  validate({ body: createWorkspaceSchema }),
  workspaceController.create
);

router.get(
  "/:workspaceId",
  validate({ params: workspaceParamsSchema }),
  workspaceController.getById
);

router.patch(
  "/:workspaceId",
  validate({ params: workspaceParamsSchema, body: updateWorkspaceSchema }),
  workspaceController.update
);

router.delete(
  "/:workspaceId",
  validate({ params: workspaceParamsSchema }),
  workspaceController.delete
);

export default router;