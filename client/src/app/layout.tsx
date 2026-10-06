import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { brand } from "@/config/brand";
import "./globals.css";
import { cn } from "@/lib/utils";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: brand.name,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
  keywords: [
    "AI document workspace",
    "document knowledge base",
    "personal AI assistant",
    "document Q&A",
  ],
  authors: [{ name: brand.name }],
  creator: brand.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: brand.url,
    siteName: brand.name,
    title: brand.name,
    description: brand.description,
    images: [
      {
        url: brand.og.image,
        width: 1200,
        height: 630,
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
    images: [brand.og.image],
    creator: brand.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(bricolageGrotesque.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body
        className="bg-background text-text-primary font-sans antialiased"
        suppressHydrationWarning
      >
        {" "}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
