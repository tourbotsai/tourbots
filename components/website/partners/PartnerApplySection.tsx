"use client";

import { PartnerBooking } from "./PartnerBooking";
import { PartnerFAQ } from "./PartnerFAQ";

export function PartnerApplySection() {
  return (
    <section className="container pb-16 pt-2 md:pb-20 md:pt-4 lg:pb-24 lg:pt-6" data-partner-form>
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center space-y-3 text-center md:mb-12">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Apply to become a TourBots partner
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          Tell us about your business and network. We will review fit quickly and share clear next steps.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl items-stretch gap-6 lg:grid-cols-2">
        <PartnerBooking />
        <PartnerFAQ />
      </div>
    </section>
  );
}
