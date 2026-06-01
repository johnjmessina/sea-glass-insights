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

const GRID_6 = [
  { name: "Social Media Audit",       price: "$199", turnaround: "48-72 hrs", desc: "A scored assessment of your social media presence across seven dimensions.",         href: "/services/social-media-audit" },
  { name: "Secret Shopping",          price: "$299", turnaround: "5-7 days",  desc: "See your business the way your customers do.",                              href: "/services/secret-shopping" },
  { name: "Deep Dive Report",         price: "$399", turnaround: "5-7 days",  desc: "Deeper competitive intelligence for businesses facing a major decision.",                                 href: "/services/deep-dive-report" },
  { name: "Synthetic Survey Report",  price: "$399", turnaround: "48-72 hrs", desc: "AI-generated customer personas to surface directional insight when you do not have a customer list.", href: "/services/synthetic-survey-report" },
  { name: "Voice of Customer Survey", price: "$499", turnaround: "1-2 weeks", desc: "Real feedback from your real customers, analyzed and delivered as a visual report.",                   href: "/services/voice-of-customer" },
  { name: "AI Starter Kit",           price: "$99 / $79 add-on", turnaround: "48 hrs", desc: "Custom AI prompts built specifically for your business type.",                                href: "/services/ai-starter-kit" },
];


export default function Home() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, color: NAVY }}>

      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "56px 24px 72px" }}>
        <img
          src="/logos/logo_transparent_FINAL.png"
          alt="Sea Glass Insights"
          style={{ maxWidth: "420px", width: "100%", height: "auto", margin: "0 auto 40px", display: "block" }}
        />
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            fontWeight: 700,
            color: NAVY,
            lineHeight: 1.2,
            maxWidth: "640px",
            margin: "0 auto 24px",
          }}
        >
          Know your market.<br />Refine your edge.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "clamp(0.92rem, 2vw, 1rem)",
            color: GRAY,
            maxWidth: "600px",
            margin: "0 auto 36px",
            lineHeight: 1.8,
          }}
        >
          Sea Glass Insights delivers professional market research and business intelligence for small businesses on the Jersey Shore and beyond. AI generates the foundation. A real analyst with over ten years of experience reviews, refines, and makes sure the insights that reach you actually matter.
        </p>
        <Link
          href="/services"
          style={{
            display: "inline-block",
            backgroundColor: TEAL,
            color: NAVY,
            fontFamily: "var(--font-montserrat)",
            fontWeight: 600,
            fontSize: "1rem",
            padding: "14px 40px",
            borderRadius: "9999px",
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          View Our Services
        </Link>
        <p style={{ fontFamily: "var(--font-montserrat)", color: LGRAY, fontSize: "0.83rem", marginTop: "16px" }}>
          Flat fee. No subscriptions. No retainers.
        </p>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ backgroundColor: WHITE, padding: "72px 24px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>
            What We Offer
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: LGRAY, textAlign: "center", marginBottom: "40px" }}>
            Seven research and intelligence services — all analyst-reviewed.
          </p>

          {/* MIR hero card */}
          <div style={{ border: `2px solid ${NAVY}`, borderRadius: "14px", padding: "36px 44px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center", backgroundColor: WHITE }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: "9999px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Most Popular
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 700, color: NAVY, marginBottom: "10px", lineHeight: 1.15 }}>
                Market Intelligence Report
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "14px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$199</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.8rem", color: LGRAY }}>48-72 hr delivery</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.8rem", color: LGRAY }}>Flat fee</span>
              </div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.9rem", color: GRAY, lineHeight: 1.75, marginBottom: "0" }}>
                Your market, your customers, your competitors in one professionally written report. AI generates the research foundation. A real analyst reviews, refines, and makes sure every insight is relevant to your business.
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Link href="/get-report" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none", whiteSpace: "nowrap" }}>
                Get My Report →
              </Link>
            </div>
          </div>

          {/* 6-service grid 2×3 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {GRID_6.map(svc => (
              <Link key={svc.name} href={svc.href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "22px 24px", height: "100%", backgroundColor: WHITE }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.15rem", fontWeight: 700, color: NAVY, lineHeight: 1.2, marginRight: "10px" }}>
                      {svc.name}
                    </h3>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.92rem", fontWeight: 700, color: NAVY }}>{svc.price}</div>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.71rem", color: LGRAY, marginTop: "2px" }}>{svc.turnaround}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: GRAY, lineHeight: 1.65 }}>{svc.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/services" style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", fontWeight: 600, color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              View all services →
            </Link>
          </div>
        </div>
      </section>


      <SiteFooter />
    </div>
  );
}
