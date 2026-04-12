"use client";

import { useState } from "react";
import { Eye, MessageCircle, Target, BarChart3, CheckCircle } from "lucide-react";
import Image from "next/image";

export function PlatformShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: "tours",
      title: "Tour Management",
      mobileTitle: "Tour",
      description: "Manage all your spaces from one place and launch AI-guided experiences without rebuilding your tour stack.",
      image: "/tourbots/screenshots/Tours.png",
      icon: Eye,
      iconBg: "bg-brand-blue/15",
      iconColor: "text-brand-blue",
      stats: "Easy deployment",
      highlight: "Keep setup simple while scaling from one space to many",
      benefits: [
        "Matterport-ready workflow",
        "Space-level rollout",
        "Mobile-optimised experience",
        "Low-friction website integration"
      ]
    },
    {
      id: "ai",
      title: "AI Configuration",
      mobileTitle: "AI",
      description: "Configure assistants that answer instantly, guide visitors through the tour, and reflect your preferred tone.",
      image: "/tourbots/screenshots/AI.png",
      icon: MessageCircle,
      iconBg: "bg-ai-pink/15",
      iconColor: "text-ai-pink",
      stats: "Configured your way",
      highlight: "Train once on your content and keep answers consistent",
      benefits: [
        "AI training on your documents",
        "Business context integration",
        "Navigation-aware responses", 
        "Custom trigger automation"
      ]
    },
    {
      id: "engagement",
      title: "Triggers",
      description: "Keep visitors engaged with guided conversation and trigger the right actions at the right moment.",
      image: "/tourbots/screenshots/Triggers.png",
      icon: Target,
      iconBg: "bg-success-green/15",
      iconColor: "text-success-green",
      stats: "Increased engagement",
      highlight: "Turn passive browsing into guided, measurable visitor activity",
      benefits: [
        "Create custom triggers",
        "Define trigger responses",
        "Configure action outputs",
        "Run trigger-based behaviour"
      ]
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Track performance with clear reporting on visitor engagement, conversation quality, and trigger outcomes.",
      image: "/tourbots/screenshots/Analytics.png",
      icon: BarChart3,
      iconBg: "bg-warning-orange/15",
      iconColor: "text-warning-orange",
      stats: "Space insights",
      highlight: "Understand what is working and where to improve next",
      benefits: [
        "Per-space engagement metrics",
        "Trigger and conversion tracking",
        "Cross-space comparison views",
        "Clear reporting dashboard"
      ]
    }
  ];

  const activeFeature = features[activeTab];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 grid grid-cols-2 gap-2 md:mb-10 md:grid-cols-4">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          const isActive = activeTab === index;
          
          return (
            <button
              key={feature.id}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors duration-200 md:px-4 ${
                isActive
                  ? "border-slate-500/70 bg-slate-900/70 text-white"
                  : "border-slate-700/70 bg-slate-900/40 text-slate-300 hover:border-slate-600/70 hover:bg-slate-900/55 hover:text-white"
              }`}
            >
              <div className={`${feature.iconBg} rounded-lg p-1.5`}>
                <IconComponent className={`${feature.iconColor} h-4 w-4`} />
              </div>
              <span className="text-sm font-medium leading-tight">
                <span className="hidden md:inline">{feature.title}</span>
                <span className="md:hidden">
                  {"mobileTitle" in feature ? feature.mobileTitle : feature.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 shadow-[0_18px_44px_rgba(2,6,23,0.28)] md:p-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-600/60 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 md:inline-flex">
              <span className="h-2 w-2 rounded-full bg-success-green" />
              <span>{activeFeature.stats}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white md:text-3xl">
              {activeFeature.title}
            </h3>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              {activeFeature.description}
            </p>
          </div>

          <div className="space-y-2">
            {activeFeature.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-300 md:text-base">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-success-green" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/65">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-800/55 px-3 py-2 text-xs text-slate-300 md:px-4">
            <span>tourbots.ai/app/{activeFeature.id}</span>
          </div>
          <Image
            src={activeFeature.image}
            alt={`${activeFeature.title} screenshot`}
            width={1200}
            height={900}
            className="h-auto w-full object-cover object-top"
            priority
          />
        </div>
      </div>
    </div>
  );
} 