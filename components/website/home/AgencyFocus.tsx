"use client";

export function AgencyFocus() {
  const points = [
    {
      title: "Turn hosting into a retainer",
      description: "Layer AI onto each tour and increase monthly account value without additional complexity.",
      mobileDescription: "Layer AI onto each tour and increase monthly account value easily.",
    },
    {
      title: "One dashboard, every client",
      description: "Manage all deployments, customisations, and performance in one account-level workspace.",
      mobileDescription: "Manage all deployments, customisations, and performance in one workspace.",
    },
    {
      title: "Your brand, not ours",
      description: "Embed a white-label portal so clients see your product experience and your commercial offer.",
      mobileDescription: "Embed a white-label portal so clients see your product experience.",
    },
  ];

  return (
    <section className="container pb-8 pt-4 md:pb-10 md:pt-6 lg:pb-12 lg:pt-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="border-b border-white/10 p-6 text-center md:p-8">
          <h2 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
            <span className="md:hidden">Already host tours? Earn recurring revenue</span>
            <span className="hidden md:inline">Already delivering tours? Add a recurring AI revenue line</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
            <span className="md:hidden">
              Tour companies use TourBots to add a white-label AI layer to tours they manage, earning a recurring monthly revenue.
            </span>
            <span className="hidden md:inline">
              Tour companies use TourBots to add a white-label AI layer to tours they manage,
              creating a stronger monthly offer without adding overhead.
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-3">
          {points.map((point, index) => {
            return (
              <div
                key={point.title}
                className={`p-6 md:p-8 ${
                  index < points.length - 1 ? "border-b border-white/10 md:border-b-0 md:border-r" : ""
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  <span className="md:hidden">{point.mobileDescription}</span>
                  <span className="hidden md:inline">{point.description}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
