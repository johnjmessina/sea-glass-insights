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
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "56px 24px 72px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo_transparent_FINAL.png"
          alt="Sea Glass Insights"
          style={{ maxWidth: "420px", width: "100%", height: "auto", display: "block", margin: "0 auto 40px" }}
        />
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto" }}>
          Market research built locally, for local small businesses. Analyst-reviewed and priced to be accessible.
        </p>
      </section>

      {/* PHOTO + TEXT — two columns on desktop, stacked on mobile */}
      <section style={{ maxWidth: "1040px", margin: "0 auto", padding: "56px 24px 0" }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "52px",
          alignItems: "flex-start",
        }}>

          {/* Text — left column on desktop, appears first on mobile */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <P>
              Hi, I&rsquo;m John Messina. I have spent the last ten years as a market research professional, working with large organizations to study markets, understand customers, and turn data into decisions. I started Sea Glass Insights to bring that same level of research to local small businesses, at a price point built for small business.
            </P>
            <P>
              I grew up vacationing on the Jersey Shore and eventually made it my home. I want to play a role in keeping it the kind of place people love to come back to. The small businesses here are what make these towns worth visiting, and I believe they deserve the same quality of research and intelligence that large companies invest in.
            </P>
            <P>
              I offer research services focused on what small businesses actually need to know about their customers, their competition, and their market. What makes this work is knowing how to ask the right questions. AI is only as good as the direction you give it. With over ten years of research experience, I know how to ask the right questions, frame the right problems, and make sure what comes back is actually useful for your business. The findings you receive are not generic. They are built around you. My goal is to be a genuine asset, not just another vendor.
            </P>
            <P>
              Based in Bradley Beach, we work with small businesses across the Jersey Shore and beyond. I live and work in the same community you do. That local knowledge is part of what you get.
            </P>
            <P>
              Every small business has an edge. Let&rsquo;s refine yours.
            </P>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.95rem", lineHeight: 1.85, marginBottom: "18px" }}>
              <Link href="/contact" style={{ color: TEAL, textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Whether you know exactly what you need or are not sure where to start, I am happy to talk it through.
              </Link>
            </p>
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

            {/* Blog teaser */}
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.78rem",
              color: NAVY,
              opacity: 0.55,
              marginTop: "14px",
              textAlign: "right",
              letterSpacing: "0.01em",
            }}>
              Bloggin&rsquo; about Bradley. Coming soon →
            </p>
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
