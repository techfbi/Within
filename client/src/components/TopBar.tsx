"use client";

import { useUIStore } from "@/store/ui.store";
import { brand } from "@/config/brand";
import Link from "next/link";

export default function TopBar() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="lg:hidden sticky top-0 z-30 w-full h-12 bg-surface border-b border-border flex items-center justify-between px-4">
      <Link
        href="/dashboard"
        className="font-display font-bold text-base text-text-primary tracking-tight"
      >
        {brand.name}
      </Link>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        aria-label="Toggle menu"
        aria-expanded={sidebarOpen}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {sidebarOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>
    </header>
  );
}
