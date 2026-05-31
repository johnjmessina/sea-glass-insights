import Link from "next/link";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-cormorant" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-montserrat" });

const SAND  = "#F4EADA";
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const GRAY  = "#6B7280";
const WHITE = "#FFFFFF";

export default function ContactPage() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: SAND, minHeight: "100vh" }}>

      {/* NAV */}
      <header style={{ backgroundColor: SAND, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, fontSize: "1.15rem", color: NAVY, textDecoration: "none" }}>
          Sea Glass Insights
        </Link>
        <Link href="/get-report" style={{ fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "none", border: `1.5px solid ${NAVY}`, padding: "8px 22px", borderRadius: "9999px" }}>
          Get Your Report
        </Link>
      </header>

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "72px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 700, color: WHITE, marginBottom: "20px" }}>
          Let&rsquo;s Talk
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "1rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8 }}>
          Not sure which service is right for you? Have a question about the process? Reach out — John is happy to help.
        </p>
      </section>

      {/* CONTACT INFO */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ backgroundColor: WHITE, borderRadius: "16px", border: "1px solid #E5E7EB", padding: "48px 40px" }}>
            <div style={{ width: "52px", height: "4px", backgroundColor: TEAL, borderRadius: "2px", margin: "0 auto 28px" }} />
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.8rem", fontWeight: 700, color: NAVY, marginBottom: "8px" }}>
              John Messina
            </h2>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.88rem", color: GRAY, marginBottom: "32px" }}>
              Founder, Sea Glass Insights
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.1rem" }}>✉</span>
                <a href="mailto:john@seaglassinsights.com" style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", color: TEAL, textDecoration: "none", fontWeight: 500 }}>
                  john@seaglassinsights.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.1rem" }}>🌐</span>
                <a href="https://seaglassinsights.com" style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", color: TEAL, textDecoration: "none", fontWeight: 500 }}>
                  seaglassinsights.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.1rem" }}>📍</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.95rem", color: GRAY }}>
                  Bradley Beach, NJ (serving the Jersey Shore & beyond)
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "32px", paddingTop: "28px" }}>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.85rem", color: GRAY, lineHeight: 1.7, marginBottom: "20px" }}>
                Ready to get your report? Start with the intake form — it takes about 15 minutes and gives me everything I need to get to work.
              </p>
              <Link href="/get-report" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: "var(--font-montserrat)", fontWeight: 600, fontSize: "0.9rem", padding: "12px 32px", borderRadius: "9999px", textDecoration: "none" }}>
                Start Your Report →
              </Link>
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.83rem", color: GRAY, marginTop: "24px", lineHeight: 1.7 }}>
            View our full{" "}
            <Link href="/services" style={{ color: NAVY, textDecoration: "underline" }}>service menu</Link>
            {" "}or read our{" "}
            <Link href="/privacy" style={{ color: NAVY, textDecoration: "underline" }}>privacy policy</Link>
            .
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: NAVY, color: "#93C5FD", textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.1rem", fontWeight: 600, color: WHITE, marginBottom: "8px" }}>
          Sea Glass Insights — Refining the Edge.
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
