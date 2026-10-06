"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useUIStore } from "@/store/ui.store";
import { brand } from "@/config/brand";
import { useState } from "react";

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

export default function AppNav() {
  const router = useRouter();
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setActiveWorkspaceId(null);
    router.push("/login");
  };

  const cycleTheme = () => {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? "system";
    setTheme(next);
  };

  return (
    <nav className="w-full border-b border-border bg-surface">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-display font-bold text-base text-text-primary tracking-tight"
        >
          {brand.name}
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="text-text-disabled hover:text-text-secondary transition-colors p-1.5 rounded-md hover:bg-surface-raised"
            aria-label={`Current theme: ${theme}. Click to cycle.`}
            title={`Theme: ${theme}`}
          >
            {THEME_ICONS[theme]}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
