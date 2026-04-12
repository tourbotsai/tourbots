import { PartnersHero } from "@/components/website/partners/PartnersHero";
import { PartnerFit } from "@/components/website/partners/PartnerFit";
import { PartnerCommercialModel } from "@/components/website/partners/PartnerCommercialModel";
import { PartnerApplySection } from "@/components/website/partners/PartnerApplySection";
import { CTA } from "@/components/website/home/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners | TourBots AI",
  description:
    "Partner with TourBots AI to add a white-label AI layer to virtual tours and build recurring revenue across your managed portfolio.",
  alternates: {
    canonical: "/partners",
  },
  openGraph: {
    title: "Partners | TourBots AI",
    description:
      "Partner with TourBots AI to add a white-label AI layer to virtual tours and build recurring revenue across your managed portfolio.",
    url: "/partners",
    type: "website",
  },
};

export default function PartnersPage() {
  return (
    <div className="flex flex-col">
      <PartnersHero />
      <PartnerFit />
      <PartnerCommercialModel />
      <PartnerApplySection />
      <CTA />
    </div>
  );
} 