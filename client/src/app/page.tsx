import Link from "next/link";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { cn } from "@/lib/utils";
import { AnimatedBeamDemo } from "@/components/ui/animated-beam-bidirectional";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  openGraph: {
    title: brand.name,
    description: brand.description,
  },
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      <InteractiveGridPattern
        className={cn(
          "mask-[radial-gradient(700px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[150%] skew-y-12 z-1",
        )}
      />
      {/* Ghost workspace grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        {/* Large document panel top right */}
        <div
          className="absolute top-16 -right-15 w-80 h-52 rounded-lg border border-border opacity-40"
          style={{ background: "var(--color-surface)" }}
        >
          <div className="p-4 space-y-2">
            <div className="h-2 w-24 rounded-full bg-border" />
            <div className="h-2 w-40 rounded-full bg-border opacity-60" />
            <div className="h-2 w-32 rounded-full bg-border opacity-40" />
            <div className="mt-4 h-2 w-36 rounded-full bg-border opacity-60" />
            <div className="h-2 w-28 rounded-full bg-border opacity-40" />
            <div className="h-2 w-44 rounded-full bg-border opacity-30" />
          </div>
        </div>

        {/* Small tag top right overlapping */}
        <div
          className="absolute top-12 right-36 w-24 h-7 rounded-full border border-border opacity-30"
          style={{ background: "var(--color-surface)" }}
        />

        {/* Bottom left panel */}
        <div
          className="absolute bottom-10 -left-10 w-72 h-44 rounded-lg border border-border opacity-30"
          style={{
            background: "var(--color-surface)",
            animation: "shimmer 6s ease-in-out infinite",
          }}
        >
          <div className="p-4 space-y-2">
            <div className="h-2 w-20 rounded-full bg-border opacity-80" />
            <div className="h-2 w-36 rounded-full bg-border opacity-50" />
            <div className="h-2 w-28 rounded-full bg-border opacity-40" />
            <div className="mt-3 h-2 w-32 rounded-full bg-border opacity-30" />
          </div>
        </div>

        {/* Tiny accent chip bottom left */}
        <div
          className="absolute bottom-26 left-40 w-16 h-6 rounded-full opacity-20"
          style={{ background: "var(--color-accent)" }}
        />

        {/* Right side mid panel */}
        <div
          className="absolute top-1/2 -right-20 w-64 h-36 rounded-lg border border-border opacity-20"
          style={{ background: "var(--color-surface)" }}
        >
          <div className="p-4 space-y-2">
            <div className="h-2 w-28 rounded-full bg-border opacity-60" />
            <div className="h-2 w-20 rounded-full bg-border opacity-40" />
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="w-full px-6 py-5 border rounded-2xl flex items-center justify-between max-w-5xl mx-auto z-10">
        <span className="font-display font-bold text-lg text-text-primary tracking-tight">
          Within
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-6 sm:py-16 text-center max-w-3xl lg:max-w-5xl mx-auto w-full">
        <h1 className="font-display font-extrabold text-5xl sm:text-5xl md:text-6xl lg:text-8xl text-text-primary leading-none tracking-tight mb-4 sm:mb-6 z-10">
          Your documents,
          <br />
          <span className="text-accent">finally answerable.</span>
        </h1>

        <p className="z-10 text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl lg:max-w-2xl mb-6 sm:mb-10">
          Upload your documents, build a private knowledge base, and get
          grounded answers from your own sources. Nothing fabricated. Nothing
          leaked.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 sm:mb-10 z-10 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto text-sm bg-accent text-white px-6 py-2.5 sm:py-3 rounded-md hover:bg-accent-hover transition-colors font-medium"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-sm text-text-secondary hover:text-text-primary px-6 py-2.5 sm:py-3 rounded-md border border-border hover:border-border-strong transition-colors"
          >
            Sign in to your workspace
          </Link>
        </div>

        {/* AnimatedBeamDemo hidden on mobile portrait only */}
        <AnimatedBeamDemo />
      </section>

      {/* Footer */}
      <footer className="w-full px-6 py-6 max-w-5xl mx-auto">
        <p className="text-xs text-text-disabled">
          © {new Date().getFullYear()} Within. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
