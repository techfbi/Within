import React from "react";
import type { DocumentStatus } from "@/types/document";
import { cn } from "@/lib/utils";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  errorMessage?: string | null;
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  QUEUED: {
    label: "Queued",
    className: "bg-surface-raised text-text-secondary border-border",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-surface-raised text-accent border-border",
  },
  EXTRACTING: {
    label: "Extracting text",
    className: "bg-surface-raised text-accent border-border",
  },
  CHUNKING: {
    label: "Chunking",
    className: "bg-surface-raised text-accent border-border",
  },
  EMBEDDING: {
    label: "Embedding",
    className: "bg-surface-raised text-accent border-border",
  },
  INDEXING: {
    label: "Indexing",
    className: "bg-surface-raised text-accent border-border",
  },
  READY: {
    label: "Ready",
    className: "bg-green-50 text-emerald-700 border-green-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
  },
};

export const DocumentStatusBadge = ({
  status,
  errorMessage,
}: DocumentStatusBadgeProps) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.QUEUED;
  const isProcessing =
    status !== "READY" && status !== "FAILED" && status !== "QUEUED";

  return (
    <span
      title={errorMessage ? `Error: ${errorMessage}` : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border tracking-wide",
        config.className
      )}
    >
      {isProcessing && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
          aria-hidden="true"
        />
      )}
      {status === "READY" && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
          aria-hidden="true"
        />
      )}
      {status === "FAILED" && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
};

