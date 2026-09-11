import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { queryController } from "../controllers/query.controller.js";
import { queryBodySchema, queryParamsSchema } from "../validators/query.schema.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post(
  "/",
  rateLimit("query"),
  validate({ params: queryParamsSchema, body: queryBodySchema }),
  queryController.query
);

export default router;