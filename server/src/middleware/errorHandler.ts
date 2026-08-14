import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

// Express's special 4-argument middleware
// Unexpected errors log the full stack server-side but only return a generic message to the client, 
// no stack traces, no DB internals, nothing exploitable, details is only included in development.

export const errorHandler = (
  err: unknown, //this tells Express it's an error handler
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
    //Operational errors (our typed AppError subclasses) get user-friendly messages with the right status
  if (err instanceof AppError) {
    logger.warn("Operational error", {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });


    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && env.NODE_ENV !== "production"
          ? { details: err.details }
          : {}),
      },
    });
    return;
  }

  logger.error("Unexpected error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  });
};