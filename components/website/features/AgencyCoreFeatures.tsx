"use client";

export function AgencyCoreFeatures() {
  const features = [
    {
      title: "AI trained on your real content",
      description:
        "Upload FAQs, brochures, and service details so answers stay accurate, useful, and aligned to your business.",
    },
    {
      title: "Guided navigation through key spaces",
      description:
        "When visitors ask about a specific area, the assistant can move them there in real time so nothing important gets missed.",
    },
    {
      title: "Custom branding controls",
      description:
        "Apply your own branding and tone so the assistant experience feels consistent with your existing website and offering.",
    },
    {
      title: "Engagement and trigger visibility",
      description:
        "Track conversations, visitor intent, and triggers from one portal so you can improve performance over time.",
    },
  ];

  return (
    <section className="container pb-8 pt-8 md:pb-10 md:pt-10 lg:pb-12 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Core capabilities that make tours perform
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          Everything your tour needs to answer, guide, and convert visitors in real time.
        </p>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/45">
        <div className="grid md:grid-cols-2">
          {features.map((feature, index) => {
            return (
              <div
                key={feature.title}
                className={`p-5 transition-colors duration-200 hover:bg-slate-900/55 md:p-6 ${
                  index < features.length - 1 ? "border-b border-white/10 md:border-b-0" : ""
                } ${
                  index % 2 === 0 ? "md:border-r md:border-white/10" : ""
                } ${
                  index < 2 ? "md:border-b md:border-white/10" : ""
                }`}
              >
                <div className="space-y-2.5 text-left">
                  <h3 className="text-lg font-semibold leading-snug text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300 md:text-base">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
