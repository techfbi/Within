import type { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import { getRedis } from "../config/redis.js";
import { LIMITS } from "../config/limits.js";
import { RateLimitError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

// In-memory fallback limiters, used when Redis is unavailable.
// These are per-process only (not distributed across instances)
// but they prevent the API from being completely unprotected
// during a Redis outage.
const memoryFallbacks = {
  login: new RateLimiterMemory({
    keyPrefix: "mem:login",
    points: LIMITS.LOGIN_RATE_LIMIT_PER_15MIN,
    duration: 15 * 60,
  }),
  upload: new RateLimiterMemory({
    keyPrefix: "mem:upload",
    points: LIMITS.UPLOAD_RATE_LIMIT_PER_HOUR,
    duration: 60 * 60,
  }),
  query: new RateLimiterMemory({
    keyPrefix: "mem:query",
    points: LIMITS.QUERY_RATE_LIMIT_PER_HOUR,
    duration: 60 * 60,
  }),
};

const makeLimiter = (keyPrefix: string, points: number, durationSecs: number) =>
  new RateLimiterRedis({
    storeClient: getRedis(),
    keyPrefix,
    points,
    duration: durationSecs,
    insuranceLimiter: memoryFallbacks[keyPrefix.replace("rl:", "") as keyof typeof memoryFallbacks],
  });

const limiters = {
  login: makeLimiter("rl:login", LIMITS.LOGIN_RATE_LIMIT_PER_15MIN, 15 * 60),
  upload: makeLimiter("rl:upload", LIMITS.UPLOAD_RATE_LIMIT_PER_HOUR, 60 * 60),
  query: makeLimiter("rl:query", LIMITS.QUERY_RATE_LIMIT_PER_HOUR, 60 * 60),
};

type LimiterKey = keyof typeof limiters;

export const rateLimit = (operation: LimiterKey) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const key = req.user?.id ?? req.ip ?? "unknown";

    try {
      await limiters[operation].consume(key);
      next();
    } catch (err) {
      // rate-limiter-flexible throws a RateLimiterRes object when the
      // limit is exceeded. it is NOT an Error instance.
      // If it IS an Error instance, Redis itself failed.
      if (err instanceof Error) {
        logger.error("Rate limiter Redis failure, failing open", {
          operation,
          error: err.message,
        });
        // Fail open: allow the request through rather than blocking
        // all traffic during a Redis outage. The in-memory insurance
        // limiter inside RateLimiterRedis already handled the fallback.
        next();
        return;
      }

      // Not an Error, this is the RateLimiterRes object = limit exceeded
      next(new RateLimitError());
    }
  };
};