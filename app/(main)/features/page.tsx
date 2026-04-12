import { FeaturesHero } from "@/components/website/features/FeaturesHero";
import { AgencyCoreFeatures } from "@/components/website/features/AgencyCoreFeatures";
import { AgencyDeliveryFlow } from "@/components/website/features/AgencyDeliveryFlow";
import { AgencyPlatformOverview } from "@/components/website/features/AgencyPlatformOverview";
import { CTA } from "@/components/website/home/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | TourBots AI",
  description:
    "Explore TourBots AI features built for virtual tour teams, including AI chatbot control, tour flow setup, analytics, and white-label delivery.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | TourBots AI",
    description:
      "Explore TourBots AI features built for virtual tour teams, including AI chatbot control, tour flow setup, analytics, and white-label delivery.",
    url: "/features",
    type: "website",
  },
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      <FeaturesHero />
      <AgencyCoreFeatures />
      <AgencyDeliveryFlow />
      <AgencyPlatformOverview />
      <CTA />
    </div>
  );
}