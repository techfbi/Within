import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { LIMITS } from "../config/limits.js";
import {
  FileTooLargeError,
  UnsupportedFileTypeError,
  ValidationError,
} from "../utils/errors.js";

/*
  Magic byte signatures for each supported format.
  We read the first 8 bytes of the actual file buffer and compare
  against these. This cannot be faked by renaming a file because
  the bytes come from the file content itself, not the filename
  or the browser provided Content-Type header.
*/
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04], // PK (ZIP header, DOCX is a ZIP container)
  ],
};

/*
  Map file extensions to their canonical MIME type.
  Used to normalise what we store regardless of what the browser sent.
*/
const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

const detectMimeFromBuffer = (buffer: Buffer, extension: string): boolean => {
  const signatures = MAGIC_BYTES[EXTENSION_TO_MIME[extension] ?? ""];

  /*
    TXT and MD have no magic bytes. We validate them by checking
    the buffer can be decoded as UTF-8 without replacement characters.
    If the file contains binary garbage it will produce the Unicode
    replacement character U+FFFD when decoded.
  */
  if (!signatures) {
    if (extension === ".txt" || extension === ".md") {
      const sample = buffer.slice(0, 1024).toString("utf8");
      return !sample.includes("\uFFFD");
    }
    return false;
  }

  /*
    Check whether the file buffer starts with any of the known
    byte signatures for this extension.
  */
  return signatures.some((sig) =>
    sig.every((byte, index) => buffer[index] === byte)
  );
};

/*
  Multer configured to store uploads in memory as a Buffer.
  We never write to disk on the server. The buffer is validated
  then streamed to Supabase Storage.
  File size limit is enforced here as the first line of defence.
*/
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LIMITS.MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = "." + (file.originalname.split(".").pop() ?? "").toLowerCase();

    if (!LIMITS.ALLOWED_EXTENSIONS.includes(extension as typeof LIMITS.ALLOWED_EXTENSIONS[number])) {
      callback(new UnsupportedFileTypeError());
      return;
    }

    callback(null, true);
  },
});

/*
  Wraps multer's single file upload and adds magic byte validation
  after multer has populated req.file with the buffer.
  Export this as the middleware chain for document upload routes.
*/
export const uploadMiddleware = [
  (req: Request, res: Response, next: NextFunction) => {
    multerUpload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new FileTooLargeError(LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024));
          return;
        }
        next(new ValidationError(err.message));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },

  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      next(new ValidationError("No file provided"));
      return;
    }

    const extension =
      "." + (req.file.originalname.split(".").pop() ?? "").toLowerCase();

    /*
      Second line of defence: validate the actual file content
      against the known magic bytes for the detected extension.
      The browser provided mimetype is intentionally ignored here.
    */
    const isValid = detectMimeFromBuffer(req.file.buffer, extension);

    if (!isValid) {
      next(new UnsupportedFileTypeError());
      return;
    }

    /*
      Overwrite the browser provided mimetype with our own canonical
      value derived from the extension and confirmed by magic bytes.
      This is what gets stored in the database, not what the browser said.
    */
    req.file.mimetype = EXTENSION_TO_MIME[extension] ?? req.file.mimetype;

    next();
  },
];