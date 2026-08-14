import { documentRepo } from "../../repositories/document.repo.js";
import { workspaceRepo } from "../../repositories/workspace.repo.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { getIngestionQueue } from "../../config/queue.js";
import { LIMITS } from "../../config/limits.js";
import { ValidationError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import type { IngestionJobData } from "../../config/queue.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export const documentService = {
  getAll: (workspaceId: string, userId: string, accessToken: string) =>
    documentRepo.findAllByWorkspace(workspaceId, accessToken),

  getById: (documentId: string, workspaceId: string, userId: string, accessToken: string) =>
    documentRepo.findById(documentId, workspaceId, accessToken),

  upload: async (
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
    title?: string
  ) => {
    /*
      Verify the workspace exists and belongs to this user
      before doing anything with the file.
    */
    await workspaceRepo.verifyOwnership(workspaceId, userId);

    /*
      Check the workspace has not exceeded the maximum file count.
      Count existing documents regardless of status.
    */
    const existing = await documentRepo.findAllByWorkspace(workspaceId, userId + "admin", );

    /*
      We use supabaseAdmin for the count check since we need the
      true count including failed documents.
    */
    const { count, error: countError } = await supabaseAdmin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (countError) throw countError;

    if ((count ?? 0) >= LIMITS.MAX_FILES_PER_WORKSPACE) {
      throw new ValidationError(
        `This workspace has reached the limit of ${LIMITS.MAX_FILES_PER_WORKSPACE} documents`
      );
    }

    const documentId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const sanitizedFilename = documentId + extension;

    /*
      Storage path structure: userId/workspaceId/documentId/filename
      The RLS policy on storage.objects enforces that the first
      folder segment matches the authenticated user's ID.
    */
    const storagePath = `${userId}/${workspaceId}/${documentId}/${sanitizedFilename}`;

    /*
      Upload the file buffer to Supabase Storage.
      The bucket is private, no public access.
      Content type is set to the validated canonical MIME type,
      not whatever the browser sent.
    */
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error("Storage upload failed", {
        documentId,
        workspaceId,
        error: uploadError.message,
      });
      throw uploadError;
    }

    /*
      Create the document record in the database with QUEUED status.
      The ingestion worker will update this as it progresses.
    */
    const document = await documentRepo.create({
      id: documentId,
      workspace_id: workspaceId,
      title: title?.trim() || file.originalname,
      original_filename: file.originalname,
      storage_path: storagePath,
      mime_type: file.mimetype,
      file_size: file.size,
      status: "QUEUED",
    });

    /*
      Dispatch the ingestion job to BullMQ.
      The job ID matches the document ID for easy correlation in logs.
    */
    const jobData: IngestionJobData = {
      documentId,
      workspaceId,
      userId,
      storagePath,
      mimeType: file.mimetype,
    };

    await getIngestionQueue().add(documentId, jobData, { jobId: documentId });

    logger.info("Document uploaded and queued", {
      documentId,
      workspaceId,
      filename: file.originalname,
      size: file.size,
    });

    return document;
  },

  delete: async (
    documentId: string,
    workspaceId: string,
    userId: string
  ): Promise<void> => {
    /*
      Repository verifies ownership and returns the storage path.
      Cascade delete on the DB removes all chunks automatically.
    */
    const storagePath = await documentRepo.delete(documentId, workspaceId, userId);

    /*
      Remove the file from Supabase Storage after the DB record
      is deleted. If storage deletion fails we log it but do not
      throw, the document is already gone from the DB and the
      orphaned file causes no functional harm.
    */
    const { error } = await supabaseAdmin.storage
      .from("documents")
      .remove([storagePath]);

    if (error) {
      logger.warn("Storage file deletion failed after document delete", {
        documentId,
        storagePath,
        error: error.message,
      });
    }
  },
};