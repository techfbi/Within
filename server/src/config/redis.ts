import Redis from "ioredis";
import { env } from "./env.js";

let instance: Redis | null = null;

export const getRedis = (): Redis => {
  if (instance) return instance;

  instance = new Redis(env.REDIS_URL, {
    tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  });

  instance.on("connect", () => console.log("Redis connected"));
  instance.on("error", (err: Error) => console.error("Redis error:", err.message));

  return instance;
};