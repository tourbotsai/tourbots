import {
  LegalInfoGrid,
  LegalInternalLink,
  LegalIntro,
  LegalList,
  LegalMailLink,
  LegalP,
  LegalSection,
  LegalSubclauses,
} from "./LegalDocumentParts";

export function TermsOfService() {
  return (
    <div className="space-y-5">
      <LegalIntro>
        <LegalP>The terms governing your use of the TourBots AI platform.</LegalP>
        <LegalP>
          TourBots AI Ltd, 10-12 Mulberry Green, Harlow, England, CM17 0ET
        </LegalP>
      </LegalIntro>

      <LegalSection number={1} title="Introduction and Acceptance">
        <LegalP>
          These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the
          website tourbots.ai and the TourBots AI platform, including the dashboard, chatbot embed,
          agency portal, and any related services (together, the &quot;Service&quot;), provided by
          TourBots AI Ltd, a company registered in England and Wales with registered office at
          10-12 Mulberry Green, Harlow, England, CM17 0ET (&quot;TourBots&quot;, &quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;).
        </LegalP>
        <LegalP>
          By creating an account, accessing, or using the Service, you (&quot;Customer&quot;,
          &quot;you&quot;, &quot;your&quot;) agree to be bound by these Terms. If you are entering
          into these Terms on behalf of a company or other legal entity, you represent that you have
          the authority to bind that entity, in which case &quot;you&quot; refers to that entity.
        </LegalP>
        <LegalP>
          If you do not agree to these Terms, do not access or use the Service.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="Definitions">
        <LegalSubclauses
          clauses={[
            {
              id: "2.1",
              content:
                '"Account" means the account you create to access the Service.',
            },
            {
              id: "2.2",
              content:
                '"Agency Account" means an account type permitting the management of multiple client Bots and access to white-label functionality.',
            },
            {
              id: "2.3",
              content:
                '"Content" means any tour data, documents, text, branding, or other material uploaded or submitted to the Service by you.',
            },
            {
              id: "2.4",
              content:
                '"Bot" means a single tour location or standalone website chatbot connected to the Service and configured with an AI chatbot.',
            },
            {
              id: "2.5",
              content:
                '"Visitor" means any end user who interacts with a Bot or chatbot embedded via the Service.',
            },
            {
              id: "2.6",
              content:
                '"White-Label" means the removal of TourBots branding from a Bot or portal as permitted under an applicable paid plan.',
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={3} title="The Service">
        <LegalP>
          TourBots provides a software-as-a-service platform that adds an AI chatbot layer to
          virtual tours, including question answering, tour navigation, standalone website chat
          functionality, and related analytics and lead management features. The Service is provided
          on a self-serve, subscription basis as further described on{" "}
          <LegalInternalLink href="/pricing">tourbots.ai/pricing</LegalInternalLink>.
        </LegalP>
        <LegalP>
          We may update, modify, or discontinue features of the Service from time to time. We will
          use reasonable endeavours to notify Customers of material changes that adversely affect
          core functionality.
        </LegalP>
      </LegalSection>

      <LegalSection number={4} title="Accounts and Registration">
        <LegalSubclauses
          clauses={[
            {
              id: "4.1",
              content:
                "You must provide accurate and complete information when creating an Account and keep it up to date.",
            },
            {
              id: "4.2",
              content:
                "You are responsible for maintaining the confidentiality of your Account credentials and for all activity that occurs under your Account.",
            },
            {
              id: "4.3",
              content:
                "You must notify us promptly of any unauthorised use of your Account.",
            },
            {
              id: "4.4",
              content:
                "We may suspend or terminate any Account that we reasonably believe has been compromised, misused, or created in breach of these Terms.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={5} title="Subscription Plans and Fees">
        <LegalP>
          Current plans, features, and pricing are published at{" "}
          <LegalInternalLink href="/pricing">tourbots.ai/pricing</LegalInternalLink> and form
          part of these Terms by reference. Plans include a free tier with limited usage, a Pro plan
          covering one active Bot, additional Bot add-ons, a White-Label add-on, and Agency
          Accounts covering multiple client Bots.
        </LegalP>
        <LegalP>
          We may change our pricing from time to time. Where a price change affects an existing
          subscription, we will provide at least 30 days&apos; notice before the change takes
          effect.
        </LegalP>
      </LegalSection>

      <LegalSection number={6} title="Payment Terms">
        <LegalSubclauses
          clauses={[
            {
              id: "6.1",
              content:
                "Paid subscriptions are billed in advance on a monthly or annual basis via our payment processor, Stripe, and are subject to Stripe's own terms of service.",
            },
            {
              id: "6.2",
              content:
                "All fees are exclusive of VAT and any other applicable taxes, which will be added where required by law.",
            },
            {
              id: "6.3",
              content:
                "Failure to pay any fees when due may result in suspension of the Service until payment is received.",
            },
            {
              id: "6.4",
              content: "You are responsible for keeping your payment details current.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={7} title="Cancellation and Refunds">
        <LegalSubclauses
          clauses={[
            {
              id: "7.1",
              content:
                "You may cancel your subscription at any time through your Account settings. Cancellation takes effect at the end of the then-current billing period.",
            },
            {
              id: "7.2",
              content:
                "Except as required by law or expressly stated otherwise, fees already paid are non-refundable.",
            },
            {
              id: "7.3",
              content:
                "Consumers in the UK may have a statutory right to cancel certain contracts within 14 days; this right does not apply once you have accessed digital content with your express consent and acknowledgement that this right is lost.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={8} title="Acceptable Use">
        <LegalP>You must not use the Service to:</LegalP>
        <LegalList
          items={[
            "Upload or transmit unlawful, defamatory, obscene, or infringing content",
            "Attempt to gain unauthorised access to the Service, other accounts, or our systems",
            "Reverse engineer, decompile, or attempt to extract the source code of the Service, except as permitted by law",
            "Use the Service to build a directly competing product using our proprietary code, prompts, or infrastructure",
            "Interfere with or disrupt the integrity or performance of the Service",
            "Use the Service in a manner that violates applicable data protection or consumer protection law",
          ]}
        />
        <LegalP>
          We reserve the right to suspend or terminate access for any breach of this section.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Customer Content and Data">
        <LegalSubclauses
          clauses={[
            {
              id: "9.1",
              content:
                "You retain all ownership rights in Content you upload to the Service, including tour data, documents, and branding materials.",
            },
            {
              id: "9.2",
              content:
                "You grant TourBots a non-exclusive, worldwide licence to host, store, process, and display your Content solely for the purpose of providing the Service to you.",
            },
            {
              id: "9.3",
              content:
                "You are responsible for ensuring you have all necessary rights and consents to upload and use any Content, including any third-party or Visitor data.",
            },
            {
              id: "9.4",
              content: (
                <>
                  Where Content includes personal data of Visitors, our Data Processing Agreement
                  (available on request or at tourbots.ai/legal/dpa) applies to our processing of
                  that data on your behalf.
                </>
              ),
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={10} title="Intellectual Property">
        <LegalP>
          The Service, including all software, design, branding, and underlying technology, is owned
          by TourBots AI Ltd or its licensors and is protected by intellectual property laws. Except
          for the limited rights expressly granted to you under these Terms, no right, title, or
          interest in the Service is transferred to you.
        </LegalP>
      </LegalSection>

      <LegalSection number={11} title="Third-Party Services">
        <LegalP>
          The Service integrates with and relies upon third-party providers including but not
          limited to Matterport (for virtual tour hosting), OpenAI (for AI-generated responses),
          Stripe (for payment processing), and various cloud infrastructure providers. Your use of
          the Service may be subject to the applicable terms of these third parties. We are not
          responsible for the availability, performance, or content of third-party services.
        </LegalP>
      </LegalSection>

      <LegalSection number={12} title="AI-Generated Content">
        <LegalSubclauses
          clauses={[
            {
              id: "12.1",
              content:
                "The Service uses artificial intelligence to generate responses to Visitor queries based on Content you provide. AI-generated responses may occasionally be inaccurate or incomplete.",
            },
            {
              id: "12.2",
              content:
                "You are responsible for reviewing and validating the accuracy of information the AI is trained on and for monitoring chatbot conversations as appropriate for your use case.",
            },
            {
              id: "12.3",
              content:
                "TourBots does not guarantee the accuracy, completeness, or reliability of any AI-generated output and accepts no liability for decisions made by Visitors or Customers in reliance on such output, except where such liability cannot be excluded by law.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={13} title="White-Label and Agency Accounts">
        <LegalSubclauses
          clauses={[
            {
              id: "13.1",
              content:
                "Agency Accounts permit the management of multiple client Bots and, where the applicable add-on is purchased, removal of TourBots branding from Customer-facing surfaces.",
            },
            {
              id: "13.2",
              content:
                "Where you resell or provide access to the Service to your own clients under a White-Label arrangement, you remain responsible for your clients' compliance with these Terms and for your own commercial arrangements with those clients.",
            },
            {
              id: "13.3",
              content:
                "Custom domain functionality is provided on a reasonable endeavours basis and may be subject to technical limitations or third-party hosting requirements.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={14} title="Service Availability and Support">
        <LegalP>
          We aim to keep the Service available at all times but do not guarantee uninterrupted
          access. We may suspend the Service for maintenance, updates, or reasons beyond our
          reasonable control. Support is provided on a reasonable endeavours basis via the contact
          details published on our website.
        </LegalP>
      </LegalSection>

      <LegalSection number={15} title="Warranties and Disclaimers">
        <LegalP>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the maximum
          extent permitted by law, we exclude all warranties, conditions, and representations,
          whether express or implied, except those which cannot be excluded under applicable law,
          including the statutory rights afforded to consumers under the Consumer Rights Act 2015.
        </LegalP>
      </LegalSection>

      <LegalSection number={16} title="Limitation of Liability">
        <LegalSubclauses
          clauses={[
            {
              id: "16.1",
              content:
                "Nothing in these Terms limits or excludes our liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability which cannot be limited or excluded by law.",
            },
            {
              id: "16.2",
              content:
                "Subject to clause 16.1, our total liability to you arising out of or in connection with these Terms, whether in contract, tort, or otherwise, shall not exceed the total fees paid by you to us in the 12 months preceding the event giving rise to the claim.",
            },
            {
              id: "16.3",
              content:
                "We shall not be liable for any indirect, special, or consequential loss, or for loss of profits, revenue, business, or data, arising out of or in connection with these Terms.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={17} title="Indemnification">
        <LegalP>
          You agree to indemnify and hold TourBots harmless from any claims, damages, liabilities,
          and expenses (including reasonable legal fees) arising from your breach of these Terms,
          your Content, or your violation of any applicable law or third-party right.
        </LegalP>
      </LegalSection>

      <LegalSection number={18} title="Term and Termination">
        <LegalSubclauses
          clauses={[
            {
              id: "18.1",
              content:
                "These Terms remain in effect for as long as you maintain an Account or use the Service.",
            },
            {
              id: "18.2",
              content:
                "We may suspend or terminate your Account for material breach of these Terms, non-payment, or where required by law, with notice where reasonably practicable.",
            },
            {
              id: "18.3",
              content:
                "Upon termination, your right to access the Service ceases. We will retain and delete your Content in accordance with our Privacy Policy and, where applicable, our Data Processing Agreement.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={19} title="Data Protection">
        <LegalP>
          Our collection and use of personal data is described in our Privacy Policy, available at{" "}
          <LegalInternalLink href="/legal?section=privacy">
            tourbots.ai/legal?section=privacy
          </LegalInternalLink>
          . Where we process personal data on your behalf as a processor, our Data Processing
          Agreement applies.
        </LegalP>
      </LegalSection>

      <LegalSection number={20} title="Confidentiality">
        <LegalP>
          Each party agrees to keep confidential any non-public information disclosed by the other
          party in connection with the Service, and to use such information only for the purposes of
          performing its obligations under these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection number={21} title="Changes to These Terms">
        <LegalP>
          We may update these Terms from time to time. Where changes are material, we will provide
          reasonable notice via the Service or by email. Continued use of the Service after changes
          take effect constitutes acceptance of the updated Terms.
        </LegalP>
      </LegalSection>

      <LegalSection number={22} title="Governing Law and Jurisdiction">
        <LegalP>
          These Terms are governed by the laws of England and Wales. The courts of England and Wales
          shall have exclusive jurisdiction over any dispute arising out of or in connection with
          these Terms, save that consumers resident elsewhere in the UK may bring proceedings in
          their local courts.
        </LegalP>
      </LegalSection>

      <LegalSection number={23} title="General Provisions">
        <LegalSubclauses
          clauses={[
            {
              id: "23.1",
              content:
                "Severability: If any provision of these Terms is found unenforceable, the remaining provisions continue in full force and effect.",
            },
            {
              id: "23.2",
              content:
                "Assignment: You may not assign or transfer these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.",
            },
            {
              id: "23.3",
              content:
                "Force Majeure: Neither party is liable for delay or failure to perform due to causes beyond its reasonable control.",
            },
            {
              id: "23.4",
              content:
                "Entire Agreement: These Terms, together with our Privacy Policy and any applicable Data Processing Agreement, constitute the entire agreement between you and TourBots regarding the Service.",
            },
            {
              id: "23.5",
              content:
                "No Waiver: Failure to enforce any provision of these Terms does not constitute a waiver of that provision.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection number={24} title="Contact">
        <LegalP>Questions about these Terms should be directed to:</LegalP>
        <LegalInfoGrid
          rows={[
            { label: "Company", value: "TourBots AI Ltd" },
            {
              label: "Registered Address",
              value: "10-12 Mulberry Green, Harlow, England, CM17 0ET",
            },
            {
              label: "Website",
              value: <LegalInternalLink href="/">tourbots.ai</LegalInternalLink>,
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
