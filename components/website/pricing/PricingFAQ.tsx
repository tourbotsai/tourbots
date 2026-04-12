"use client";

export function PricingFAQ() {
  const faqs = [
    {
      question: "What does Free include?",
      answer:
        "Free includes one test tour, setup access, and up to 25 messages so you can validate everything before launch.",
    },
    {
      question: "What does Pro include?",
      answer:
        "Pro includes one active space, 1,000 chatbot messages each month, AI guidance, custom triggers, and analytics.",
    },
    {
      question: "How much are extra spaces?",
      answer:
        "Each additional active space is £14.99 per month and includes another 1,000 chatbot messages.",
    },
    {
      question: "Can I add message top-ups?",
      answer:
        "Yes. Add a 1,000-message top-up block for £9.99 per month whenever your account needs extra volume.",
    },
    {
      question: "Is white-label available?",
      answer:
        "Yes. White-label is a £19.99 per month add-on that removes TourBots branding from the client experience.",
    },
    {
      question: "What is the Agency portal?",
      answer:
        "It allows you to provide clients secure branded portal access to manage their tour, chatbot, and analytics.",
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

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="grid md:grid-cols-2 lg:grid-cols-3">
          {faqs.map((faq, index) => (
            <article
              key={faq.question}
              className={`p-6 md:p-8 ${
                index < faqs.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
