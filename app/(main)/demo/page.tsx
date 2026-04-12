import { DemoHero } from "@/components/website/demo/DemoHero";
import { DemoBookingAndShowcase } from "@/components/website/demo/DemoBookingAndShowcase";
import { DemoFAQ } from "@/components/website/demo/DemoFAQ";
import type { Metadata } from "next";

export default function DemoPage() {
  return (
    <div className="flex flex-col">
      <DemoHero />
      <DemoBookingAndShowcase />
      <DemoFAQ />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Book Demo | TourBots AI",
  description:
    "Book a personalised TourBots AI demo to review setup, rollout, and growth planning for your virtual tour experience.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Book Demo | TourBots AI",
    description:
      "See how TourBots AI helps teams deploy and scale AI virtual tour experiences.",
    url: "/demo",
    type: "website",
  },
};