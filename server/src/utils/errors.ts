export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTH_REQUIRED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class FileTooLargeError extends AppError {
  constructor(limitMB: number) {
    super(`File exceeds the ${limitMB}MB limit`, 413, "FILE_TOO_LARGE");
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor() {
    super(
      "File type not supported. Upload PDF, DOCX, TXT, or Markdown.",
      415,
      "UNSUPPORTED_FILE_TYPE"
    );
  }
}

export class ProcessingError extends AppError {
  constructor(message = "Document processing failed") {
    super(message, 500, "PROCESSING_ERROR");
  }
}

export class AIError extends AppError {
  constructor(message = "AI service temporarily unavailable") {
    super(message, 503, "AI_ERROR");
  }
}