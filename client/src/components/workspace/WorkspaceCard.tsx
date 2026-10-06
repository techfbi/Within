"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDeleteWorkspace } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Workspace } from "@/types/workspace";

interface WorkspaceCardProps {
  workspace: Workspace;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspace();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    deleteWorkspace(workspace.id, {
      onError: (error: Error) => {
        console.error("Delete workspace failed:", error.message);
      },
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <Link
        href={`/workspace/${workspace.id}`}
        onClick={() => setActiveWorkspaceId(workspace.id)}
        className="group block bg-surface border border-border rounded-lg p-5 hover:border-border-strong transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {workspace.name}
            </h3>
            {workspace.description && (
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs px-2 py-1 rounded text-text-disabled hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
            aria-label={
              confirmDelete
                ? "Click again to confirm deletion"
                : `Delete ${workspace.name}`
            }
          >
            {isDeleting ? "..." : confirmDelete ? "Confirm?" : "Delete"}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <span className="text-xs text-text-disabled">
            Updated {formatDate(workspace.updated_at)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
