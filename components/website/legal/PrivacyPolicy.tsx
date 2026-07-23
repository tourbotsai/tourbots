import {
  LegalExternalLink,
  LegalInfoGrid,
  LegalInternalLink,
  LegalIntro,
  LegalList,
  LegalMailLink,
  LegalP,
  LegalSection,
} from "./LegalDocumentParts";

export function PrivacyPolicy() {
  return (
    <div className="space-y-5">
      <LegalIntro>
        <LegalP>
          How TourBots AI Ltd collects, uses, and protects personal data.
        </LegalP>
        <LegalP>
          TourBots AI Ltd, 10-12 Mulberry Green, Harlow, England, CM17 0ET
        </LegalP>
      </LegalIntro>

      <LegalSection number={1} title="Introduction">
        <LegalP>
          TourBots AI Ltd (&quot;TourBots&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to
          protecting the privacy of our Customers, their Visitors, and website users. This Privacy
          Policy explains what personal data we collect, why we collect it, how we use it, and the
          rights available to you under UK data protection law, including the UK General Data
          Protection Regulation (&quot;UK GDPR&quot;) and the Data Protection Act 2018.
        </LegalP>
        <LegalP>
          This Policy applies to tourbots.ai, the TourBots platform, and any embedded chatbot or
          tour widgets provided as part of the Service.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="Who We Are">
        <LegalP>
          TourBots AI Ltd is the data controller for personal data collected via our website,
          marketing activities, and Customer Account management. Where we process personal data on
          behalf of a Customer within their tours or chatbots (such as Visitor conversation data),
          we act as a data processor on that Customer&apos;s behalf, and our Data Processing
          Agreement applies.
        </LegalP>
        <LegalInfoGrid
          rows={[
            { label: "Company", value: "TourBots AI Ltd" },
            {
              label: "Registered Address",
              value: "10-12 Mulberry Green, Harlow, England, CM17 0ET",
            },
            {
              label: "Contact Email",
              value: <LegalMailLink email="legal@tourbots.ai" />,
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={3} title="What Data We Collect">
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 font-semibold text-slate-100">Account and Customer Data</h4>
            <LegalP>
              When you create an Account, we collect your name, email address, company name, billing
              details, and any information you provide in configuring your bots and chatbots.
            </LegalP>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-slate-100">Payment Data</h4>
            <LegalP>
              Payment card details are collected and processed directly by our payment processor,
              Stripe. We do not store full payment card details on our own systems.
            </LegalP>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-slate-100">Visitor Conversation Data</h4>
            <LegalP>
              When a Visitor interacts with a Customer&apos;s chatbot, we process the content of
              that conversation, including any information the Visitor chooses to provide, in order
              to generate AI responses and, where enabled, to support lead capture on behalf of the
              Customer.
            </LegalP>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-slate-100">Usage and Analytics Data</h4>
            <LegalP>
              We collect technical data such as IP address, device type, browser type, referring
              domain, and interaction data (tour views, conversation counts, navigation events) to
              operate and improve the Service and to provide Customers with analytics.
            </LegalP>
          </div>
        </div>
      </LegalSection>

      <LegalSection number={4} title="How We Use Your Data">
        <LegalP>We process personal data on the following legal bases:</LegalP>
        <LegalList
          items={[
            <>
              <span className="font-medium text-slate-200">Performance of a contract</span> — to
              provide, maintain, and support your Account and the Service
            </>,
            <>
              <span className="font-medium text-slate-200">Legitimate interests</span> — to improve
              the Service, prevent fraud, and communicate with Customers about their Account
            </>,
            <>
              <span className="font-medium text-slate-200">Consent</span> — where required, for
              certain cookies and marketing communications
            </>,
            <>
              <span className="font-medium text-slate-200">Legal obligation</span> — where we are
              required to retain or disclose data by law
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection number={5} title="AI Processing">
        <LegalP>
          TourBots uses OpenAI&apos;s models to generate chatbot responses. Conversation content
          and relevant Customer-uploaded knowledge base content is sent to OpenAI&apos;s API for
          the purpose of generating a response. This data is processed under OpenAI&apos;s API data
          usage policies, under which API data is not used to train OpenAI&apos;s models. Customers
          should ensure Visitors are made aware, where appropriate, that they are interacting with
          an AI-powered assistant.
        </LegalP>
      </LegalSection>

      <LegalSection number={6} title="Sharing Your Data">
        <LegalP>
          We share personal data with third-party service providers (our sub-processors) solely as
          necessary to operate the Service. A current list of our sub-processors is available on
          request.
        </LegalP>
        <LegalP>
          We do not sell personal data to third parties. We may disclose data where required by law,
          to protect our legal rights, or in connection with a merger, acquisition, or sale of
          business assets, subject to appropriate safeguards.
        </LegalP>
      </LegalSection>

      <LegalSection number={7} title="International Data Transfers">
        <LegalP>
          Some of our sub-processors are based outside the UK, including in the United States. Where
          personal data is transferred outside the UK, we ensure appropriate safeguards are in
          place, such as the UK International Data Transfer Agreement (IDTA), the EU Standard
          Contractual Clauses with the UK Addendum, or reliance on an approved adequacy mechanism,
          as applicable to each provider.
        </LegalP>
      </LegalSection>

      <LegalSection number={8} title="Data Retention">
        <LegalP>
          We retain personal data for as long as necessary to provide the Service and for a
          reasonable period thereafter to comply with legal obligations, resolve disputes, and
          enforce our agreements. Account data is generally retained for the duration of an active
          Account plus a reasonable period following closure. Visitor conversation data is retained
          in accordance with the Customer&apos;s configuration and our standard retention schedule,
          details of which are available on request.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Your Rights">
        <LegalP>Under UK data protection law, you have the right to:</LegalP>
        <LegalList
          items={[
            "Access the personal data we hold about you",
            "Request correction of inaccurate personal data",
            "Request erasure of your personal data, subject to certain exemptions",
            "Restrict or object to certain processing",
            "Request a copy of your data in a portable format",
            "Withdraw consent at any time, where processing is based on consent",
          ]}
        />
        <LegalP>
          To exercise any of these rights, please contact us using the details in Section 2. We will
          respond within the timeframes required by law.
        </LegalP>
      </LegalSection>

      <LegalSection number={10} title="Cookies">
        <LegalP>
          Our website and embedded widgets use cookies and similar technologies. Full details are
          set out in our separate Cookie Policy, available at{" "}
          <LegalInternalLink href="/legal?section=cookies">
            tourbots.ai/legal?section=cookies
          </LegalInternalLink>
          .
        </LegalP>
      </LegalSection>

      <LegalSection number={11} title="Children's Privacy">
        <LegalP>
          The Service is intended for business use and is not directed at children. We do not
          knowingly collect personal data from children under the age of 13.
        </LegalP>
      </LegalSection>

      <LegalSection number={12} title="Security">
        <LegalP>
          We implement appropriate technical and organisational measures to protect personal data
          against unauthorised access, loss, or misuse, including encryption in transit, access
          controls, and regular review of our security practices. No system is completely secure,
          and we cannot guarantee absolute security.
        </LegalP>
      </LegalSection>

      <LegalSection number={13} title="Changes to This Policy">
        <LegalP>
          We may update this Privacy Policy from time to time. Material changes will be notified via
          the Service or by email where appropriate. The &quot;Effective date&quot; at the top of
          this Policy indicates when it was last updated.
        </LegalP>
      </LegalSection>

      <LegalSection number={14} title="Complaints">
        <LegalP>
          If you have concerns about how we handle your personal data, please contact us in the
          first instance. You also have the right to lodge a complaint with the UK&apos;s
          supervisory authority:
        </LegalP>
        <LegalInfoGrid
          rows={[
            {
              label: "Authority",
              value: "Information Commissioner's Office (ICO)",
            },
            {
              label: "Website",
              value: (
                <LegalExternalLink href="https://ico.org.uk">ico.org.uk</LegalExternalLink>
              ),
            },
            { label: "Helpline", value: "0303 123 1113" },
          ]}
        />
      </LegalSection>

      <LegalSection number={15} title="Contact Us">
        <LegalP>
          For any questions about this Privacy Policy or our data practices, please contact:
        </LegalP>
        <LegalInfoGrid
          rows={[
            { label: "Company", value: "TourBots AI Ltd" },
            {
              label: "Registered Address",
              value: "10-12 Mulberry Green, Harlow, England, CM17 0ET",
            },
            {
              label: "Email",
              value: <LegalMailLink email="legal@tourbots.ai" />,
            },
          ]}
        />
      </LegalSection>
    </div>
  );
}
