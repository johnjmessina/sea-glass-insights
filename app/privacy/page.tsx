import Link from "next/link";
import { Montserrat } from "next/font/google";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-montserrat" });

const NAVY = "#0A2F61";
const TEAL = "#00CED1";
const GRAY = "#374151";
const SAND = "#F4EADA";
const WHITE = "#FFFFFF";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 700, color: NAVY, marginBottom: "14px", paddingBottom: "8px", borderBottom: `2px solid ${TEAL}`, marginTop: "40px" }}>{children}</h2>;
}
function H3({ children, ...rest }: { id?: string; children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: NAVY, marginBottom: "10px", marginTop: "20px" }} {...rest}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.91rem", color: GRAY, lineHeight: 1.85, marginBottom: "14px" }}>{children}</p>;
}
function OL({ items }: { items: string[] }) {
  return <ol style={{ paddingLeft: "20px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>{items.map((t,i) => <li key={i} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.91rem", color: GRAY, lineHeight: 1.75 }}>{t}</li>)}</ol>;
}

export default function PrivacyPage() {
  return (
    <div className={montserrat.variable} style={{ backgroundColor: WHITE }}>
      <SiteNav />

      <section style={{ backgroundColor: NAVY, padding: "56px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: WHITE, marginBottom: "12px" }}>Privacy Policy</h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", color: "#93C5FD" }}>
          Effective Date: June 1, 2026 &nbsp;|&nbsp; Last Updated: June 1, 2026
        </p>
      </section>

      <main style={{ maxWidth: "740px", margin: "0 auto", padding: "56px 24px 80px" }}>

        <H2>1. Introduction</H2>
        <P>Sea Glass Insights LLC is committed to protecting your privacy and being transparent about how we work. This Privacy Policy explains how we collect, use, and safeguard your information when you visit seaglassinsights.com or purchase our services. It also explains how artificial intelligence is used in our research process and what that means for your data.</P>

        <H2>2. Information We Collect</H2>
        <H3>Provided Directly</H3>
        <P>Name and business name, email address, phone number, business address, payment information (processed securely through Stripe — we do not store your full card details), information provided about your business through our intake forms.</P>
        <H3>Collected Automatically</H3>
        <P>IP address and browser type, pages viewed and time spent on the site, referring URLs, device type and operating system. Collected through standard web analytics tools and cookies.</P>

        <H2>3. How We Use Your Information</H2>
        <P>To deliver services purchased, generate reports and deliverables, process payments through Stripe, communicate about orders and project status, respond to inquiries, improve our website and services, comply with legal obligations. We do not sell, rent, or trade your personal information to third parties for marketing purposes.</P>

        <H2>4. How AI Is Used in Our Process</H2>
        <H3>What AI Does</H3>
        <P>When you submit an intake form, that information is used to generate an initial research foundation using large language model technology, specifically Anthropic&rsquo;s Claude. AI synthesizes publicly available market and competitive information, drafts initial report sections, identifies patterns and directional insights from your responses, and generates synthetic customer personas for the Synthetic Customer Profile Report.</P>
        <H3>What AI Does Not Do</H3>
        <P>AI does not make final editorial or strategic judgments without human review, replace the analyst&rsquo;s interpretation of findings, generate fabricated competitor data presented as factual, or make financial or investment recommendations.</P>
        <H3>The Analyst Review Process</H3>
        <OL items={[
          "Intake — You provide information through our intake form or direct communication",
          "AI Foundation — An initial research draft is generated using AI tools",
          "Analyst Review — John Messina personally reviews every section, edits for accuracy, adds professional judgment, and supplements with additional research where needed",
          "Delivery — A finalized, professionally reviewed report is delivered to you",
        ]} />
        <H3>Your Data and AI</H3>
        <P>Your intake information is submitted to Anthropic&rsquo;s Claude API as part of the report generation process. By default, Anthropic does not use API-submitted data to train their models. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "underline" }}>anthropic.com/privacy</a> for details. Your business information is used solely to produce your report. It is not used to train AI models, shared with third parties for marketing purposes, or sold.</P>
        <H3 id="synthetic-surveys">Synthetic Customer Profile Reports</H3>
        <P>The Synthetic Customer Profile Report uses AI-generated customer personas to simulate how different customer types might respond to your research questions. This is a directional research tool, not a replacement for actual customer feedback. Results are clearly presented as directional insight, not statistically validated customer data, and the methodology is fully disclosed in every deliverable.</P>

        <H2>5. Payment Processing</H2>
        <P>All payment transactions are processed by Stripe, Inc. Your payment information is transmitted directly to Stripe and is subject to Stripe&rsquo;s Privacy Policy at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "underline" }}>stripe.com/privacy</a>. Sea Glass Insights does not store your full credit card number, CVV, or bank account details.</P>

        <H2>6. How We Share Your Information</H2>
        <P>Service providers including Stripe for payments and Anthropic&rsquo;s Claude for AI-assisted research. Legal requirements if required by law. Business transfers with appropriate confidentiality protections.</P>

        <H2>7. Data Retention</H2>
        <P>Retained as long as necessary to fulfill service delivery, maintain business records, and comply with legal obligations. Intake form data and report content retained for a minimum of one year. To request deletion, contact <a href="mailto:john@seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>john@seaglassinsights.com</a> and we will respond within 10 business days.</P>

        <H2>8. Your Rights</H2>
        <P>Access personal information we hold, request correction of inaccurate information, request deletion subject to certain exceptions, opt out of future marketing communications. Contact <a href="mailto:john@seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>john@seaglassinsights.com</a> to exercise these rights.</P>

        <H2>9. Cookies</H2>
        <P>Our website uses cookies to enhance your experience and analyze site traffic. You may configure your browser to refuse cookies, though some features may not function properly without them.</P>

        <H2>10. Third-Party Links</H2>
        <P>Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites.</P>

        <H2>11. Children&rsquo;s Privacy</H2>
        <P>Our services are intended for business owners and professionals. We do not knowingly collect personal information from individuals under the age of 18.</P>

        <H2>12. Changes to This Policy</H2>
        <P>We will update the Last Updated date when changes are made. Continued use of the site following changes constitutes acceptance of the updated policy.</P>

        <H2>13. Contact</H2>
        <div style={{ backgroundColor: SAND, borderRadius: "12px", padding: "24px 28px", marginTop: "8px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: NAVY, fontSize: "1rem", marginBottom: "8px" }}>John Messina, Founder</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.88rem", color: GRAY, lineHeight: 2 }}>
            Sea Glass Insights LLC<br />
            Bradley Beach, NJ<br />
            <a href="mailto:john@seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>john@seaglassinsights.com</a><br />
            <a href="https://seaglassinsights.com" style={{ color: TEAL, textDecoration: "underline" }}>seaglassinsights.com</a>
          </p>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
