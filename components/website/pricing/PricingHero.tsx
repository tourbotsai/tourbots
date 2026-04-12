"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Rocket } from "lucide-react";

export function PricingHero() {
  return (
    <section className="container pb-8 pt-10 md:pb-10 md:pt-14 lg:pb-12 lg:pt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center">
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          <span className="sm:hidden">Simple pricing</span>
          <span className="hidden sm:inline">Simple, affordable pricing</span>
        </h1>

        <p className="max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg">
          <span className="block sm:hidden">
            Start completely free, move to Pro for your first live space, add spaces as you grow.
          </span>
          <span className="hidden sm:block lg:whitespace-nowrap">
            Start completely free, move to Pro for your first live space, then add more spaces as you grow.
          </span>
          <span className="mt-2 hidden sm:block">
            Add-ons such as extra spaces, message, white-label, and agency portal are available.
          </span>
        </p>

        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/login" className="w-full">
            <Button
              size="lg"
              className="group h-11 w-full border border-brand-primary/30 bg-white px-4 text-slate-900 transition-colors duration-200 hover:border-brand-primary/45 hover:bg-slate-200 sm:min-w-[190px] sm:px-8"
            >
              <Rocket className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Start Free
            </Button>
          </Link>
          <Link href="/demo" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="group h-11 w-full border-white/40 bg-white/[0.03] px-4 text-white transition-colors duration-200 hover:bg-white/10 hover:text-white sm:min-w-[190px] sm:px-8"
            >
              <Calendar className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5" />
              Book a Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
