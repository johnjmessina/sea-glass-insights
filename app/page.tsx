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

const HOME_SERVICES = [
  { name: "Market Intelligence Report", price: "$199", desc: "Your market, your customers, your competitors in one professionally written report.", href: "/mir" },
  { name: "Social Media Audit",          price: "$199", desc: "A scored assessment of your social media presence across seven dimensions.",         href: "/services" },
  { name: "Secret Shopping",             price: "$299", desc: "See your business the way a first-time customer does.",                              href: "/services" },
  { name: "Deep Dive Report",            price: "$399", desc: "Deeper competitive intelligence for businesses facing a major decision.",             href: "/services" },
  { name: "Synthetic Survey Report",     price: "$399", desc: "AI-generated customer personas to surface directional insight when you don't have a customer list.", href: "/services" },
  { name: "Voice of Customer Survey",    price: "$499", desc: "Real feedback from your real customers, analyzed and delivered as a visual report.", href: "/services" },
  { name: "AI Starter Kit",              price: "$99",  desc: "Custom AI prompts built specifically for your business type.",                       href: "/services" },
];

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Tell Us About Your Business",
    body: "Answer 10 focused questions about your market, customers, and competitors. It takes about 15 minutes. The more detail you share, the sharper your report will be. Please only share what you are comfortable sharing — your responses will be used to generate your report with the assistance of AI.",
  },
  {
    num: "2",
    title: "A Real Analyst Gets to Work",
    body: "I personally review every submission. I dig into your market, your competitors, and your positioning, combining professional research methodology with AI intelligence to build something genuinely useful.",
  },
  {
    num: "3",
    title: "Your Report Arrives",
    body: "A professionally written report lands in your inbox within 48-72 hours. Six sections, four recommendations, and insights you can act on immediately.",
  },
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
          Know your market. Refine your edge.
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

      {/* ── SERVICES GRID ── */}
      <section style={{ backgroundColor: WHITE, padding: "72px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            What We Offer
          </h2>
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "0.88rem",
              color: LGRAY,
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            Seven research and intelligence services — all analyst-reviewed.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "36px",
            }}
          >
            {HOME_SERVICES.map(svc => (
              <Link
                key={svc.name}
                href={svc.href}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "22px 20px",
                    height: "100%",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: NAVY,
                        lineHeight: 1.25,
                        marginRight: "12px",
                      }}
                    >
                      {svc.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: "var(--font-montserrat)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: NAVY,
                        flexShrink: 0,
                      }}
                    >
                      {svc.price}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "0.82rem",
                      color: GRAY,
                      lineHeight: 1.65,
                    }}
                  >
                    {svc.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              href="/services"
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: NAVY,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {HOW_IT_WORKS.map(({ num, title, body }) => (
              <div key={num} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: NAVY,
                    color: WHITE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    margin: "0 auto 20px",
                  }}
                >
                  {num}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    color: NAVY,
                    marginBottom: "12px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    color: GRAY,
                    fontSize: "0.88rem",
                    lineHeight: 1.8,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section style={{ backgroundColor: WHITE, textAlign: "center", padding: "88px 24px" }}>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700,
            color: NAVY,
            maxWidth: "600px",
            margin: "0 auto 36px",
            lineHeight: 1.3,
          }}
        >
          Every small business has an edge. Let&rsquo;s refine yours.
        </h2>
        <Link
          href="/get-report"
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
          Start Your Report
        </Link>
        <p style={{ fontFamily: "var(--font-montserrat)", color: LGRAY, fontSize: "0.83rem", marginTop: "16px" }}>
          $199. Flat fee. No subscriptions required.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
