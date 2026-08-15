import { Worker, type Job } from "bullmq";
import { getRedis } from "../config/redis.js";
import { supabaseAdmin } from "../config/supabase.js";
import { documentRepo } from "../repositories/document.repo.js";
import { LIMITS } from "../config/limits.js";
import { logger } from "../utils/logger.js";
import type { IngestionJobData } from "../config/queue.js";
import mammoth from "mammoth";
//pdf-parse is a CommonJS package that does not export a proper ESM default
import { createRequire } from "module";
const require = createRequire(import.meta.url);
interface PdfParseOptions {
  pagerender?: (pageData: unknown) => string | Promise<string>;
  max?: number;
}

interface PdfParseResult {
  text: string;
  numpages: number;
}

const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
  options?: PdfParseOptions
) => Promise<PdfParseResult>;

/*
  The worker listens on the document-ingestion queue and processes
  one job at a time per worker instance. Concurrency is set to 2
  meaning at most 2 documents are processed simultaneously on this
  server instance. will raise this only if memory allows, PDF parsing
  and embedding generation are both memory intensive.
*/
const CONCURRENCY = 2;

export interface ExtractedDocument {
  text: string;
  pageCount: number;
}

/*
  Checks PDF page count without extracting full text.
  pdf-parse renders each page to get text by default.
  Passing a pagerender function that returns an empty string
  stops it from doing expensive text extraction per page
  while still giving us numpages from the metadata.
*/
const getPdfPageCount = async (buffer: Buffer): Promise<number> => {
  const result = await pdfParse(buffer, {
    pagerender: () => Promise.resolve(""),
  });
  return result.numpages;
};

/*
  Extracts plain text from the file buffer based on MIME type.
  For PDFs the page count check must happen before calling this
  function. For other formats page count is estimated here.
*/
const extractText = async (
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedDocument> => {

  //for pdf... reads the PDF and extracts its text.
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return {
      text: result.text,
      pageCount: result.numpages,
    };
  }

  //DOCX
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    //Mammoth takes the Word document and extracts the readable text.
    const result = await mammoth.extractRawText({ buffer });
    /*
      DOCX has no reliable page count without rendering.
      Estimate based on average words per page (250 words per page).
    */
    const wordCount = result.value.split(/\s+/).length;
    const estimatedPages = Math.ceil(wordCount / 250);
    return {
      text: result.value,
      pageCount: estimatedPages,
    };
  }

  //TXT and Markdown
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    const text = buffer.toString("utf8");
    const wordCount = text.split(/\s+/).length;
    const estimatedPages = Math.ceil(wordCount / 250);
    return {
      text,
      pageCount: estimatedPages,
    };
  }

  throw new Error(`Unsupported MIME type for extraction: ${mimeType}`);
};

/*
  Downloads the document file from Supabase Storage using a
  short lived signed URL generated server side.
  The file is never publicly accessible.
*/
const downloadFile = async (storagePath: string): Promise<Buffer> => {
  const { data: signedUrlData, error: signedUrlError } =
    await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(storagePath, 60); //creates a temporary URL that expires after 60 seconds.

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signedUrlError?.message}`);
  }

  const response = await fetch(signedUrlData.signedUrl); //downloads the file.

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/*
  Processes a single ingestion job.
  Updates document status at each stage so Supabase Realtime
  can push live progress to the client.
*/
const processJob = async (job: Job<IngestionJobData>): Promise<void> => {
  const { documentId, workspaceId, storagePath, mimeType } = job.data;

  logger.info("Ingestion job started", { documentId, workspaceId });

  try {
    await documentRepo.updateStatus(documentId, "PROCESSING");
    await documentRepo.updateStatus(documentId, "EXTRACTING");

    const buffer = await downloadFile(storagePath);

    /*
      For PDFs check page count before full text extraction.
      getPdfPageCount does a minimal parse pass that returns
      metadata without rendering every page to text.
      This avoids wasting CPU and memory on documents we will reject.
      For DOCX and plain text there is no cheap page count check
      available so we estimate after extraction.
    */
    if (mimeType === "application/pdf") {
      const pageCount = await getPdfPageCount(buffer);

      if (pageCount > LIMITS.MAX_PAGES_PER_DOCUMENT) {
        await documentRepo.updateStatus(
          documentId,
          "FAILED",
          `This document has ${pageCount} pages. The limit is ${LIMITS.MAX_PAGES_PER_DOCUMENT} pages. Consider splitting it into sections.`
        );
        return;
      }

      await documentRepo.updatePageCount(documentId, pageCount);
    }

    /*
      Full text extraction, for PDFs this is the expensive step
      that we now only reach after confirming the page count is
      within limits.
    */
    const extracted = await extractText(buffer, mimeType);

    logger.info("Text extraction complete", {
      documentId,
      pageCount: extracted.pageCount,
      textLength: extracted.text.length,
    });

    /*
      For non-PDF formats enforce page count after extraction
      since there is no cheaper alternative.
    */
    if (mimeType !== "application/pdf") {
      if (extracted.pageCount > LIMITS.MAX_PAGES_PER_DOCUMENT) {
        await documentRepo.updateStatus(
          documentId,
          "FAILED",
          `This document exceeds the ${LIMITS.MAX_PAGES_PER_DOCUMENT} page limit. Consider splitting it into sections.`
        );
        return;
      }

      await documentRepo.updatePageCount(documentId, extracted.pageCount);
    }

    await documentRepo.updateStatus(documentId, "CHUNKING");

    logger.info("Ingestion job complete (Phase 2 stub)", {
      documentId,
      pageCount: extracted.pageCount,
    });

    await documentRepo.updateStatus(documentId, "READY");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("Ingestion job failed", {
      documentId,
      workspaceId,
      error: message,
      attempt: job.attemptsMade,
    });

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;

    if (isLastAttempt) {
      await documentRepo.updateStatus(
        documentId,
        "FAILED",
        "Document processing failed. Please try uploading again."
      );
    }

    throw err;
  }
};

/*
  Creates and starts the BullMQ worker.
  we call this once at server startup.
*/
export const startIngestionWorker = () => {
  const worker = new Worker<IngestionJobData>(
    "document-ingestion",
    processJob,
    {
      connection: getRedis(),
      concurrency: CONCURRENCY,
    }
  );

  worker.on("completed", (job) => {
    logger.info("Ingestion job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Ingestion job failed permanently", {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info("Ingestion worker started", { concurrency: CONCURRENCY });

  return worker;
};