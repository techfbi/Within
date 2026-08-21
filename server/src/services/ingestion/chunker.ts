import { LIMITS } from "../../config/limits.js";

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  sectionTitle: string | null;
  tokenCount: number;
}

/*
  Rough token estimator. OpenAI uses ~4 characters per token on average
  for English text. This avoids importing a full tokenizer library
  for chunking decisions. Actual token counts sent to the embedding
  API will differ slightly but stay within safe margins.
*/
const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 4);

/*
  Splits text on sentence boundaries. Tries to break on periods,
  question marks, and exclamation marks followed by whitespace.
  Falls back to whitespace splitting if no sentence boundary found.
*/
const splitIntoSentences = (text: string): string[] =>
  text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim()) // removes unnecessary spaces.
    .filter((s) => s.length > 0); // removes empty strings.

/*
  Detects whether a line looks like a section heading.
  Matches common patterns: all caps short lines, lines ending
  with a colon, markdown headings (# ## ###), and numbered
  section headings like "1.", "1.1", "Chapter 3".
*/
const isSectionHeading = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return false;

  return (
    /^#{1,4}\s/.test(trimmed) ||
    /^(chapter|section|part)\s+\d+/i.test(trimmed) ||
    /^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed) ||
    (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80) ||
    /^[A-Z][^.!?]*:$/.test(trimmed)
  );
};

/*
  Strips markdown syntax from headings for clean storage.
  Removes leading # characters and trims whitespace.
*/
const cleanHeading = (line: string): string =>
  line.replace(/^#{1,4}\s+/, "").trim();

/*
  Splits extracted document text into overlapping chunks.

  Strategy:
  1. Split text into lines and detect section headings.
  2. Group lines into sections, tracking the current heading.
  3. Within each section, accumulate sentences into chunks
     that stay within CHUNK_SIZE_TOKENS.
  4. When a chunk would exceed the token limit, save it and
     start a new chunk with CHUNK_OVERLAP_TOKENS of carry-over
     text from the previous chunk to preserve context across
     chunk boundaries.
  5. Hard stop at MAX_CHUNKS_PER_DOCUMENT.
*/
export const chunkDocument = (text: string): Chunk[] => {
  const chunks: Chunk[] = [];
  const lines = text.split("\n");

  let currentSection: string | null = null;
  let currentBuffer: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  const saveChunk = (content: string, sectionTitle: string | null) => {
    if (chunks.length >= LIMITS.MAX_CHUNKS_PER_DOCUMENT) return;

    const trimmed = content.trim();
    if (!trimmed) return;

    chunks.push({
      content: trimmed,
      chunkIndex,
      pageNumber: null,
      sectionTitle,
      tokenCount: estimateTokens(trimmed),
    });

    chunkIndex++;
  };

  const flushBuffer = () => {
    if (currentBuffer.length === 0) return;

    const content = currentBuffer.join(" ");
    saveChunk(content, currentSection);

    /*
      Carry over the last CHUNK_OVERLAP_TOKENS worth of sentences
      into the next chunk so context is not lost at boundaries.
    */
    const overlapTarget = LIMITS.CHUNK_OVERLAP_TOKENS;
    const sentences = splitIntoSentences(content);
    const overlapSentences: string[] = [];
    let overlapTokens = 0;

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = estimateTokens(sentences[i] ?? "");
      if (overlapTokens + sentenceTokens > overlapTarget) break;
      overlapSentences.unshift(sentences[i] ?? "");
      overlapTokens += sentenceTokens;
    }

    currentBuffer = overlapSentences;
    currentTokens = overlapTokens;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) continue; //skip blank lines

    if (isSectionHeading(trimmedLine)) {
      /*
        New section detected. Flush whatever is in the buffer
        under the previous section heading before switching.
      */
      flushBuffer();
      currentSection = cleanHeading(trimmedLine);
      continue;
    }

    const sentences = splitIntoSentences(trimmedLine);

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);

      if (
        currentTokens + sentenceTokens > LIMITS.CHUNK_SIZE_TOKENS &&
        currentBuffer.length > 0
      ) {
        flushBuffer();
      }

      currentBuffer.push(sentence);
      currentTokens += sentenceTokens;
    }
  }

  /*
    Flush any remaining text that did not fill a full chunk.
  */
  flushBuffer();

  return chunks;
};