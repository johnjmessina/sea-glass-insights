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

const MIR_INCLUDES = [
  "Business Snapshot",
  "Customer Profile (3 segments)",
  "Competitive Landscape (up to 3 competitors)",
  "Market Positioning analysis",
  "Key Insights",
  "Actionable Recommendations",
  "Analyst note",
];

const BUNDLES = [
  { name: "Starter Intelligence", items: "MIR + Social Media Audit",   price: "$349", savings: "save $49" },
  { name: "Full Picture",         items: "MIR + Secret Shopping",       price: "$449", savings: "save $49" },
  { name: "Deep Intelligence",    items: "Deep Dive + Social Media Audit", price: "$549", savings: "save $49" },
];

const GRID_SERVICES = [
  { name: "Social Media Audit",       price: "$199", turnaround: "48-72 hrs", desc: "A scored assessment of your social media presence across seven dimensions." },
  { name: "Secret Shopping",          price: "$299", turnaround: "5-7 days",  desc: "See your business the way a first-time customer does." },
  { name: "Deep Dive Report",         price: "$399", turnaround: "5-7 days",  desc: "Deeper competitive intelligence for businesses facing a major decision." },
  { name: "Synthetic Survey Report",  price: "$399", turnaround: "48-72 hrs", desc: "AI-generated customer personas to surface directional insight when you do not have a customer list." },
  { name: "Voice of Customer Survey", price: "$499", turnaround: "1-2 weeks", desc: "Real feedback from your real customers, analyzed and delivered as a visual report." },
  { name: "AI Starter Kit",           price: "$99",  turnaround: "48 hrs",    desc: "Custom AI prompts built specifically for your business type." },
];

export default function ServicesPage() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, color: NAVY }}>
      <SiteNav />

      {/* ── PAGE HERO ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 72px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.2rem,5vw,3.2rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 16px" }}>
          Every small business has an edge. Let&rsquo;s refine yours.
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "560px", margin: "0 auto", lineHeight: 1.8 }}>
          Professional market research for small businesses. AI generates the foundation. A real analyst reviews, refines, and makes sure the insights that reach you actually matter.
        </p>
      </section>

      {/* ── MIR FEATURED CARD ─────────────────────────────────── */}
      <section style={{ backgroundColor: SAND, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: WHITE,
              border: `2px solid ${NAVY}`,
              borderRadius: "16px",
              padding: "44px 52px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "52px",
              alignItems: "start",
            }}
          >
            {/* Left column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontSize: "0.68rem", fontWeight: 700, padding: "4px 12px", borderRadius: "9999px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Most Popular
                </span>
              </div>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 700, color: NAVY, lineHeight: 1.15, marginBottom: "16px" }}>
                Market Intelligence Report
              </h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.6rem", fontWeight: 700, color: NAVY }}>$199</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: LGRAY, fontWeight: 500 }}>48-72 hour delivery</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: LGRAY, fontWeight: 500 }}>Flat fee</span>
              </div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.93rem", color: GRAY, lineHeight: 1.8, marginBottom: "28px" }}>
                Your market, your customers, your competitors in one professionally written report. AI generates the research foundation. A real analyst reviews, refines, and makes sure every insight is relevant to your business.
              </p>
              <Link
                href="/get-report"
                style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.95rem", padding: "13px 32px", borderRadius: "9999px", textDecoration: "none", letterSpacing: "0.02em" }}
              >
                Get My Report →
              </Link>
            </div>

            {/* Right column — includes */}
            <div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.72rem", fontWeight: 600, color: NAVY, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                What&rsquo;s Included
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                {MIR_INCLUDES.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: GRAY, lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "24px", padding: "16px 18px", backgroundColor: SAND, borderRadius: "10px", borderLeft: `3px solid ${TEAL}` }}>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.8rem", color: GRAY, lineHeight: 1.65 }}>
                  Every report includes a personal closing note from John Messina with his interpretation of the findings for your specific business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUNDLE STRIP ──────────────────────────────────────── */}
      <section style={{ backgroundColor: SAND, padding: "24px 24px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ backgroundColor: NAVY, borderRadius: "12px", padding: "28px 40px" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.68rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "20px", textAlign: "center" }}>
              Bundle and save
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0" }}>
              {BUNDLES.map((b, i) => (
                <div
                  key={b.name}
                  style={{
                    padding: "0 32px",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", fontWeight: 700, color: WHITE, marginBottom: "4px" }}>
                    {b.name}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginBottom: "10px", lineHeight: 1.5 }}>
                    {b.items}
                  </p>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.3rem", fontWeight: 700, color: WHITE }}>{b.price}</span>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.75rem", color: TEAL, fontWeight: 600, marginLeft: "8px" }}>{b.savings}</span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "18px" }}>
              Bundle pricing available on request.{" "}
              <Link href="/contact" style={{ color: TEAL, textDecoration: "underline" }}>Contact us to order.</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── 6-SERVICE GRID ────────────────────────────────────── */}
      <section style={{ backgroundColor: SAND, padding: "32px 24px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>
            More Services
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {GRID_SERVICES.map(svc => (
              <Link key={svc.name} href="/contact" style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    backgroundColor: WHITE,
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "24px 26px",
                    height: "100%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", fontWeight: 700, color: NAVY, lineHeight: 1.2, marginRight: "12px" }}>
                      {svc.name}
                    </h3>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "1rem", fontWeight: 700, color: NAVY }}>{svc.price}</div>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.72rem", color: LGRAY, marginTop: "2px" }}>{svc.turnaround}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.83rem", color: GRAY, lineHeight: 1.65 }}>
                    {svc.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section style={{ backgroundColor: WHITE, padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 700, color: NAVY, marginBottom: "16px", lineHeight: 1.3 }}>
            Not sure which service is right for you?
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.93rem", color: GRAY, lineHeight: 1.8, marginBottom: "32px" }}>
            Reach out — we are happy to talk through your situation and recommend the best fit.
          </p>
          <Link href="/contact" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>
            Contact John →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
