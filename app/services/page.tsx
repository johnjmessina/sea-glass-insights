import Link from "next/link";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","600","700"], variable: "--font-cormorant" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-montserrat" });

const SAND  = "#F4EADA";
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const GRAY  = "#6B7280";
const LGRAY = "#9CA3AF";
const WHITE = "#FFFFFF";

const SERVICES = [
  {
    id: 1,
    name: "Market Intelligence Report",
    price: "$199",
    turnaround: "48-72 hrs",
    tag: "Most Popular",
    description: "Your market, your customers, your competitors in one professionally written report. AI generates the research foundation. A real analyst reviews, refines, and makes sure every insight is relevant to your business.",
    includes: ["Business Snapshot","Customer Profile (3 segments)","Competitive Landscape (up to 3 competitors)","Market Positioning analysis","Key Insights","Actionable Recommendations","Analyst note"],
    note: null,
    cta: { text: "Get My Report", href: "/get-report" },
  },
  {
    id: 2,
    name: "Social Media Audit",
    price: "$199",
    turnaround: "48-72 hrs",
    tag: null,
    description: "A scored assessment of your social media presence across seven dimensions, from profile setup and content quality to engagement, brand consistency, and how you stack up against competitors.",
    includes: ["Profile and Setup review","Content Quality scoring","Posting Consistency analysis","Engagement assessment","Brand Consistency evaluation","Platform Utilization review","Competitive Social Comparison (up to 2 competitors)","Overall Presence Score with written recommendations"],
    note: null,
    cta: { text: "Get My Audit", href: "/contact" },
  },
  {
    id: 3,
    name: "Secret Shopping",
    price: "$299",
    turnaround: "5-7 days",
    tag: null,
    description: "A professional visit to your business, or a competitor's, scored across seven dimensions of the customer experience. You will see your business the way a first-time customer does.",
    includes: ["In-person visit by a trained researcher","Scored assessment across 7 dimensions","Section-by-section narrative notes","Analyst Observations","Formatted deliverable report"],
    note: "Available for businesses in the Monmouth County and Jersey Shore area. Travel surcharge may apply for locations outside this area.",
    cta: { text: "Request a Shop", href: "/contact" },
  },
  {
    id: 4,
    name: "Deep Dive Report",
    price: "$399",
    turnaround: "5-7 days",
    tag: null,
    description: "Everything in the Market Intelligence Report, but deeper. The same competitor set examined with greater rigor, more sources, more context, more analyst time spent on what each finding actually means for your business. Built for businesses facing a major decision or responding to a significant competitive threat.",
    includes: ["Everything in the MIR plus:","Deeper competitive intelligence on each competitor (sources, positioning gaps, threat level)","Additional customer segments","Expanded market context and trend analysis","Extended recommendations with implementation guidance","Priority action framework"],
    note: null,
    cta: { text: "Get My Deep Dive", href: "/contact" },
  },
  {
    id: 5,
    name: "Synthetic Survey Report",
    price: "$399",
    turnaround: "48-72 hrs",
    tag: null,
    description: "Don't have a customer list yet? We use AI-generated customer personas to pressure-test your assumptions and surface directional insight, with full transparency about the methodology.",
    includes: ["Custom research questions based on your business goals","AI-generated persona responses across 3-5 customer types","Thematic analysis of patterns and contradictions","Directional recommendations","Full methodology disclosure — results are presented as directional insight, not statistically validated data"],
    note: null,
    cta: { text: "Learn More", href: "/privacy#synthetic-surveys" },
  },
  {
    id: 6,
    name: "Voice of Customer Survey",
    price: "$499",
    turnaround: "1-2 weeks",
    tag: null,
    description: "Real feedback from your real customers. We design the survey, help you send it to your existing contact list, and deliver a visual analysis report with findings and recommendations.",
    includes: ["Custom survey design (up to 10 questions)","Optimized for email or SMS distribution","Response collection and analysis","Visual report with findings, themes, and recommendations","Analyst interpretation"],
    note: "Requires an existing customer contact list. Sea Glass Insights does not provide contact lists.",
    cta: { text: "Get Started", href: "/contact" },
  },
  {
    id: 7,
    name: "AI Starter Kit",
    price: "$99 standalone / $79 add-on",
    turnaround: "48 hrs",
    tag: null,
    description: "Five to six custom AI prompts built specifically for your business type, ready to use immediately for marketing copy, customer responses, social media captions, and more.",
    includes: ["Business type analysis","5-6 custom-written prompts tailored to your specific business","Instructions for use with ChatGPT, Claude, or any major AI tool","One round of revisions"],
    note: null,
    cta: { text: "Get My Kit", href: "/contact" },
  },
];

