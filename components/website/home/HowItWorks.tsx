"use client";
import { CheckCircle } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Upload Matterport tour",
      description: "Add your tour in seconds without rebuilding anything or disrupting your current setup.",
      details: "Paste the tour link, check the preview, and organise your space before configuration.",
      duration: "2 minutes",
      features: ["Matterport integration", "Quick setup", "Instant preview", "No technical bottlenecks"]
    },
    {
      step: "02", 
      title: "Train the AI on your space",
      mobileTitle: "Train the AI",
      description: "Upload information, define behaviour rules, and set up navigation points so the AI knows what to say and where to go.",
      mobileDescription: "Upload information, define behaviour rules, and set up navigation points.",
      details: "Add key tour points, pricing context, brochures, and FAQs to train the assistant quickly.",
      duration: "15-30 minutes",
      features: ["AI training on your content", "Tour navigation rules", "Brand customisation", "Reusable templates"]
    },
    {
      step: "03",
      title: "One line of code, live",
      description: "Embed once and launch an AI-guided tour with engagement tracking built in from day one.",
      details: "Go live quickly, monitor conversations, and see how visitors interact with your space.",
      duration: "Live instantly",
      features: ["Single embed code", "Tour and AI together", "Space-level analytics", "Lead capture notifications"]
    }
  ];

  return (
    <section className="container pb-8 pt-8 md:pb-10 md:pt-10 lg:pb-12 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Up and running in three steps
        </h2>
        
        <p className="hidden text-base leading-relaxed text-slate-300 md:block md:text-lg lg:whitespace-nowrap">
          No complex setup and no heavy build process. One embed line and your tour has an AI guide.
        </p>
        <p className="text-base leading-relaxed text-slate-300 md:hidden">
          No complex setup. One embed line and your tour has an AI guide.
        </p>
      </div>
      
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid lg:grid-cols-3">
          {steps.map((step, index) => {
            return (
              <div
                key={index}
                className={`h-full p-6 transition-colors duration-200 hover:bg-slate-900/62 md:p-8 ${
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

                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold leading-tight text-white">
                      <span className="hidden md:inline">{step.title}</span>
                      <span className="md:hidden">
                        {"mobileTitle" in step ? step.mobileTitle : step.title}
                      </span>
                    </h3>
                    <p className="text-base leading-relaxed text-slate-300">
                      <span className="hidden md:inline">{step.description}</span>
                      <span className="md:hidden">
                        {"mobileDescription" in step ? step.mobileDescription : step.description}
                      </span>
                    </p>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {step.details}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {step.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-success-green" />
                        <span>{feature}</span>
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