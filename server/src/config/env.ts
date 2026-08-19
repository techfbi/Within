import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000").transform(Number),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  REDIS_URL: z.string().min(1),

  GROQ_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(), // dormant, kept for future upgrade to paid Claude  OPENAI_API_KEY: z.string().min(1),

  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),

  CLIENT_URL: z.string().url().default("http://localhost:3000"),

  MAX_FILE_SIZE_MB: z.string().default("50").transform(Number),
  MAX_FILES_PER_WORKSPACE: z.string().default("20").transform(Number),
  MAX_WORKSPACE_STORAGE_MB: z.string().default("500").transform(Number),

  UPLOAD_RATE_LIMIT_PER_HOUR: z.string().default("10").transform(Number),
  QUERY_RATE_LIMIT_PER_HOUR: z.string().default("60").transform(Number),
  LOGIN_RATE_LIMIT_PER_15MIN: z.string().default("10").transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;