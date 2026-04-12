export function TermsOfService() {
  const sections = [
    {
      title: "Scope",
      points: [
        "These terms govern use of the TourBots AI website and platform services.",
        "By using the service, you agree to these terms and any applicable order or subscription terms.",
      ],
    },
    {
      title: "Service description",
      points: [
        "TourBots AI provides software, hosting, and related tools for AI virtual tour deployment.",
        "Service features, limits, and inclusions depend on your selected plan.",
        "We may improve or modify non-essential features to maintain platform quality and security.",
      ],
    },
    {
      title: "Customer responsibilities",
      points: [
        "Provide accurate business and account information.",
        "Use the platform lawfully and in line with applicable regulation.",
        "Maintain the security of user credentials and account access.",
      ],
    },
    {
      title: "Fees and billing",
      points: [
        "Subscription and add-on fees are charged according to your selected commercial plan.",
        "Unless stated otherwise, fees are billed in advance and exclude applicable taxes.",
        "Unpaid balances may lead to temporary restriction or suspension of service access.",
      ],
    },
    {
      title: "Intellectual property",
      points: [
        "TourBots AI retains ownership of platform software, documentation, and related intellectual property.",
        "Customers retain ownership of their content and grant TourBots AI a limited licence to process and host it for service delivery.",
      ],
    },
    {
      title: "Termination",
      points: [
        "Either party may end service in line with agreed notice terms.",
        "Upon termination, access is withdrawn and data handling follows applicable retention obligations.",
      ],
    },
    {
      title: "Liability and legal basis",
      points: [
        "To the extent permitted by law, liability is limited in accordance with contractual terms.",
        "These terms are governed by the laws of England and Wales unless otherwise agreed in writing.",
      ],
    },
    {
      title: "Contact",
      points: [
        "For legal enquiries, contact legal@tourbots.ai.",
        "For service support, contact support@tourbots.ai.",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
        <p className="text-sm leading-relaxed text-slate-300">
          These terms are provided as a clear operational summary for B2B customers and partners.
          Detailed contractual terms may also be set out in your order documents.
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5"
        >
          <h3 className="mb-3 text-lg font-semibold text-white">{section.title}</h3>
          <ul className="space-y-2">
            {section.points.map((point) => (
              <li key={point} className="text-sm leading-relaxed text-slate-300">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
        <p className="text-xs text-slate-400">
          Nothing on this page limits rights that cannot be lawfully excluded.
        </p>
      </div>
    </div>
  );
} 