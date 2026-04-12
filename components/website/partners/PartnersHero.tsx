"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, UserPlus } from "lucide-react";

export function PartnersHero() {
  const scrollToForm = () => {
    const formElement = document.querySelector('[data-partner-form]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="container pb-8 pt-10 md:pb-10 md:pt-14 lg:pb-12 lg:pt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center">
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Partner with TourBots
        </h1>

        <p className="max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Built for businesses already serving the VR tour ecosystem, from tour capture specialists,
          camera and equipment suppliers or anyone in the industry.
        </p>

        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="group h-11 w-full border border-brand-primary/30 bg-white px-4 text-slate-900 transition-colors duration-200 hover:border-brand-primary/45 hover:bg-slate-200 sm:min-w-[190px] sm:w-auto sm:px-8"
          >
            <UserPlus className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            Apply as Partner
          </Button>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="group h-11 w-full border-white/40 bg-white/[0.03] px-4 text-white transition-colors duration-200 hover:bg-white/10 hover:text-white sm:min-w-[190px] sm:w-auto sm:px-8"
            >
              <Calendar className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5" />
              Book a Call
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
