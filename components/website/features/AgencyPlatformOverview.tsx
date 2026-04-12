"use client";

import Image from "next/image";
import { CheckCircle } from "lucide-react";

export function AgencyPlatformOverview() {
  const highlights = [
    "Train your AI assistant with your own content",
    "Customise behaviour, tone, and branding",
    "Review chat history and messages",
    "Track analytics, engagement, and triggers",
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Train, customise, and track everything in one platform
            </h2>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              Configure your AI assistant, see full conversation history, and use
              analytics to keep improving tour performance over time.
            </p>

            <div className="space-y-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300 md:text-base">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-green" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/65">
            <div className="border-b border-white/10 bg-slate-800/60 px-4 py-2 text-xs text-slate-300">
              tourbots.ai/app/analytics
            </div>
            <Image
              src="/tourbots/screenshots/Analytics.png"
              alt="TourBots analytics dashboard preview"
              width={1200}
              height={900}
              className="h-auto w-full object-cover object-top"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
