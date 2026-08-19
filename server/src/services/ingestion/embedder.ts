import OpenAI from "openai";
import { env } from "../../config/env.js";
import { LIMITS } from "../../config/limits.js";
import { logger } from "../../utils/logger.js";
import type { Chunk } from "./chunker.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

/*
  Sleeps for the given number of milliseconds.
  Used for exponential backoff on rate limit errors.
*/
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/*
  Embeds a single batch of text strings using OpenAI
  text-embedding-3-small. Retries up to 3 times with
  exponential backoff on rate limit or server errors.
*/
const embedBatch = async (
  texts: string[],
  attempt = 0
): Promise<number[][]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      dimensions: 1536,
    });

    /*
      OpenAI returns embeddings in the same order as the input texts.
      Sort by index to be safe in case the API ever changes behaviour.
    */
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (err: unknown) {
    const isRateLimit =
      err instanceof OpenAI.APIError && err.status === 429;
    const isServerError =
      err instanceof OpenAI.APIError && err.status >= 500;

    if ((isRateLimit || isServerError) && attempt < 3) {
      const delay = Math.pow(2, attempt) * 2000;
      logger.warn("OpenAI embedding rate limited, retrying", {
        attempt,
        delayMs: delay,
      });
      await sleep(delay);
      return embedBatch(texts, attempt + 1);
    }

    throw err;
  }
};

/*
  Embeds all chunks in batches of EMBEDDING_BATCH_SIZE.
  Processes batches sequentially to avoid overwhelming the
  OpenAI rate limit on the free tier credit account.
  Returns the original chunks with embeddings attached.
*/
export const embedChunks = async (chunks: Chunk[]): Promise<EmbeddedChunk[]> => {
  const embedded: EmbeddedChunk[] = [];
  const batchSize = LIMITS.EMBEDDING_BATCH_SIZE;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);

    logger.info("Embedding batch", {
      batchNumber: Math.floor(i / batchSize) + 1,
      totalBatches: Math.ceil(chunks.length / batchSize),
      chunkCount: batch.length,
    });

    const embeddings = await embedBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      embedded.push({
        ...batch[j]!,
        embedding: embeddings[j]!,
      });
    }

    /*
      Small delay between batches to stay well within
      OpenAI rate limits even as usage grows.
    */
    if (i + batchSize < chunks.length) {
      await sleep(200);
    }
  }

  return embedded;
};