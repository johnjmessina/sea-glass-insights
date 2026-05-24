import Link from "next/link";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

const SAND  = "#FDF5E6";
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const GRAY  = "#6B7280";
const LGRAY = "#9CA3AF";
const WHITE = "#FFFFFF";

export default function Home() {
  return (
    <div
      className={`${cormorant.variable} ${montserrat.variable}`}
      style={{ backgroundColor: SAND, color: NAVY }}
    >

      {/* ── 1. NAV ── */}
      <header
        style={{
          backgroundColor: SAND,
          padding: "20px 40px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Link
          href="/get-report"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: NAVY,
            textDecoration: "none",
            border: `1.5px solid ${NAVY}`,
            padding: "8px 22px",
            borderRadius: "9999px",
            letterSpacing: "0.02em",
          }}
        >
          Get Your Report
        </Link>
      </header>

      {/* ── 2. HERO ── */}
      <section
        style={{
          backgroundColor: SAND,
          textAlign: "center",
          padding: "48px 24px 80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo_sand.png"
          alt="Sea Glass Insights"
          style={{
            maxWidth: "480px",
            width: "100%",
            height: "auto",
            margin: "0 auto 40px",
            display: "block",
          }}
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
            fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
            color: GRAY,
            maxWidth: "580px",
            margin: "0 auto 36px",
            lineHeight: 1.75,
          }}
        >
          Sea Glass Insights delivers professional market research reports for
          small businesses, written by a real analyst, informed by real
          experience, and built to actually move the needle.
        </p>
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
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            color: LGRAY,
            fontSize: "0.85rem",
            marginTop: "16px",
          }}
        >
          $149. Flat fee. No subscriptions required.
        </p>
      </section>

      {/* ── 3. ABOUT ── */}
      <section
        style={{
          backgroundColor: WHITE,
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 700,
              color: NAVY,
              marginBottom: "28px",
            }}
          >
            Hi, I&rsquo;m John Messina.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              color: GRAY,
              fontSize: "0.97rem",
              lineHeight: 1.85,
              marginBottom: "20px",
            }}
          >
            I started Sea Glass Insights because I have over ten years of market
            research experience and I wanted to put it to work for small
            businesses right here on the Jersey Shore. I believe every small
            business has an edge and I want to help you refine it.
          </p>
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              color: GRAY,
              fontSize: "0.97rem",
              lineHeight: 1.85,
            }}
          >
            When your order comes in, I read every word you submitted. I combine
            professional research methodology with AI intelligence to build a
            report that is factual, grounded, and built for where your business
            actually is right now. Every AI output is reviewed and vetted before
            it reaches you.
          </p>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "40px",
            }}
          >
            {[
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
            ].map(({ num, title, body }) => (
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
                    fontSize: "1.35rem",
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
                    fontSize: "0.9rem",
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

      {/* ── 5. WHAT'S INSIDE ── */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 700,
              color: NAVY,
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            What&rsquo;s Inside Your Report
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                title: "Business Snapshot",
                desc: "A clear-eyed summary of who you are and what you offer.",
              },
              {
                title: "Customer Profile",
                desc: "3-4 distinct customer segments with motivations and spend patterns.",
              },
              {
                title: "Competitive Landscape",
                desc: "An honest look at your competitors and where you have the edge.",
              },
              {
                title: "Market Positioning",
                desc: "Your strengths, vulnerabilities, and how to play to both.",
              },
              {
                title: "Key Insights",
                desc: "4-5 analyst insights, the so what that most businesses miss.",
              },
              {
                title: "Recommendations",
                desc: "Exactly 4 actions, ranked by impact and feasibility.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "28px 24px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "24px",
                    backgroundColor: TEAL,
                    borderRadius: "2px",
                    marginBottom: "14px",
                  }}
                />
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    color: NAVY,
                    marginBottom: "8px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    color: GRAY,
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CLOSING CTA ── */}
      <section
        style={{
          backgroundColor: SAND,
          textAlign: "center",
          padding: "88px 24px",
        }}
      >
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
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            color: LGRAY,
            fontSize: "0.85rem",
            marginTop: "16px",
          }}
        >
          $149. Flat fee. No subscriptions required.
        </p>
      </section>

      {/* ── 7. FOOTER ── */}
      <footer
        style={{
          backgroundColor: NAVY,
          color: "#93C5FD",
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: WHITE,
            marginBottom: "8px",
          }}
        >
          Sea Glass Insights — Refining the Edge.
        </p>
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "0.82rem",
            marginBottom: "6px",
          }}
        >
          John Messina, Founder | Bradley Beach, NJ | seaglassinsights.com
        </p>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "0.82rem" }}>
          &copy; 2026 Sea Glass Insights. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
