"use client";

export function PartnerCommercialModel() {
  const points = [
    {
      title: "Simple commission terms",
      description:
        "Earn 10% commission on first-year subscription value for successful referred accounts.",
    },
    {
      title: "Recurring revenue alignment",
      description:
        "Your referrals get a practical AI tour product, and you add an ongoing revenue stream around your existing offer.",
    },
    {
      title: "Low operational overhead",
      description:
        "We handle platform delivery and support operations so your team can focus on introductions and relationships.",
    },
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Partnership model built for long-term value
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
          A practical commercial structure for partners across the VR tour ecosystem.
        </p>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid lg:grid-cols-3">
          {points.map((point, index) => {
            return (
              <article
                key={point.title}
                className={`p-6 transition-colors duration-200 hover:bg-slate-900/62 md:p-8 ${
                  index < points.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""
                }`}
              >
                <div className="space-y-3 text-left">
                  <h3 className="text-xl font-semibold text-white lg:whitespace-nowrap">{point.title}</h3>
                  <p className="text-base leading-relaxed text-slate-300">{point.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
