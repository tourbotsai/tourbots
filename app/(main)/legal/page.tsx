import { LegalHero } from "@/components/website/legal/LegalHero";
import { LegalContent } from "@/components/website/legal/LegalContent";
import { Suspense } from "react";
import type { Metadata } from "next";

export default function LegalPage() {
  return (
    <div className="flex flex-col">
      <LegalHero />
      <Suspense fallback={<div className="container pb-20 text-sm text-slate-400">Loading legal content...</div>}>
        <LegalContent />
      </Suspense>
    </div>
  );
} 

export const metadata: Metadata = {
  title: "Legal | TourBots AI",
  description:
    "Review TourBots AI privacy, terms, and cookie policies for agencies, partners, and commercial teams.",
  alternates: {
    canonical: "/legal",
  },
  openGraph: {
    title: "Legal | TourBots AI",
    description:
      "Legal and compliance information for TourBots AI services.",
    url: "/legal",
    type: "website",
  },
};