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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "52px" }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.55rem", fontWeight: 700, color: NAVY, marginBottom: "18px", paddingBottom: "10px", borderBottom: `2px solid ${TEAL}` }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

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

      {/* CONTENT */}
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 24px 80px" }}>

        {/* Opening */}
        <div style={{ marginBottom: "52px" }}>
          <P>
            Sea Glass Insights specializes in market research and business intelligence for small businesses on the Jersey Shore and beyond. Great local businesses deserve the same quality of insight that large companies take for granted. We deliver exactly that: professional-grade research at accessible prices, from a market researcher who lives and works in this community.
          </P>
        </div>

        <Section title="What We Do">
          <P>
            We deliver professional market research reports, competitive intelligence, customer analysis, and business consulting to small business owners who deserve the same caliber of insight that large corporations invest heavily to access. Our work is built on real methodology, real expertise, and a genuine understanding of what it takes to compete as a local business.
          </P>
          <P>
            Every service we offer combines AI-powered research with hands-on analyst review. That combination lets us produce work that is faster and more affordable than traditional consulting firms, without sacrificing the judgment and expertise that make insights actually useful.
          </P>
        </Section>

        <Section title="The Jersey Shore Angle">
          <P>
            We are based in Bradley Beach, New Jersey, which means we understand the specific rhythms of a shore community business: the seasonal swings, the tourist economy, the year-round local base, and the pressure of competing in a market where word of mouth travels fast and reputation is everything. That local fluency is not something a national research firm can replicate. It is built into how we work.
          </P>
        </Section>

        <Section title="Hi, I&rsquo;m John Messina">
          <P>
            I started Sea Glass Insights because I have over ten years of market research experience and I wanted to put it to work for small businesses right here on the Jersey Shore.
          </P>
          <P>
            My background is in professional market research — studying markets, understanding customers, and translating data into decisions. I have done this work at scale, for organizations with real resources and real stakes. What I found is that the methodology that drives good research is not complicated or expensive. What has historically made it inaccessible is the overhead of traditional consulting.
          </P>
          <P>
            AI made it possible to close that gap. The research expertise I have spent over a decade developing can now be delivered faster and at a price point that actually works for small businesses, without compromising the analytical rigor that makes the work worth doing.
          </P>
          <P>
            Every report that leaves Sea Glass Insights has my name on it. I review every submission personally. I edit every section. I add my own interpretation of what the findings mean for your specific business. The AI generates the foundation. I make sure it is worth your time.
          </P>
        </Section>

        <Section title="What I Believe">
          <P>
            Every small business has an edge. Sometimes it is obvious. Sometimes it is buried in a Google review, hiding in plain sight. Sometimes it is a positioning opportunity that no competitor has claimed yet. My job is to help you find your edge and give you the tools you need to refine it.
          </P>
        </Section>

        {/* CTA */}
        <div
          style={{
            backgroundColor: SAND,
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>
            Ready to find your edge?
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/services"
              style={{ display: "inline-block", backgroundColor: NAVY, color: WHITE, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none" }}
            >
              View Services
            </Link>
            <Link
              href="/contact"
              style={{ display: "inline-block", border: `1.5px solid ${NAVY}`, color: NAVY, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none" }}
            >
              Get in Touch
            </Link>
          </div>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
