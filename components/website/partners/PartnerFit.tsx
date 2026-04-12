"use client";

export function PartnerFit() {
  const profiles = [
    {
      title: "Matterport camera suppliers",
      description:
        "Add a recurring software revenue layer alongside camera sales, training, and support services.",
    },
    {
      title: "Tour capture and scanning providers",
      description:
        "Extend your delivery model from one-off scans into retained AI-enabled client packages.",
    },
    {
      title: "Industry networks and associations",
      description:
        "Offer members a practical AI tour stack that improves outcomes and supports digital transformation.",
    },
    {
      title: "Consultants and agency partners",
      description:
        "Add a proven technical product to your existing advisory or growth services without platform build costs.",
    },
  ];

  return (
    <section className="container pb-8 pt-8 md:pb-10 md:pt-10 lg:pb-12 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-4xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Who this partner model fits best
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          If you already work with businesses using virtual tours, this is designed to slot into your existing relationships.
        </p>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/45">
        <div className="grid md:grid-cols-2">
          {profiles.map((profile, index) => {
            return (
              <article
                key={profile.title}
                className={`p-5 transition-colors duration-200 hover:bg-slate-900/55 md:p-6 ${
                  index < profiles.length - 1 ? "border-b border-white/10 md:border-b-0" : ""
                } ${
                  index % 2 === 0 ? "md:border-r md:border-white/10" : ""
                } ${
                  index < 2 ? "md:border-b md:border-white/10" : ""
                }`}
              >
                <div className="space-y-2.5 text-left">
                  <h3 className="text-lg font-semibold leading-snug text-white">{profile.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300 md:text-base">{profile.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
