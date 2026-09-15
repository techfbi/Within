/*
  Single source of truth for all brand strings.
  Working name: Within
  When the final product name is chosen, we change this file only.
  Every title tag, OG tag, meta description, sitemap entry, and manifest entry pulls from here nothing else is hardcoded.
*/
export const brand = {
  name: "Within",
  tagline: "Your documents. Your knowledge. Yours alone.",
  description:
    "Within is a personal AI document workspace. Upload your documents, build a private knowledge base, and get grounded answers from your own sources.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://within.app",
  twitter: "@withinapp",
  og: {
    image: "/og-image.png",
  },
} as const;