const BUNDLES = [
  { name: "Starter Intelligence", items: "Market Intelligence Report + Social Media Audit", price: "$349", savings: "save $49" },
  { name: "Full Picture",         items: "Market Intelligence Report + Secret Shopping",   price: "$449", savings: "save $49" },
  { name: "Deep Intelligence",    items: "Deep Dive Report + Social Media Audit",          price: "$549", savings: "save $49" },
];

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Tell Us About Your Business",
    body: "Answer a short intake form about your market, customers, and goals. Takes about 15 minutes. Please only share what you are comfortable sharing publicly — your responses will be used to generate your report with the assistance of AI.",
  },
  {
    num: "2",
    title: "A Real Analyst Gets to Work",
    body: "I personally review every submission, combining professional research methodology with AI intelligence to provide something genuinely useful.",
  },
  {
    num: "3",
    title: "Your Report Arrives",
    body: "A professionally written report lands in your inbox within the promised timeframe. Insights you can act on immediately.",
  },
];

export default function ServicesPage() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, color: NAVY }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "72px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "680px", margin: "0 auto 24px" }}>
          Every small business has an edge. Let&rsquo;s refine yours.
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "clamp(0.92rem,2vw,1rem)", color: "#CBD5E1", maxWidth: "620px", margin: "0 auto", lineHeight: 1.8 }}>
          Sea Glass Insights delivers professional market research reports for small businesses. AI generates the foundation. A real analyst with over ten years of market research experience reviews, refines, and makes sure the insights that reach you actually matter.
        </p>
      </section>

      {/* SERVICE CARDS */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>
            Our Services
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: LGRAY, textAlign: "center", marginBottom: "52px" }}>
            Every report is analyst-reviewed. Every insight is earned.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {SERVICES.map(svc => (
              <div
                key={svc.id}
                style={{ border: "1px solid #E5E7EB", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", position: "relative", backgroundColor: WHITE }}
              >
                {svc.tag && (
                  <span style={{ position: "absolute", top: "20px", right: "20px", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontSize: "0.68rem", fontWeight: 700, padding: "4px 10px", borderRadius: "9999px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {svc.tag}
                  </span>
                )}
                <div style={{ width: "4px", height: "28px", backgroundColor: TEAL, borderRadius: "2px", marginBottom: "16px" }} />
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.35rem", fontWeight: 700, color: NAVY, marginBottom: "6px", paddingRight: svc.tag ? "90px" : 0 }}>
                  {svc.name}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.1rem", fontWeight: 700, color: NAVY }}>{svc.price}</span>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.75rem", color: LGRAY, fontWeight: 500 }}>{svc.turnaround}</span>
                </div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.87rem", color: GRAY, lineHeight: 1.75, marginBottom: "20px" }}>{svc.description}</p>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.72rem", fontWeight: 600, color: NAVY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Includes</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {svc.includes.map((item, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ color: TEAL, fontWeight: 700, fontSize: "0.82rem", marginTop: "1px", flexShrink: 0 }}>✓</span>
                        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: GRAY, lineHeight: 1.5 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {svc.note && (
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.77rem", color: LGRAY, fontStyle: "italic", lineHeight: 1.6, marginBottom: "20px", padding: "10px 12px", backgroundColor: "#F9FAFB", borderRadius: "8px", borderLeft: "3px solid #E5E7EB" }}>
                    {svc.note}
                  </p>
                )}
                <Link
                  href={svc.cta.href}
                  style={{ display: "inline-block", backgroundColor: svc.id === 1 ? TEAL : "transparent", color: NAVY, border: `1.5px solid ${svc.id === 1 ? TEAL : NAVY}`, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.83rem", padding: "9px 20px", borderRadius: "9999px", textDecoration: "none", textAlign: "center" }}
                >
                  {svc.cta.text} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUNDLES */}
      <section style={{ backgroundColor: NAVY, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: WHITE, textAlign: "center", marginBottom: "8px" }}>
            Service Bundles
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: "#93C5FD", textAlign: "center", marginBottom: "44px" }}>Pair services and save.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {BUNDLES.map(b => (
              <div key={b.name} style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 700, color: WHITE, marginBottom: "10px" }}>{b.name}</h3>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.8rem", color: "#93C5FD", marginBottom: "20px", lineHeight: 1.6 }}>{b.items}</p>
                <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.6rem", fontWeight: 700, color: WHITE, marginBottom: "6px" }}>{b.price}</div>
                <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.75rem", color: TEAL, fontWeight: 600, letterSpacing: "0.04em" }}>{b.savings}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.83rem", color: "#93C5FD", textAlign: "center", marginTop: "28px" }}>
            Bundle pricing available on request.{" "}
            <Link href="/contact" style={{ color: TEAL, textDecoration: "underline", fontWeight: 600 }}>Contact us to order.</Link>
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "52px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {HOW_IT_WORKS.map(({ num, title, body }) => (
              <div key={num} style={{ textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 700, margin: "0 auto 20px" }}>{num}</div>
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 600, color: NAVY, marginBottom: "12px" }}>{title}</h3>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.87rem", color: GRAY, lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "580px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 700, color: NAVY, marginBottom: "16px", lineHeight: 1.3 }}>
            Not sure which service is right for you?
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.93rem", color: GRAY, lineHeight: 1.8, marginBottom: "32px" }}>
            Reach out — we are happy to talk through your situation and recommend the best fit.
          </p>
          <Link href="/contact" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "1rem", padding: "14px 40px", borderRadius: "9999px", textDecoration: "none" }}>
            Contact John →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
