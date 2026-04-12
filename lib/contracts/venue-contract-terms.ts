export interface ContractData {
  venueName: string;
  venueAddress: string;
  ownerName: string;
  ownerEmail: string;
  planName: 'essential' | 'professional';
  monthlyPrice: number;
  billingCycle: 'monthly' | 'yearly';
  trialPeriodDays?: number;
  date: string;
}

export function getContractContent(data: ContractData) {
  const planDisplayName = data.planName === 'professional'
    ? 'All-in-One Plan'
    : 'AI Essentials Plan';

  const yearlyPrice = data.monthlyPrice * 12 * 0.85;
  const priceDisplay = data.billingCycle === 'monthly'
    ? `£${data.monthlyPrice.toFixed(2)}/month`
    : `£${yearlyPrice.toFixed(2)}/year (£${(yearlyPrice / 12).toFixed(2)}/month equivalent)`;

  return {
    title: 'SERVICE AGREEMENT',
    parties: {
      provider: 'TourBots AI Ltd',
      providerAddress: 'Registered Company',
      client: data.venueName,
      clientAddress: data.venueAddress,
    },
    sections: [
      {
        title: '1. PARTIES & EFFECTIVE DATE',
        content: [
          `This Service Agreement ("Agreement") is entered into on ${data.date}.`,
          ``,
          `BETWEEN: TourBots AI Ltd ("Service Provider")`,
          `AND: ${data.venueName} ("Client")`,
          ``,
          `Client Contact: ${data.ownerName}`,
          `Email: ${data.ownerEmail}`,
          `Address: ${data.venueAddress}`,
        ]
      },
      {
        title: '2. SERVICES PROVIDED',
        content: [
          `Service Provider agrees to provide the following services under the ${planDisplayName}:`,
          ``,
          `• Virtual tour creation, hosting, and management`,
          `• AI-powered chatbot integration`,
          `• Lead capture and management system`,
          `• Website embedding capabilities`,
          `• Customer support and platform access`,
          ...(data.planName === 'professional' ? [
            `• Advanced analytics and reporting`,
            `• Priority support`,
            `• Custom branding options`,
          ] : []),
        ]
      },
      {
        title: '3. PAYMENT TERMS',
        content: [
          `Subscription Fee: ${priceDisplay}`,
          `Billing Cycle: ${data.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
          `Payment Method: Automated billing via Stripe`,
          ``,
          ...(data.trialPeriodDays ? [
            `Trial Period: ${data.trialPeriodDays} days free trial`,
            `First charge will occur after trial period ends`,
            ``,
          ] : []),
          `Payments are non-refundable except as required by law.`,
          `Subscription automatically renews unless cancelled with 30 days notice.`,
        ]
      },
      {
        title: '4. TOUR RECORDING & RE-RECORDING POLICY',
        content: [
          `Initial Tour Recording:`,
          `• First virtual tour recording included with subscription`,
          `• Professional filming and 360° capture of venue facilities`,
          ``,
          `Free Re-Recording Allowance:`,
          `• 1 additional re-recording within first 12 months (FREE)`,
          `• 2 re-recordings per calendar year thereafter (FREE)`,
          `• Re-recordings cover equipment changes, facility updates, or renovations`,
          ``,
          `Additional Re-Recordings:`,
          `• Beyond the free allowance: £250 per additional tour`,
          `• Includes travel, filming, processing, and platform updates`,
          `• Subject to availability and scheduling`,
        ]
      },
      {
        title: '5. TERM & TERMINATION',
        content: [
          `This Agreement begins on ${data.date} and continues on a ${data.billingCycle} basis until terminated.`,
          ``,
          `Either party may terminate with 30 days written notice.`,
          `Upon termination:`,
          `• Access to platform will cease at end of billing period`,
          `• Client data will be retained for 30 days then deleted`,
          `• No refunds for partial periods`,
        ]
      },
      {
        title: '6. INTELLECTUAL PROPERTY',
        content: [
          `Service Provider retains all rights to the platform, software, and AI technology.`,
          `Client retains ownership of their venue branding, content, and tour footage.`,
          `Client grants Service Provider licence to use footage within the platform.`,
        ]
      },
      {
        title: '7. DATA PROTECTION & PRIVACY',
        content: [
          `Both parties will comply with UK GDPR and Data Protection Act 2018.`,
          `Service Provider will process lead data only as per Client instructions.`,
          `See Privacy Policy at tourbots.ai/legal for full details.`,
        ]
      },
      {
        title: '8. WARRANTIES & LIMITATIONS',
        content: [
          `Service provided "as is" with 99% uptime target (excluding scheduled maintenance).`,
          ``,
          `Service Provider is NOT liable for:`,
          `• Indirect, consequential, or incidental damages`,
          `• Loss of profits, revenue, or business opportunities`,
          `• Third-party service interruptions (hosting, payment processors)`,
          ``,
          `Maximum liability limited to 3 months of subscription fees.`,
        ]
      },
      {
        title: '9. ACCEPTABLE USE',
        content: [
          `Client agrees to:`,
          `• Use services only for lawful venue business purposes`,
          `• Not violate any applicable laws or regulations`,
          `• Not attempt to reverse engineer or compromise platform security`,
          `• Maintain confidentiality of account credentials`,
        ]
      },
      {
        title: '10. GOVERNING LAW',
        content: [
          `This Agreement is governed by the laws of England and Wales.`,
          `Any disputes subject to exclusive jurisdiction of English courts.`,
        ]
      },
    ],
    footer: [
      ``,
      `By accepting this agreement, both parties agree to be bound by these terms.`,
      ``,
      `For questions or concerns, contact: support@tourbots.ai`,
    ],
  };
}
