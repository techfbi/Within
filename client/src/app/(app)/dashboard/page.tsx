"use client";

import { useUIStore } from "@/store/ui.store";
import Button from "@/components/ui/Button";

export default function DashboardPage() {
  const setCreateModalOpen = useUIStore((s) => s.setCreateWorkspaceModalOpen);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center mb-4">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-disabled"
          aria-hidden="true"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-primary">
        Select a workspace
      </p>
      <p className="text-xs text-text-secondary mt-1 max-w-xs">
        Choose a workspace from the sidebar or create a new one to get started
      </p>
      <Button
        onClick={() => setCreateModalOpen(true)}
        className="w-auto px-5 mt-5"
      >
        New workspace
      </Button>
    </div>
  );
}
