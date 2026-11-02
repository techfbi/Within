"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useUIStore } from "@/store/ui.store";
import { DocumentList } from "@/components/document/DocumentList";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import Button from "@/components/ui/Button";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspaces();
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);

  const workspace = workspaces?.find((w) => w.id === workspaceId);

  /*
    Keep active workspace ID synced with the current URL parameter
  */
  useEffect(() => {
    if (workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [workspaceId, setActiveWorkspaceId]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Workspaces
            </Link>
            <span className="text-xs text-text-disabled" aria-hidden="true">
              /
            </span>
            <span className="text-xs text-text-primary font-medium">
              {workspace?.name ?? "Workspace"}
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary">
            {workspace?.name ?? (isWorkspacesLoading ? "Loading..." : "Workspace")}
          </h1>

          {workspace?.description && (
            <p className="text-sm text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
              {workspace.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setUploadModalOpen(true)}
            className="w-auto text-xs px-3 py-2 border border-border"
          >
            Upload Document
          </Button>
          <Button
            onClick={() => router.push(`/workspace/${workspaceId}/conversation/new`)}
            className="w-auto text-xs px-4 py-2"
          >
            Ask Questions
          </Button>
        </div>
      </div>

      {/* Documents Section */}
      <section aria-labelledby="documents-heading">
        <DocumentList workspaceId={workspaceId} />
      </section>

      {/* Upload Modal */}
      <DocumentUploadModal workspaceId={workspaceId} />
    </div>
  );
}

