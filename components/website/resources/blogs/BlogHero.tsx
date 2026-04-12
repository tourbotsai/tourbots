"use client";

export function BlogHero() {
  return (
    <section className="container pb-8 pt-10 md:pb-10 md:pt-14 lg:pb-12 lg:pt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center">
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Insights for AI & Virtual Tours
        </h1>

        <p className="max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg lg:whitespace-nowrap">
          Practical articles on setup, engagement, conversion, and growth for teams running virtual tours.
        </p>
      </div>
    </section>
  );
}