"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, X } from "lucide-react";

export function PricingPlans() {
  const plans = [
    {
      name: "Free",
      description: "Try TourBots before you commit to pro.",
      priceLabel: "£0",
      subLabel: "test account",
      href: "/login",
      bullets: [
        "One test tour",
        "AI setup and training tools",
        "Up to 25 total messages",
        "No card required to start",
      ],
      disabledBullets: [
        "No live production hosting",
        "No advanced analytics",
        "No add-on purchases",
      ],
      cta: "Start Free",
      featured: false,
    },
    {
      name: "Pro",
      description: "For live tours and growing commercial use.",
      priceLabel: "£19.99",
      subLabel: "per month, first space included",
      href: "/demo",
      bullets: [
        "1 active space included",
        "1,000 chatbot messages included",
        "AI Q&A and guided navigation",
        "Lead capture and engagement tracking",
        "Dashboard analytics",
        "Standard support",
      ],
      disabledBullets: ["White-label sold as add-on"],
      cta: "Go Pro",
      featured: true,
    },
  ];

  const addOns = [
    {
      title: "Additional space",
      price: "£14.99",
      detail: "per extra space, per month",
      description: "Each additional space includes 1,000 chatbot messages per month.",
    },
    {
      title: "Message top-up block",
      price: "£9.99",
      detail: "per + 1,000 messages, per month",
      description: "Add extra 1000 message credits to your account, shared by all spaces.",
    },
    {
      title: "White-label add-on",
      price: "£19.99",
      detail: "per account, per month",
      description: "Remove TourBots branding and deliver a cleaner client-facing experience.",
    },
    {
      title: "Agency portal add-on",
      price: "£49.99",
      detail: "per account, per month",
      description:
        "Give clients secure access to tour setup, chatbot settings and analytics in your branded portal.",
    },
  ];

  return (
    <section className="container pb-8 pt-8 md:pb-10 md:pt-10 lg:pb-12 lg:pt-12">
      <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center space-y-4 text-center md:mb-10">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Start free, then scale by space
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg lg:whitespace-nowrap">
          Keep pricing straightforward: Free for testing, Pro for live use, and add-ons as your footprint grows.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`flex h-full flex-col rounded-2xl border bg-slate-900/50 p-5 shadow-[0_18px_44px_rgba(2,6,23,0.28)] md:p-6 ${
              plan.featured ? "border-brand-primary/45" : "border-slate-700/70"
            }`}
          >
            <h3 className="text-xl font-semibold text-white md:text-2xl">{plan.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">{plan.description}</p>

            <div className="mt-6">
              <div className="text-3xl font-semibold text-white md:text-4xl">
                {plan.priceLabel}
              </div>
              <p className="mt-1 text-sm text-slate-300">{plan.subLabel}</p>
            </div>

            <ul className="mt-5 space-y-1.5">
              {plan.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-slate-300 md:text-base">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-green" />
                  <span>{bullet}</span>
                </li>
              ))}
              {plan.disabledBullets?.map((disabledBullet) => (
                <li key={disabledBullet} className="flex items-start gap-2 text-sm text-slate-400 md:text-base">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                  <span>{disabledBullet}</span>
                </li>
              ))}
            </ul>

            <Link href={plan.href} className="mt-auto block pt-6">
              <Button
                size="lg"
                className={`group w-full ${
                  plan.featured
                    ? "bg-white text-slate-900 hover:bg-slate-200"
                    : "border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                }`}
                variant={plan.featured ? "default" : "outline"}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="border-b border-white/10 p-6 text-center md:p-8">
          <h3 className="text-2xl font-semibold text-white md:text-3xl">Add-ons</h3>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Expand capacity and branding control without changing your core plan.
          </p>
        </div>
        <div className="grid lg:grid-cols-4">
          {addOns.map((addOn, index) => (
            <article
              key={addOn.title}
              className={`p-6 md:p-8 ${
                index < addOns.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10" : ""
              }`}
            >
              <h4 className="text-xl font-semibold text-white">{addOn.title}</h4>
              <div className="mt-2 text-3xl font-semibold text-white">{addOn.price}</div>
              <p className="mt-1 text-sm text-slate-300">{addOn.detail}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{addOn.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
