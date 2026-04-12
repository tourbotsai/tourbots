import { GuideHero } from "@/components/website/resources/guides/GuideHero";
import { GuideGrid } from "@/components/website/resources/guides/GuideGrid";
import type { Metadata } from "next";

export default function GuidesPage() {
  return (
    <div className="min-h-screen">
      <GuideHero />
      <GuideGrid />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Guides | TourBots AI Documentation',
  description: 'Platform documentation and implementation guides for TourBots setup, operations, and scaling.',
  alternates: {
    canonical: "/resources/guides",
  },
  openGraph: {
    title: 'TourBots Guides and Documentation',
    description: 'Practical platform documentation for setup, operations, and scaling.',
    url: "/resources/guides",
    type: 'website',
  },
}; 