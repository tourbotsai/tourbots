import { BlogHero } from "@/components/website/resources/blogs/BlogHero";
import { BlogGrid } from "@/components/website/resources/blogs/BlogGrid";
import type { Metadata } from "next";

export default function BlogsPage() {
  return (
    <div className="min-h-screen">
      <BlogHero />
      <BlogGrid />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Blog | TourBots AI - AI Virtual Tour Insights',
  description: 'Practical insights on AI virtual tours, partner growth, and commercial delivery for agencies and industry providers.',
  alternates: {
    canonical: "/resources/blogs",
  },
  openGraph: {
    title: 'Blog | TourBots AI',
    description: 'Latest insights on AI virtual tours, partner ecosystems, and platform strategy',
    url: "/resources/blogs",
    type: 'website',
  },
}; 