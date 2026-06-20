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

const SECTIONS = [
  { title: "Business Snapshot",      desc: "A clear-eyed summary of who you are and what you offer." },
  { title: "Customer Profile",       desc: "3 distinct customer segments with motivations and key needs." },
  { title: "Competitive Landscape",  desc: "An honest look at up to 3 competitors and where you have the edge." },
  { title: "Market Positioning",     desc: "Your strengths, vulnerabilities, and how to play to both." },
  { title: "Key Insights",           desc: "4-5 analyst insights — the so-what that most businesses miss." },
  { title: "Recommendations",        desc: "Exactly 4 actions, ranked by impact and feasibility." },
];

export default function MIRPage() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, color: NAVY }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, padding: "64px 24px 72px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Our Most Popular Service
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Market Intelligence Report
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "32px" }}>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$199</span>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <Link
          href="/get-report"
          style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}
        >
          Start Your Report
        </Link>
      </section>

      {/* WHAT'S INSIDE */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "48px" }}>
            What&rsquo;s Inside Your Report
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {SECTIONS.map(({ title, desc }) => (
              <div key={title} style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "28px 24px" }}>
                <div style={{ width: "4px", height: "24px", backgroundColor: TEAL, borderRadius: "2px", marginBottom: "14px" }} />
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", fontWeight: 600, color: NAVY, marginBottom: "8px" }}>{title}</h3>
                <p style={{ fontFamily: "var(--font-montserrat)", color: GRAY, fontSize: "0.87rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT MAKES IT DIFFERENT */}
      <section style={{ backgroundColor: SAND, padding: "72px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 700, color: NAVY, marginBottom: "20px" }}>
            What Makes It Different
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", color: GRAY, lineHeight: 1.85, marginBottom: "36px" }}>
            Every MIR is reviewed by a professional market researcher with over ten years of experience. AI generates the research foundation. I make sure every insight is accurate, relevant, and worth your time.
          </p>
          <Link
            href="/get-report"
            style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}
          >
            Start Your Report
          </Link>
          <p style={{ fontFamily: "var(--font-montserrat)", color: LGRAY, fontSize: "0.82rem", marginTop: "14px" }}>
            $199. Flat fee. Delivered in 48-72 hours.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "56px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {[
              {
                num: "1",
                title: "Tell Us About Your Business",
                body: "Answer a short intake form about your market, customers, and goals. Takes about 15 minutes. Please only share what you are comfortable sharing publicly. Your responses will be used to generate your report with the assistance of AI.",
              },
              {
                num: "2",
                title: "A Real Analyst Gets to Work",
                body: "We personally review every submission, combining professional research experience and methodology with AI intelligence to provide something tailored to your business.",
              },
              {
                num: "3",
                title: "Your Report Arrives",
                body: "A professionally written report lands in your inbox within the promised timeframe. Insights you can act on immediately.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} style={{ textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 700, margin: "0 auto 20px" }}>
                  {num}
                </div>
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 600, color: NAVY, marginBottom: "12px" }}>{title}</h3>
                <p style={{ fontFamily: "var(--font-montserrat)", color: GRAY, fontSize: "0.88rem", lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE MORE */}
      <section style={{ backgroundColor: WHITE, padding: "64px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", color: GRAY, marginBottom: "12px" }}>
          Looking for something deeper or more specific?
        </p>
        <Link href="/services" style={{ fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          View all services →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
