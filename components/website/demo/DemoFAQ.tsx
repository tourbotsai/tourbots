"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DemoFAQ() {
  const faqs = [
    {
      question: "Who is this demo designed for?",
      answer: "The demo is designed for anyone with a virtual tour, plus agencies, suppliers, and consultants who support multiple client tours."
    },
    {
      question: "How long is the demo?",
      answer: "Most sessions are around 20 minutes, with extra time available for Q&A if needed."
    },
    {
      question: "Do I need an existing tour?",
      answer: "No. We can work with your current assets if you have them, or help you shape the right capture and onboarding process if you do not."
    },
    {
      question: "Will we discuss pricing and margins?",
      answer: "Yes. We cover plan fit, likely operating costs, and how additional spaces and white-label can be priced."
    },
    {
      question: "Can multiple team members join?",
      answer: "Absolutely. We recommend bringing both commercial and delivery stakeholders so rollout decisions can be made faster."
    },
    {
      question: "What happens after the call?",
      answer: "You receive a clear follow-up with recommended next steps. If there is fit, we agree a practical activation plan."
    }
  ];

  return (
    <section className="container pb-16 md:pb-20 lg:pb-24">
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center space-y-5 text-center">
        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
          Demo FAQ
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Straight answers on format, fit, and what to expect from the session.
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <CardHeader>
            <CardTitle className="text-xl text-white md:text-2xl">
              Frequently asked questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-slate-700/70">
                  <AccordionTrigger className="text-left text-sm text-white hover:text-white md:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-slate-300 md:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}