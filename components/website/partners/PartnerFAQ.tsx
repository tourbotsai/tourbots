"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PartnerFAQ() {
  const faqs = [
    {
      question: "How much commission do I earn?",
      answer: "Partners earn 20% commission on first-year subscription value for successful referred accounts."
    },
    {
      question: "Who makes a good partner?",
      answer: "Matterport camera suppliers, tour capture providers, industry networks, software vendors, agencies, and consultants already serving businesses with virtual tour needs."
    },
    {
      question: "How does the referral process work?",
      answer: "Make an introduction, we run the product demo and onboarding, and you receive commission when the referred account converts."
    },
    {
      question: "When do I get paid?",
      answer: "Commission payments are made within 30 days of the customer payment, typically via bank transfer."
    },
    {
      question: "What support do I get?",
      answer: "You get partner enablement support, positioning guidance, and a direct contact for partnership coordination."
    },
    {
      question: "Can suppliers partner without a delivery team?",
      answer: "Yes. Hardware and supply partners can participate through qualified introductions while TourBots handles product delivery and onboarding."
    },
    {
      question: "Are there any requirements?",
      answer: "No upfront fees or exclusivity requirements. We mainly look for strong fit and credible access to relevant buyer networks."
    }
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <Card className="flex-1 rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <CardHeader>
          <CardTitle className="text-xl text-white md:text-2xl">
            Frequently Asked Questions
          </CardTitle>
          <p className="text-sm text-slate-300">
            Quick answers about partnering with TourBots
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-slate-700/70">
                <AccordionTrigger className="text-left text-sm text-white hover:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white">Need to speak with the partnerships team?</h3>
          <p className="mt-2 text-sm text-slate-300">
            If you are unsure about fit, send us your business model and audience profile.
          </p>
          <a href="mailto:partners@tourbots.ai" className="mt-4 inline-block text-sm font-semibold text-brand-primary hover:underline">
            partners@tourbots.ai
          </a>
        </CardContent>
      </Card>
    </div>
  );
} 