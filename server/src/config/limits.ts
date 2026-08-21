import { env } from "./env.js";

// All limits live here, not scattered across handlers. 
// If we decide to raise the file size cap from 50MB to 100MB, we change one env var nothing else. 
// The as const makes these values readonly so nothing can accidentally mutate them at runtime.

export const LIMITS = {
  MAX_FILE_SIZE_BYTES: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  MAX_FILES_PER_WORKSPACE: env.MAX_FILES_PER_WORKSPACE,
  MAX_WORKSPACE_STORAGE_BYTES: env.MAX_WORKSPACE_STORAGE_MB * 1024 * 1024,

  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ] as const,

  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".txt", ".md"] as const,

  CHUNK_SIZE_TOKENS: 512,
  CHUNK_OVERLAP_TOKENS: 128,
  MAX_CHUNKS_PER_DOCUMENT: 2000,

  //This controls your RAG pipeline. 
  RETRIEVAL_TOP_K: 20, //how many matching chunks w want back.
  CONTEXT_TOP_K: 10,
  MIN_RELEVANCE_SCORE: 0.3, //helps determine:"Are these chunks actually relevant enough to answer this question?"

  MAX_CONTEXT_TOKENS: 8000, //These prevent from dumping unlimited material into the LLM.
  MAX_RESPONSE_TOKENS: 2000,
  MAX_PAGES_PER_DOCUMENT: 800,

  UPLOAD_RATE_LIMIT_PER_HOUR: env.UPLOAD_RATE_LIMIT_PER_HOUR,
  QUERY_RATE_LIMIT_PER_HOUR: env.QUERY_RATE_LIMIT_PER_HOUR,
  LOGIN_RATE_LIMIT_PER_15MIN: env.LOGIN_RATE_LIMIT_PER_15MIN,

  INGESTION_TIMEOUT_MS: 5 * 60 * 1000,
  EMBEDDING_BATCH_SIZE: 100,
} as const;