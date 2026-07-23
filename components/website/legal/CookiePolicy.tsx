import {
  LegalInfoGrid,
  LegalInternalLink,
  LegalIntro,
  LegalList,
  LegalMailLink,
  LegalP,
  LegalSection,
  LegalTable,
} from "./LegalDocumentParts";

export function CookiePolicy() {
  return (
    <div className="space-y-5">
      <LegalIntro>
        <LegalP>How TourBots AI Ltd uses cookies and similar technologies.</LegalP>
        <LegalP>
          TourBots AI Ltd, 10-12 Mulberry Green, Harlow, England, CM17 0ET
        </LegalP>
      </LegalIntro>

      <LegalSection number={1} title="Introduction">
        <LegalP>
          This Cookie Policy explains how TourBots AI Ltd (&quot;TourBots&quot;, &quot;we&quot;,
          &quot;us&quot;) uses cookies and similar tracking technologies on tourbots.ai and within
          the TourBots platform and embedded widgets. It should be read alongside our Privacy
          Policy, available at{" "}
          <LegalInternalLink href="/legal?section=privacy">
            tourbots.ai/legal?section=privacy
          </LegalInternalLink>
          .
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="What Are Cookies">
        <LegalP>
          Cookies are small text files placed on your device when you visit a website. They are
          widely used to make websites work more efficiently, to remember your preferences, and to
          provide information to website owners. Similar technologies include local storage and
          tracking pixels, which we refer to collectively as &quot;cookies&quot; in this Policy.
        </LegalP>
      </LegalSection>

      <LegalSection number={3} title="How We Use Cookies">
        <LegalP>We use cookies for the following purposes:</LegalP>
        <LegalList
          items={[
            "To keep you signed in to your Account",
            "To remember your preferences and settings",
            "To understand how visitors use our website and Service, so we can improve it",
            "To measure the performance of our marketing and identify how visitors found our website",
          ]}
        />
      </LegalSection>

      <LegalSection number={4} title="Types of Cookies We Use">
        <LegalTable
          headers={["Category", "Purpose"]}
          rows={[
            [
              "Strictly Necessary",
              "Required for the website and Service to function, including authentication and session management. Cannot be disabled.",
            ],
            [
              "Performance and Analytics",
              "Help us understand how visitors interact with our website and Service, so we can improve performance and usability.",
            ],
            [
              "Functionality",
              "Remember choices you make, such as display preferences, to provide a more personalised experience.",
            ],
          ]}
        />
      </LegalSection>

      <LegalSection number={5} title="Third-Party Cookies">
        <LegalP>
          Some cookies on our website are placed by third-party services we use to operate and
          improve the Service, including analytics providers and, where applicable, our payment
          processor Stripe. These third parties may use cookies in accordance with their own privacy
          and cookie policies.
        </LegalP>
      </LegalSection>

      <LegalSection number={6} title="Cookies Within Embedded Widgets">
        <LegalP>
          Where a Customer embeds a TourBots chatbot or tour widget on their own website, certain
          functional cookies may be set to support session continuity within the widget. These are
          limited to what is necessary to provide the embedded functionality.
        </LegalP>
      </LegalSection>

      <LegalSection number={7} title="Managing Cookies">
        <LegalP>You can control and manage cookies in a number of ways:</LegalP>
        <LegalList
          items={[
            "Our cookie consent banner, which allows you to accept or reject non-essential cookies when you first visit our website",
            "Your browser settings, which allow you to block or delete cookies — instructions vary by browser and are typically available in your browser's help section",
            "Opt-out tools provided by individual third-party services, where available",
          ]}
        />
        <LegalP>
          Please note that blocking strictly necessary cookies may affect the functionality of our
          website and Service.
        </LegalP>
      </LegalSection>

      <LegalSection number={8} title="Changes to This Policy">
        <LegalP>
          We may update this Cookie Policy from time to time to reflect changes in the cookies we
          use or for legal or regulatory reasons. The &quot;Effective date&quot; at the top of this
          Policy indicates when it was last updated.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Contact Us">
        <LegalP>If you have questions about our use of cookies, please contact:</LegalP>
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
