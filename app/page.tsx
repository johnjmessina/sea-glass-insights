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
  { name: "Market Intelligence Report",  href: "/get-report" },
  { name: "Social Media Audit",          href: "/services/social-media-audit" },
  { name: "Secret Shopping",             href: "/services/secret-shopping" },
  { name: "Deep Dive Report",            href: "/services/deep-dive-report" },
  { name: "Synthetic Survey Report",     href: "/services/synthetic-survey-report" },
  { name: "Voice of Customer Survey",    href: "/services/voice-of-customer" },
];


export default function Home() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, color: NAVY }}>

      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 18px" }}>
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
            margin: "0 auto 16px",
            lineHeight: 1.8,
          }}
        >
          Sea Glass Insights delivers professional market research and business intelligence for small businesses on the Jersey Shore and beyond. AI generates the foundation. A market research professional refines it into something you can actually use.
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", color: LGRAY, fontSize: "0.83rem" }}>
          Flat fee. No subscriptions. No retainers.
        </p>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ backgroundColor: SAND, padding: "18px 24px 36px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            {SERVICES.map(svc => (
              <Link key={svc.name} href={svc.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "1px solid #E5E7EB", borderRadius: "10px", backgroundColor: WHITE, textDecoration: "none" }}>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", fontWeight: 600, color: NAVY }}>{svc.name}</span>
                <span style={{ color: TEAL, fontSize: "0.9rem", marginLeft: "8px", flexShrink: 0 }}>→</span>
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
