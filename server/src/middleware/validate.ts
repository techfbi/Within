import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { ValidationError } from "../utils/errors.js";

// Sits between the route and controller. Parses and validates the request body/params/query against a Zod schema before the handler ever runs. 
// If validation fails, we throw ValidationError which the error handler returns as a 400 with field-level error details. 
// Controllers can trust the data is valid,  no defensive checks inside them.

type ZodSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

export const validate = (schemas: ZodSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);

      if (!result.success) {
        return next(
          new ValidationError(
            "Invalid request data",
            result.error.flatten().fieldErrors
          )
        );
      }

      req.body = result.data as Record<string, unknown>;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);

      if (!result.success) {
        return next(
          new ValidationError(
            "Invalid request parameters",
            result.error.flatten().fieldErrors
          )
        );
      }

      req.params = result.data as ParamsDictionary;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);

      if (!result.success) {
        return next(
          new ValidationError(
            "Invalid query parameters",
            result.error.flatten().fieldErrors
          )
        );
      }

      req.query = result.data as ParsedQs;
    }

    next();
  };
};