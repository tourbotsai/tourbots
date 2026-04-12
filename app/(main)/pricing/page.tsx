import { PricingHero } from "@/components/website/pricing/PricingHero";
import { PricingPlans } from "@/components/website/pricing/PricingPlans";
import { PricingFAQ } from "@/components/website/pricing/PricingFAQ";
import { CTA } from "@/components/website/home/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | TourBots AI",
  description:
    "Review TourBots AI pricing for virtual tour teams, with clear plans, scalable add-ons, and rollout options for agencies and operators.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | TourBots AI",
    description:
      "Review TourBots AI pricing for virtual tour teams, with clear plans, scalable add-ons, and rollout options for agencies and operators.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      <PricingHero />
      <PricingPlans />
      <PricingFAQ />
      <CTA />
    </div>
  );
}