import { ContactHero } from "@/components/website/contact/ContactHero";
import { ContactEnquirySection } from "@/components/website/contact/ContactEnquirySection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | TourBots AI",
  description:
    "Contact the TourBots AI team to discuss rollout, onboarding, technical questions, and support for your virtual tour deployment.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | TourBots AI",
    description:
      "Contact the TourBots AI team to discuss rollout, onboarding, technical questions, and support for your virtual tour deployment.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <ContactHero />
      <ContactEnquirySection />
    </div>
  );
}