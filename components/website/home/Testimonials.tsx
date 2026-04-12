"use client";

export function WhyTourCompaniesChooseUs() {
  const insights = [
    {
      stat: "Most",
      statLabel: "spaces are never explored fully",
      challenge: "Visitors click one area and leave before finding what makes your space valuable.",
      solution: "Guided AI navigation helps visitors discover key areas they would otherwise miss.",
    },
    {
      stat: "Fast",
      statLabel: "answers keep momentum alive",
      challenge: "When visitors cannot get quick answers, interest drops and sessions end early.",
      solution: "TourBots responds instantly using your content, keeping prospects engaged in the moment.",
    },
    {
      stat: "Agency",
      statLabel: "partners unlock extra margin",
      challenge: "For tour agencies, basic hosting alone can cap monthly account value.",
      solution: "Adding white-label AI creates a stronger recurring offer and improves client retention.",
    }
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl lg:whitespace-nowrap">
          Virtual tours work better with a guide
        </h2>
        
        <p className="text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          The tour gets attention, the AI keeps visitors engaged, answers questions, and shows them what matters.
        </p>
      </div>
      
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid lg:grid-cols-3">
        {insights.map((insight, index) => {
          return (
            <article
              key={index}
              className={`h-full p-6 transition-colors duration-200 hover:bg-slate-900/62 md:p-8 ${
                index < insights.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""
              }`}
            >
              <div className="flex h-full flex-col space-y-5 text-left">
                <div className="flex flex-col">
                  <span className="text-3xl font-semibold tracking-tight text-white">{insight.stat}</span>
                  <span className="text-xs text-slate-300">{insight.statLabel}</span>
                </div>

                <p className="text-base leading-relaxed text-slate-300">
                  {insight.challenge}
                </p>

                <div className="h-px bg-white/10" />

                <p className="text-sm leading-relaxed text-slate-300">
                  {insight.solution}
                </p>

              </div>
            </article>
          );
        })}
        </div>
      </div>
    </section>
  );
}