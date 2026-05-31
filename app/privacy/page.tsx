import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-montserrat" });

const NAVY = "#0A2F61";
const GRAY = "#374151";
const LGRAY = "#6B7280";
const SAND = "#F4EADA";
const WHITE = "#FFFFFF";
const TEAL = "#00CED1";

function Section({ title, children, ...rest }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "40px" }} {...rest}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.25rem", fontWeight: 700, color: NAVY, marginBottom: "14px", paddingBottom: "8px", borderBottom: `2px solid ${TEAL}` }}>
        {title}
      </h2>
      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.93rem", color: GRAY, lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children, ...rest }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }} {...rest}>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: "12px" }}>{children}</p>;
}

function OL({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: "20px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  );
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "20px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <div className={montserrat.variable} style={{ backgroundColor: WHITE, minHeight: "100vh" }}>

      {/* NAV */}
      <header style={{ backgroundColor: SAND, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "1.1rem", color: NAVY, textDecoration: "none" }}>
          Sea Glass Insights
        </Link>
        <Link href="/get-report" style={{ fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.88rem", color: NAVY, textDecoration: "none", border: `1.5px solid ${NAVY}`, padding: "7px 20px", borderRadius: "9999px" }}>
          Get Your Report
        </Link>
      </header>

      {/* HERO */}
      <div style={{ backgroundColor: NAVY, padding: "56px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 700, color: WHITE, marginBottom: "12px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: "#93C5FD" }}>
          Sea Glass Insights LLC &nbsp;|&nbsp; Effective Date: June 1, 2026
        </p>
      </div>

      {/* CONTENT */}
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 80px" }}>

        <Section title="1. Introduction">
          <P>
            Sea Glass Insights LLC (&ldquo;Sea Glass Insights,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates this website and provides professional market research services for small businesses. This Privacy Policy explains how we collect, use, disclose, and protect information you provide when using our website or ordering our services.
          </P>
          <P>
            By using our site or placing an order, you agree to the data practices described in this policy. If you do not agree, please do not use our services.
          </P>
        </Section>

        <Section title="2. Information We Collect">
          <Sub title="Provided Directly">
            <P>When you complete our intake form or place an order, we collect:</P>
            <UL items={[
              "Your name and the name of your business",
              "Your email address",
              "Your responses to our business questionnaire (up to 10 questions about your market, customers, competitors, and goals)",
              "Payment information (processed directly by Stripe — we do not store your card number or CVV)",
            ]} />
            <P>We only ask for information that is necessary to deliver your report. Please only share what you are comfortable sharing.</P>
          </Sub>
          <Sub title="Collected Automatically">
            <P>When you visit our site, we may automatically receive:</P>
            <UL items={[
              "IP address and general geographic location",
              "Browser type and version",
              "Pages visited and time spent on site",
              "Referring URL",
              "Device type",
            ]} />
            <P>This information is used solely for site maintenance and improving the user experience. We do not use it for advertising targeting.</P>
          </Sub>
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <UL items={[
            "Process and fulfill your research order",
            "Generate your report using AI-assisted analysis, reviewed by a human analyst",
            "Communicate with you about your order status, questions, and delivery",
            "Respond to inquiries and provide customer support",
            "Improve our research methodology and service quality",
            "Comply with applicable laws and regulations",
          ]} />
          <P>We do not use your information to send marketing emails unless you have explicitly opted in.</P>
        </Section>

        <Section id="ai-usage" title="4. How AI Is Used in Our Process">
          <Sub title="What AI Does">
            <P>
              Your intake responses are transmitted to an AI language model — currently powered by Anthropic&rsquo;s Claude API — to generate an initial research draft. This draft includes customer segmentation, competitive analysis, market positioning, key insights, and strategic recommendations tailored to your business.
            </P>
          </Sub>
          <Sub title="What AI Does Not Do">
            <P>AI does not:</P>
            <UL items={[
              "Make final decisions about what appears in your report",
              "Access external databases or the internet about your business beyond what you provide",
              "Share your information with other users or businesses",
              "Produce a report that is delivered without human review",
            ]} />
          </Sub>
          <Sub title="The Analyst Review Process">
            <P>Every report goes through the following steps before it reaches you:</P>
            <OL items={[
              "You complete the intake form with information about your business",
              "Your responses are submitted to our AI system to generate an initial research draft",
              "John Messina personally reviews every section of the AI-generated draft",
              "The analyst edits, refines, and verifies content for accuracy and relevance",
              "Sections are locked and approved by the analyst before report generation",
              "The final report is delivered to you by email",
            ]} />
          </Sub>
          <Sub title="Your Data and AI">
            <P>
              Your intake responses are transmitted to Anthropic&rsquo;s API for processing as part of the report generation workflow. Anthropic&rsquo;s handling of API data is governed by their{" "}
              <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "underline" }}>
                privacy policy
              </a>
              . We do not use your data to train AI models, and we have not configured our API usage to permit training on submitted content.
            </P>
          </Sub>
          <Sub title="A Note on Synthetic Survey Reports" id="synthetic-surveys">
            <P>
              Our Synthetic Survey Report product uses AI-generated customer personas — entirely fictional, representative customer archetypes — to analyze your business assumptions and surface directional insight. No real customer data or personal information from any third party is used or created in this process.
            </P>
            <P>
              All Synthetic Survey reports include a full methodology disclosure clearly identifying the AI-generated nature of the persona responses. Results represent directional, not statistically validated, findings.
            </P>
          </Sub>
        </Section>

        <Section title="5. Payment Processing">
          <P>
            All payments are processed by{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "underline" }}>Stripe, Inc.</a>
            {" "}We do not collect, store, or process your payment card information directly. When you complete a purchase, your payment data is submitted directly to Stripe&rsquo;s secure servers.
          </P>
          <P>
            We receive only a transaction confirmation, your email address, and a transaction reference ID from Stripe. Your payment data is subject to{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "underline" }}>
              Stripe&rsquo;s Privacy Policy
            </a>
            .
          </P>
        </Section>

        <Section title="6. How We Share Your Information">
          <P>We do not sell your personal information to any third party. We may share information only in these circumstances:</P>
          <UL items={[
            "Service providers: We use Supabase (database storage), Stripe (payment processing), and Anthropic (AI processing) to operate our service. These providers are contractually required to protect your information and use it only to provide services to us.",
            "Legal requirements: We may disclose information if required by law, court order, or to protect the rights and safety of our customers or the public.",
            "Business transfer: If Sea Glass Insights is acquired or merges with another entity, your information may be transferred as part of that transaction. We will notify you of any material change in ownership.",
          ]} />
        </Section>

        <Section title="7. Data Retention">
          <P>
            We retain your order information and intake responses for a minimum of 24 months to provide customer support, respond to inquiries, and fulfill any reasonable follow-up requests related to your report.
          </P>
          <P>
            You may request deletion of your data at any time by contacting us at the address below. We will honor deletion requests within 30 days except where retention is required by law.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>Depending on your location, you may have the right to:</P>
          <UL items={[
            "Access: Request a copy of the personal information we hold about you",
            "Correction: Request that we correct inaccurate or incomplete information",
            "Deletion: Request that we delete your personal information",
            "Portability: Receive your data in a structured, machine-readable format",
            "Objection: Object to certain types of processing of your information",
          ]} />
          <P>
            To exercise any of these rights, contact us at the email address listed in Section 13. We will respond within 30 days.
          </P>
        </Section>

        <Section title="9. Cookies">
          <P>
            Our site uses minimal session cookies required for basic site functionality, such as maintaining your session during the checkout process. We do not use cookies for advertising tracking, behavioral profiling, or cross-site tracking.
          </P>
          <P>
            You can configure your browser to refuse cookies or alert you when cookies are being sent. If you disable cookies, some features of our site may not function correctly.
          </P>
        </Section>

        <Section title="10. Third-Party Links">
          <P>
            Our website and reports may contain links to third-party websites, including resources referenced in your report&rsquo;s research. We are not responsible for the privacy practices or content of those external sites. We encourage you to review the privacy policy of any third-party site you visit.
          </P>
        </Section>

        <Section title="11. Children's Privacy">
          <P>
            Our services are directed to business owners and are not intended for individuals under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have inadvertently collected such information, we will delete it promptly. If you believe we may have collected information from a child, please contact us immediately.
          </P>
        </Section>

        <Section title="12. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or the services we offer. Material changes will be reflected in an updated effective date at the top of this page.
          </P>
          <P>
            We encourage you to review this page periodically. Continued use of our services after any changes constitutes your acceptance of the updated policy.
          </P>
        </Section>

        <Section title="13. Contact">
          <P>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:</P>
          <div style={{ backgroundColor: SAND, borderRadius: "12px", padding: "24px 28px", marginTop: "8px" }}>
            <p style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: NAVY, fontSize: "1rem", marginBottom: "8px" }}>John Messina</p>
            <p style={{ marginBottom: "4px" }}>Founder, Sea Glass Insights LLC</p>
            <p style={{ marginBottom: "4px" }}>Bradley Beach, NJ</p>
            <p style={{ marginBottom: "4px" }}>
              <a href="mailto:john@seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>
                john@seaglassinsights.com
              </a>
            </p>
            <p>
              <a href="https://seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>
                seaglassinsights.com
              </a>
            </p>
          </div>
        </Section>

      </main>

      {/* FOOTER */}
      <footer style={{ backgroundColor: NAVY, color: "#93C5FD", textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: WHITE, marginBottom: "8px" }}>
          Sea Glass Insights — Refining the Edge.
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", marginBottom: "6px" }}>
          John Messina, Founder | Bradley Beach, NJ | seaglassinsights.com
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", marginBottom: "6px" }}>
          &copy; 2026 Sea Glass Insights. All rights reserved.
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.78rem" }}>
          <Link href="/privacy" style={{ color: "#93C5FD", textDecoration: "underline" }}>Privacy Policy</Link>
          {" · "}
          <Link href="/services" style={{ color: "#93C5FD", textDecoration: "underline" }}>Services</Link>
        </p>
      </footer>

    </div>
  );
}
