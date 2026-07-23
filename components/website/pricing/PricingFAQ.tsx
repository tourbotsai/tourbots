"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PricingFAQ() {
  const faqs = [
    {
      question: "What does Free include?",
      answer:
        "Free includes one bot to test, setup tools, and up to 25 messages so you can try a tour or website chatbot before going live.",
    },
    {
      question: "What does Pro include?",
      answer:
        "Pro includes one bot, 1,000 chatbot messages per month, AI Q&A, optional tour navigation, website embed, lead capture, and analytics.",
    },
    {
      question: "How much are extra bots?",
      answer:
        "Pro: £14.99 per month per bot (includes another 1,000 messages). Agency: £9.99 per month. Each extra bot is another tour or website chatbot.",
    },
    {
      question: "Can I put the chatbot on my website?",
      answer:
        "Yes. Bots can be embedded on a tour with navigation on or off, or used as website-only chat embeds with no Matterport required.",
    },
    {
      question: "Can I add message top-ups?",
      answer:
        "Yes. Add a 1,000-message top-up block for £9.99 per month whenever your account needs extra volume.",
    },
    {
      question: "Is white-label available?",
      answer:
        "Yes. White-label is a £19.99 per month add-on that removes TourBots branding from the client experience. It is included on the Agency plan.",
    },
    {
      question: "What is the Agency plan?",
      answer:
        "Three bots, branded client portals, and white-label. Give each client a tour portal or a website-only chatbot portal.",
    },
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center space-y-4 text-center md:mb-14">
        <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
          Pricing FAQ
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
          Quick answers on plans, add-ons, and how pricing scales.
        </p>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/50 p-2 shadow-[0_18px_44px_rgba(2,6,23,0.28)] sm:p-3">
        <Accordion type="single" collapsible defaultValue="pricing-faq-0" className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`pricing-faq-${index}`}
              className="border-slate-700/70 px-4 first:rounded-t-xl last:rounded-b-xl hover:bg-white/[0.03] sm:px-5"
            >
              <AccordionTrigger className="py-5 text-base font-semibold text-white no-underline hover:text-brand-primary hover:no-underline md:text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-3xl pb-5 text-sm leading-relaxed text-slate-300 md:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
