export function CookiePolicy() {
  const sections = [
    {
      title: "What cookies are",
      points: [
        "Cookies are small files stored on your device by your browser.",
        "They help websites remember settings, maintain sessions, and understand usage patterns.",
      ],
    },
    {
      title: "How TourBots AI uses cookies",
      points: [
        "Essential cookies for authentication, security, and core website operation.",
        "Performance and analytics cookies to improve reliability and user experience.",
        "Optional preference cookies where applicable to remember non-essential settings.",
      ],
    },
    {
      title: "Third-party technologies",
      points: [
        "Some cookies may be set by approved service providers used for hosting, analytics, payments, or communications.",
        "Where third-party tools are used, processing is subject to supplier terms and applicable law.",
      ],
    },
    {
      title: "Your controls",
      points: [
        "You can manage cookie preferences through browser settings and any site-level controls provided.",
        "Disabling specific cookies may affect functionality, sign-in persistence, or analytics accuracy.",
      ],
    },
    {
      title: "Updates",
      points: [
        "We may update this policy when technology, legal requirements, or service design changes.",
        "For cookie or privacy enquiries, contact privacy@tourbots.ai.",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
        <p className="text-sm leading-relaxed text-slate-300">
          This page summarises how TourBots AI uses cookies and similar technologies across the
          website and platform.
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
          This summary is for transparency and does not replace technical cookie notices shown in-product.
        </p>
      </div>
    </div>
  );
} 