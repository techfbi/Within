"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadDocument } from "@/hooks/useDocuments";
import { useUIStore } from "@/store/ui.store";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface DocumentUploadModalProps {
  workspaceId: string;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 megabytes
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export const DocumentUploadModal = ({
  workspaceId,
}: DocumentUploadModalProps) => {
  const open = useUIStore((s) => s.uploadModalOpen);
  const setOpen = useUIStore((s) => s.setUploadModalOpen);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadDoc, isPending } = useUploadDocument(workspaceId);

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle("");
      setErrorMessage(null);
      setDragActive(false);
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        setOpen(false);
      }
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen, isPending]);

  const validateSelectedFile = (selectedFile: File): boolean => {
    const lowerName = selectedFile.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage("Supported file types are PDF, DOCX, TXT, and MD");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("File exceeds the 20MB limit");
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateSelectedFile(selected)) {
      setFile(selected);
      const cleanName = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped && validateSelectedFile(dropped)) {
      setFile(dropped);
      const cleanName = dropped.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file to upload");
      return;
    }

    uploadDoc(
      { file, title },
      {
        onSuccess: () => {
          setOpen(false);
        },
        onError: (err: Error) => {
          setErrorMessage(err.message || "Failed to upload document");
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
            onClick={() => !isPending && setOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md bg-surface border border-border rounded-lg shadow-sm p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="upload-modal-title"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2
                    id="upload-modal-title"
                    className="font-display font-bold text-lg text-text-primary"
                  >
                    Upload Document
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Add documents to build this workspace knowledge base
                  </p>
                </div>

                <button
                  onClick={() => !isPending && setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-text-disabled hover:text-text-primary hover:bg-surface-raised transition-colors"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-accent bg-accent-muted/20"
                      : "border-border hover:border-border-strong bg-surface-raised/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-10 h-10 mx-auto rounded-md border border-border flex items-center justify-center text-text-secondary mb-3 bg-surface">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-text-primary truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Click or drag a file to upload
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        PDF, DOCX, TXT, or MD up to 20MB
                      </p>
                    </div>
                  )}
                </div>

                {file && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Document Title
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title for this document"
                    />
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!file || isPending}
                    className="w-auto px-5"
                  >
                    {isPending ? "Uploading..." : "Upload document"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

