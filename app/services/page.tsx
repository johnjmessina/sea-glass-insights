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

// Bundle tooltip text keyed by bundle name
const BUNDLE_DETAILS: Record<string, string> = {
  "Starter Intelligence": "Starter Intelligence: MIR + Social Media Audit — $349 (save $49)",
  "Full Picture":         "Full Picture: MIR + Secret Shopping — $449 (save $49)",
  "Deep Intelligence":    "Deep Intelligence: Deep Dive + Social Media Audit — $549 (save $49)",
};

/** Teal pill badge with a CSS-only hover tooltip (no JS / "use client" needed). */
function BundleBadge({ name }: { name: keyof typeof BUNDLE_DETAILS }) {
  return (
    <div className="group relative inline-block">
      <span
        style={{
          display: "inline-block",
          backgroundColor: TEAL,
          color: NAVY,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.6rem",
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: "9999px",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          cursor: "default",
          userSelect: "none",
        }}
      >
        {name}
      </span>
      {/* Tooltip — appears on hover via Tailwind group-hover */}
      <div
        className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 pointer-events-none"
        style={{
          backgroundColor: NAVY,
          color: WHITE,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.72rem",
          padding: "8px 12px",
          borderRadius: "8px",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          lineHeight: 1.5,
        }}
      >
        {BUNDLE_DETAILS[name]}
        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "12px",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid ${NAVY}`,
          }}
        />
      </div>
    </div>
  );
}

const MIR_INCLUDES = [
  "Business Snapshot",
  "Customer Profile (3 segments)",
  "Competitive Landscape (up to 3 competitors)",
  "Market Positioning analysis",
  "Key Insights",
  "Actionable Recommendations",
  "Analyst note",
];

type GridSvc = {
  name: string;
  price: string;
  turnaround: string;
  desc: string;
  bundles: (keyof typeof BUNDLE_DETAILS)[];
  href: string;
};

const GRID_SERVICES: GridSvc[] = [
  {
    name: "Social Media Audit",
    price: "$199", turnaround: "48-72 hrs",
    desc: "A scored assessment of your social media presence across seven dimensions, from profile setup and content quality to engagement, brand consistency, and how you stack up against competitors.",
    bundles: ["Starter Intelligence", "Deep Intelligence"],
    href: "/services/social-media-audit",
  },
  {
    name: "Secret Shopping",
    price: "$299", turnaround: "5-7 days",
    desc: "A professional visit to your business, or a competitor's, scored across seven dimensions of the customer experience. You will see your business the way a first-time customer does.",
    bundles: ["Full Picture"],
    href: "/services/secret-shopping",
  },
  {
    name: "Deep Dive Report",
    price: "$399", turnaround: "5-7 days",
    desc: "Everything in the MIR, but deeper. Greater rigor, more sources, more context, more analyst time spent on what each finding actually means for your business.",
    bundles: ["Deep Intelligence"],
    href: "/services/deep-dive-report",
  },
  {
    name: "Synthetic Survey Report",
    price: "$399", turnaround: "48-72 hrs",
    desc: "AI-generated customer personas to pressure-test your assumptions and surface directional insight, with full transparency about the methodology.",
    bundles: [],
    href: "/services/synthetic-survey-report",
  },
  {
    name: "Voice of Customer Survey",
    price: "$499", turnaround: "1-2 weeks",
    desc: "Real feedback from your real customers. We design the survey, help you send it to your existing contact list, and deliver a visual analysis report.",
    bundles: [],
    href: "/services/voice-of-customer",
  },
  {
    name: "AI Starter Kit",
    price: "$99 / $79 add-on", turnaround: "48 hrs",
    desc: "Five to six custom AI prompts built specifically for your business type, ready to use immediately.",
    bundles: [],
    href: "/services/ai-starter-kit",
  },
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
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "540px", margin: "0 auto 12px", lineHeight: 1.8 }}>
          Professional market research for small businesses. AI generates the foundation. A real analyst reviews, refines, and makes sure the insights that reach you actually matter.
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.78rem", color: TEAL }}>
          Look for bundle tags on select services to save $49.
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
              position: "relative",
            }}
          >
            {/* Bundle badges — top right, stacked vertically */}
            <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
              <BundleBadge name="Starter Intelligence" />
              <BundleBadge name="Full Picture" />
            </div>

            {/* Left column */}
            <div style={{ paddingRight: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
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

      {/* ── 6-SERVICE GRID ────────────────────────────────────── */}
      <section style={{ backgroundColor: SAND, padding: "24px 24px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.4rem,2.5vw,1.8rem)", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>
            More Services
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px" }}>
            {GRID_SERVICES.map(svc => (
              <Link key={svc.name} href={svc.href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px 26px", height: "100%" }}>

                  {/* Name + price row — no absolute overlaps */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>
                      {svc.name}
                    </h3>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", fontWeight: 700, color: NAVY }}>{svc.price}</div>
                      <div style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.72rem", color: LGRAY, marginTop: "2px" }}>{svc.turnaround}</div>
                    </div>
                  </div>

                  {/* Bundle badges — inline flow, below name/price */}
                  {svc.bundles.length > 0 && (
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {svc.bundles.map(b => <BundleBadge key={b} name={b} />)}
                    </div>
                  )}

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
