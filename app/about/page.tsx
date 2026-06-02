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
const WHITE = "#FFFFFF";

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.95rem", color: GRAY, lineHeight: 1.85, marginBottom: "18px" }}>
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`} style={{ backgroundColor: WHITE, color: NAVY }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "72px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto" }}>
          Local market research for local small businesses.
        </h1>
      </section>

      {/* PHOTO + TEXT — two columns on desktop, stacked on mobile */}
      <section style={{ maxWidth: "1040px", margin: "0 auto", padding: "72px 24px 0" }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "52px",
          alignItems: "flex-start",
        }}>

          {/* Text — left column on desktop, appears first on mobile */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <P>
              Hi, I&rsquo;m John Messina. I started Sea Glass Insights because I have over ten years of market research experience and I wanted to put it to work for small businesses right here on the Jersey Shore.
            </P>
            <P>
              Sea Glass Insights delivers professional market research reports, competitive intelligence, and customer analysis to small business owners on the Jersey Shore and beyond. We are based in Bradley Beach, New Jersey, which means we understand the specific rhythms of a shore community business: the seasonal swings, the tourist economy, the year-round local base, and the pressure of competing in a market where word of mouth travels fast and reputation is everything.
            </P>
            <P>
              My background is in professional market research — studying markets, understanding customers, and translating data into decisions. I have done this work at scale, for organizations with real resources and real stakes. AI made it possible to deliver that same quality of work faster and at a price point that actually works for small businesses. Every report that leaves Sea Glass Insights has my name on it. I review every submission personally. The AI generates the foundation. I make sure it is worth your time.
            </P>
            <P>
              Every small business has an edge. Sometimes it is obvious. Sometimes it is buried in a Google review, hiding in plain sight. Sometimes it is a positioning opportunity that no competitor has claimed yet. My job is to help you find it.
            </P>
          </div>

          {/* Photo — right column on desktop, appears below text on mobile */}
          <div style={{ flexShrink: 0, width: "360px", maxWidth: "100%" }}>
            <div style={{
              height: "440px",
              overflow: "hidden",
              borderRadius: "12px",
              // Subtle shadow to lift it off the white background
              boxShadow: "0 4px 24px rgba(10,47,97,0.10)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/john-beach.jpeg"
                alt="John Messina on Bradley Beach, NJ"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  // Anchors to the top so the crop shows sky → ocean → head → torso (waist-up)
                  objectPosition: "center top",
                  display: "block",
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 24px 80px" }}>
        <div style={{ backgroundColor: SAND, borderRadius: "16px", padding: "40px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>
            Ready to find your edge?
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/services"
              style={{ display: "inline-block", backgroundColor: NAVY, color: WHITE, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none" }}
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              style={{ display: "inline-block", border: `1.5px solid ${NAVY}`, color: NAVY, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none" }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
