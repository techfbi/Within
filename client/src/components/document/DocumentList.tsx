"use client";

import React from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStatus } from "@/hooks/useDocumentStatus";
import { useUIStore } from "@/store/ui.store";
import { DocumentItem } from "./DocumentItem";
import Button from "@/components/ui/Button";

interface DocumentListProps {
  workspaceId: string;
}

export const DocumentList = ({ workspaceId }: DocumentListProps) => {
  const { data: documents, isLoading, error } = useDocuments(workspaceId);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);

  /*
    Subscribe to live document status updates via Realtime and polling fallback
  */
  useDocumentStatus(workspaceId, documents);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border border-border bg-surface-raised animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-border bg-surface text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load documents. Please refresh or try again.
        </p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-border bg-surface text-center">
        <div className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-text-disabled mb-3 bg-surface-raised">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text-primary">
          No documents uploaded yet
        </p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          Upload PDF, DOCX, TXT, or MD documents to start building knowledge in this workspace.
        </p>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="w-auto px-4 mt-4"
        >
          Upload your first document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Documents ({documents.length})
        </p>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="w-auto text-xs px-3 py-1.5 h-auto"
        >
          Add document
        </Button>
      </div>

      <div className="space-y-2.5">
        {documents.map((doc) => (
          <DocumentItem key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
};

