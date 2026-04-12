"use client";

import { PlatformShowcase } from "./PlatformShowcase";

export function PlatformShowcaseContainer() {
  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center space-y-4 text-center md:mb-12">
        <h2 className="text-balance text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl lg:whitespace-nowrap">
          One platform to train, customise, and scale
        </h2>
        
        <p className="max-w-4xl text-base leading-relaxed text-slate-300 md:text-lg">
          Add your spaces, train the AI, apply customisations, and track performance.
        </p>
      </div>

      {/* Platform Showcase */}
      <PlatformShowcase />
    </section>
  );
} 