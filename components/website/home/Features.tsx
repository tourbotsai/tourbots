"use client";

import Link from "next/link";
import { MessageSquare, Navigation, Target } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Answers the questions your users have",
      description: "From pricing to capacity to key space details, the AI responds in seconds using your content, 24/7.",
      icon: MessageSquare,
      iconBg: "bg-brand-primary/15",
      iconColor: "text-brand-primary",
    },
    {
      title: "Takes visitors where they need to go",
      description: "When someone asks about a specific area, the AI navigates there, showing your hidden spaces.",
      icon: Navigation,
      iconBg: "bg-brand-accent/15",
      iconColor: "text-brand-accent",
    },
    {
      title: "Triggers the right actions at the right moment",
      description: "TourBots can run custom trigger behaviour naturally, without interrupting the tour experience.",
      icon: Target,
      iconBg: "bg-success-green/15",
      iconColor: "text-success-green",
    }
  ];

  return (
    <section className="container pb-16 pt-8 text-center md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-4xl flex-col items-center space-y-4 md:mb-14">
        <h2 className="text-balance text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          What a virtual tour should do, but doesn't
        </h2>
        <p className="text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          Static tours do not answer questions or guide visitors. TourBots turns passive browsing into active engagement.
        </p>
      </div>
      
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            {features.map((feature, idx) => {
              const IconComp = feature.icon;
              return (
                <div key={feature.title}>
                  <div className="grid gap-5 p-6 transition-colors duration-200 hover:bg-slate-900/62 md:grid-cols-[1fr_auto] md:items-start md:p-8">
                    <div className="space-y-2 text-left">
                      <p className="text-xs font-medium tracking-[0.14em] text-slate-400">
                        {String(idx + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-2xl font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="max-w-5xl text-base leading-relaxed text-slate-300">
                        {feature.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-start md:justify-end">
                      <div className={`${feature.iconBg} rounded-xl border border-white/10 p-3`}>
                        <IconComp className={`${feature.iconColor} h-5 w-5`} />
                      </div>
                    </div>
                  </div>

                  {idx < features.length - 1 && <div className="h-px bg-white/10" />}
                </div>
              );
            })}
          </div>
          <div className="px-2 pt-4 text-center md:px-3">
            <Link
              href="/features"
              className="inline-flex items-center text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white"
            >
              Explore all features
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}