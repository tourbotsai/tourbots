export function PrivacyPolicy() {
  const sections = [
    {
      title: "Who we are",
      points: [
        "TourBots AI is a software provider focused on AI virtual tour experiences for businesses and partners.",
        "For privacy enquiries, contact privacy@tourbots.ai.",
        "This policy explains how we collect, use, and protect personal data on our website and platform.",
      ],
    },
    {
      title: "Data we collect",
      points: [
        "Account and contact data, including name, email, and business details.",
        "Service usage data, such as account activity, feature usage, and support interactions.",
        "Operational content provided by customers, including client setup information and deployment settings.",
      ],
    },
    {
      title: "How we use data",
      points: [
        "To deliver and improve platform functionality, onboarding, and support.",
        "To manage billing, account administration, and service communications.",
        "To maintain service security, prevent abuse, and meet legal obligations.",
      ],
    },
    {
      title: "Data sharing",
      points: [
        "We do not sell personal data.",
        "We share data only with vetted processors required for service delivery (for example hosting, payments, and communications).",
        "We may disclose data where legally required by applicable law or regulation.",
      ],
    },
    {
      title: "Retention and security",
      points: [
        "We retain data only for as long as needed for service delivery, legal obligations, and legitimate business operations.",
        "We apply reasonable technical and organisational controls to protect data from unauthorised access and loss.",
        "Where retention periods change, we update this policy accordingly.",
      ],
    },
    {
      title: "Your rights",
      points: [
        "Subject to applicable law, you may request access, correction, deletion, restriction, or portability of your personal data.",
        "You may also object to specific processing activities where legally permitted.",
        "Contact privacy@tourbots.ai to submit a request.",
      ],
    },
    {
      title: "Policy updates",
      points: [
        "We may update this policy from time to time to reflect operational, legal, or product changes.",
        "Material changes will be highlighted through the website or account communications where appropriate.",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
        <p className="text-sm leading-relaxed text-slate-300">
          TourBots AI is committed to handling personal data responsibly. This page summarises
          our privacy approach in clear language for customer and partner teams.
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
          This summary is provided for clarity and does not replace contractual documentation where
          separate agreements apply.
        </p>
      </div>
    </div>
  );
} 