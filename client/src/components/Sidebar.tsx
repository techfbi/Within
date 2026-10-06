"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useUIStore } from "@/store/ui.store";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

type Theme = "system" | "light" | "dark";

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  system: (
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  light: (
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
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { user } = useAuth();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const setCreateModalOpen = useUIStore((s) => s.setCreateWorkspaceModalOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [signingOut, setSigningOut] = useState(false);

  const cycleTheme = () => {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? "system";
    setTheme(next);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setActiveWorkspaceId(null);
    router.push("/login");
  };

  const handleWorkspaceClick = (id: string) => {
    setActiveWorkspaceId(id);
    onNavigate?.();
  };

  const userName = user?.user_metadata?.["full_name"] as string | undefined;
  const userEmail = user?.email ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-display font-bold text-base text-text-primary tracking-tight"
          onClick={onNavigate}
        >
          {brand.name}
        </Link>
        <button
          onClick={() => {
            setCreateModalOpen(true);
            onNavigate?.();
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
          aria-label="New workspace"
          title="New workspace"
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
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 mb-2 text-xs text-text-disabled font-medium uppercase tracking-wider">
          Workspaces
        </p>

        {isLoading && (
          <div className="space-y-1 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-md bg-surface-raised animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && workspaces?.length === 0 && (
          <p className="px-2 text-xs text-text-disabled">No workspaces yet</p>
        )}

        {!isLoading && workspaces && workspaces.length > 0 && (
          <nav aria-label="Workspaces">
            {workspaces.map((workspace: Workspace) => {
              const isActive = pathname.startsWith(
                `/workspace/${workspace.id}`,
              );
              return (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.id}`}
                  onClick={() => handleWorkspaceClick(workspace.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors w-full",
                    isActive
                      ? "bg-accent-muted text-accent font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-raised",
                  )}
                >
                  <span className="truncate">{workspace.name}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border space-y-3">
        {(userName || userEmail) && (
          <div className="min-w-0">
            {userName && (
              <p className="text-xs font-medium text-text-primary truncate">
                {userName}
              </p>
            )}
            <p className="text-xs text-text-disabled truncate">{userEmail}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={cycleTheme}
            className="text-text-disabled hover:text-text-secondary transition-colors p-1.5 rounded-md hover:bg-surface-raised"
            aria-label={`Theme: ${theme}`}
            title={`Theme: ${theme}`}
          >
            {THEME_ICONS[theme]}
          </button>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex flex-col w-65 shrink-0 border-r border-border bg-surface h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Tablet overlay sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-0 top-0 h-full w-65 bg-surface border-r border-border z-50 lg:hidden"
            >
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
