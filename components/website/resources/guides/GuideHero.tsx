"use client";

export function GuideHero() {
  return (
    <section className="container pb-2 pt-10 md:pb-3 md:pt-14 lg:pb-4 lg:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Platform Documentation
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          TourBots guides
        </h1>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg lg:whitespace-nowrap">
          Clear, practical documentation for setting up tours, configuring chatbots, and scaling your account.
        </p>
      </div>
    </section>
  );
} 