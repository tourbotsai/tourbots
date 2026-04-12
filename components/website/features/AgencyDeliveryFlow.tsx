"use client";
import { CheckCircle } from "lucide-react";

export function AgencyDeliveryFlow() {
  const steps = [
    {
      step: "01",
      title: "Connect your tour",
      description:
        "Add your Matterport tour, confirm the preview, and set up your space in minutes.",
      duration: "2 minutes",
      points: ["Matterport-ready setup", "Quick tour import", "No rebuild required"],
    },
    {
      step: "02",
      title: "Train and customise the AI",
      mobileTitle: "Train the AI",
      description:
        "Set AI behaviour, upload your content, and apply branding so the experience feels on-brand.",
      duration: "15-30 minutes",
      points: ["Content-based AI training", "Brand customisation", "Navigation intent mapping"],
    },
    {
      step: "03",
      title: "Go live and track results",
      description:
        "Embed once, launch quickly, and monitor engagement and triggers in one clear dashboard.",
      duration: "Go live instantly",
      points: ["Single embed rollout", "Space-level analytics", "Trigger and engagement reporting"],
    },
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          <span className="md:hidden">Live in three steps</span>
          <span className="hidden md:inline">Live in three simple steps</span>
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          Go from tour link to a live AI guide, with full control over content and behaviour.
        </p>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid lg:grid-cols-3">
          {steps.map((step, index) => {
            return (
              <div
                key={step.title}
                className={`p-6 transition-colors duration-200 hover:bg-slate-900/62 md:p-8 ${
                  index < steps.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""
                }`}
              >
                <div className="flex h-full flex-col space-y-5 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold tracking-tight text-white/55">
                      {step.step}
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                      <span>{step.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white">
                      <span className="md:hidden">
                        {"mobileTitle" in step ? step.mobileTitle : step.title}
                      </span>
                      <span className="hidden md:inline">{step.title}</span>
                    </h3>
                    <p className="text-base leading-relaxed text-slate-300">{step.description}</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {step.points.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-success-green" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
