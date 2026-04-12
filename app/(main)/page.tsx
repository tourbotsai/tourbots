import { Hero } from "@/components/website/home/Hero";
import { AgencyFocus } from "@/components/website/home/AgencyFocus";
import { Features } from "@/components/website/home/Features";
import { PlatformShowcaseContainer } from "@/components/website/home/PlatformShowcaseContainer";
import { WhyTourCompaniesChooseUs } from "@/components/website/home/Testimonials";
import { HowItWorks } from "@/components/website/home/HowItWorks";
import { CTA } from "@/components/website/home/CTA";
import { ComingSoon } from "@/components/website/home/ComingSoon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const isComingSoonEnabled = process.env.COMING_SOON?.toLowerCase() === "true";

  if (isComingSoonEnabled) {
    return <ComingSoon />;
  }

  return (
    <div className="flex flex-col">
      <Hero />
      <HowItWorks />
      <Features />
      <PlatformShowcaseContainer />
      <AgencyFocus />
      <WhyTourCompaniesChooseUs />
      <CTA />
    </div>
  );
}
