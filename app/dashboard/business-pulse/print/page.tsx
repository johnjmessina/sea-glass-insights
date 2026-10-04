// Dedicated print/PDF render page — no nav, no dashboard UI.
// Puppeteer navigates here and calls page.pdf() to generate the final PDF.
// Also usable directly in a browser for in-browser printing.

import type { Metadata } from "next";
import QRCode from "qrcode";

export const metadata: Metadata = { robots: "noindex" };

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const CREAM = "#F4EADA";
const WHITE = "#FFFFFF";

interface Obs { label: string; title: string; body: string }
interface CardData {
  businessName: string;
  location:     string;
  introText?:   string;
  obs:          [Obs, Obs, Obs];
  ctaPrice:     string;
  analystName:  string;
  phone:        string;
  email:        string;
  website:      string;
}

const FALLBACK: CardData = {
  businessName: "Your Business",
  location:     "",
  obs: [
    { label: "Observation One",   title: "Your first insight goes here.",   body: "Body text for the first observation." },
    { label: "Observation Two",   title: "Your second insight goes here.",  body: "Body text for the second observation." },
    { label: "Observation Three", title: "Your third insight goes here.",   body: "Body text for the third observation." },
  ],
  ctaPrice:    "$199",
  analystName: "John Messina",
  phone:       "(732) 518-3898",
  email:       "john@seaglassinsights.com",
  website:     "seaglassinsights.com",
};

const BACK_SERVICES = [
  {
    name: "Market Intelligence Report", price: "$199",
    checklist: ["Business Snapshot", "Customer Profile (3 segments)", "Competitive Landscape (up to 3 competitors)", "Market Positioning analysis", "Key Insights", "Actionable Recommendations"],
  },
  {
    name: "Social Media Audit", price: "$199",
    checklist: ["Profile and Setup review", "Content Quality and Engagement scoring", "Brand Consistency evaluation", "Competitive Social Comparison"],
  },
  {
    name: "Secret Shopping", price: "$299",
    checklist: ["In-person visit by trained researcher", "Scored across 7 experience dimensions", "Narrative notes and Analyst Observations", "Formatted deliverable report"],
  },
  {
    name: "Deep Dive Report", price: "$399",
    checklist: ["Everything in the MIR, but deeper", "Greater competitive rigor per competitor", "Expanded customer segments", "Priority action framework"],
  },
  {
    name: "Synthetic Customer Profiles", price: "$399",
    checklist: ["AI-generated customer personas", "3-5 customer type responses", "Thematic analysis and recommendations", "Full methodology disclosure"],
  },
  {
    name: "Voice of Customer Survey", price: "$499",
    checklist: ["Custom survey design (up to 10 questions)", "Response collection and analysis", "Visual report with findings and themes", "Requires existing customer contact list"],
  },
  {
    name: "AI Starter Kit", price: "$99 / $79 add-on",
    checklist: ["5-6 custom prompts for your business type", "Ready for ChatGPT, Claude, or any AI tool", "Marketing copy, responses, social captions", "One round of revisions included"],
  },
];

// SVG logo-mark (overlapping circles + line chart, matches v4 design)
function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="17" r="10" fill="#00CED1" fillOpacity="0.45"/>
      <circle cx="23" cy="14" r="9" fill="#1a5c8a" fillOpacity="0.65"/>
      <circle cx="20" cy="24" r="8" fill="#00CED1" fillOpacity="0.3"/>
      <path d="M7 30 L31 30" stroke="#00CED1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.35"/>
      <path d="M11 30 L15 23 L19 27 L23 19 L28 22" stroke="#F4EADA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
    </svg>
  );
}

function SvgCheck({ size = 8, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "1px" }}>
      <path d="M1 4L3 6L7 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default async function BusinessPulsePrintPage(
  props: { searchParams: Promise<Record<string, string>> }
) {
  const searchParams = await props.searchParams;
  let card: CardData = FALLBACK;
  try {
    if (searchParams.data) {
      card = JSON.parse(decodeURIComponent(searchParams.data)) as CardData;
    }
  } catch {
    // use fallback
  }

  const CG = "'Cormorant Garamond', Georgia, serif";
  const MT = "'Montserrat', sans-serif";

  const qrDataUrl = await QRCode.toDataURL("https://www.seaglassinsights.com", {
    width: 64, margin: 1,
    color: { dark: "#0A2F61", light: "#FFFFFF" },
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { background: #fff; }

          @page {
            size: 4in 6in;
            margin: 0;
          }

          /* ── Front card — page 1 ── */
          .card-front {
            width: 4in;
            height: 6in;
            background: ${NAVY};
            overflow: hidden;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            break-after: page;
          }

          /* ── Back card — page 2 ── */
          .card-back {
            width: 4in;
            height: 6in;
            background: ${WHITE};
            overflow: hidden;
          }

          /* Print: ensure no extra margins, show both pages */
          @media print {
            html, body { width: 4in; height: 12in; margin: 0; }
          }
        `}</style>
      </head>
      <body>

        {/* ────────────── FRONT ────────────── */}
        <div className="card-front">

          {/* Brand bar at very top */}
          <div style={{
            padding: "14px 22px 10px",
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: MT,
              fontSize: "6.5px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontVariant: "small-caps",
              color: TEAL,
              marginBottom: "7px",
              fontWeight: 600,
            }}>
              Sea Glass Insights
            </div>
            {/* Thin TEAL rule */}
            <div style={{ height: "0.75px", background: TEAL, opacity: 0.6, marginBottom: "14px" }} />

            {/* Headline block */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{
                  fontFamily: CG,
                  fontSize: "21px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: CREAM,
                  lineHeight: 1.2,
                  marginBottom: "5px",
                }}>
                  We looked at<br />
                  <span style={{ fontWeight: 600 }}>{card.businessName || "Your Business"}.</span>
                </div>
                <div style={{
                  fontFamily: MT,
                  fontSize: "7.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: TEAL,
                  fontWeight: 500,
                }}>
                  Here&apos;s what we found.
                </div>
              </div>
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                <LogoMark />
              </div>
            </div>
          </div>

          {/* Observations — flex-grow to fill remaining height before footer */}
          <div style={{ flex: 1, padding: "8px 22px 6px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
            {card.obs.map((obs, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* Separator line above (except first) */}
                {i > 0 && (
                  <div style={{ height: "0.5px", background: TEAL, opacity: 0.25, marginBottom: "9px" }} />
                )}
                <div style={{ display: "flex", gap: "10px", paddingBottom: i < 2 ? "9px" : 0 }}>
                  {/* Ghost number */}
                  <div style={{
                    fontFamily: CG,
                    fontSize: "36px",
                    fontWeight: 700,
                    color: `rgba(0,206,209,0.13)`,
                    lineHeight: 1,
                    flexShrink: 0,
                    width: "24px",
                    marginTop: "-4px",
                    userSelect: "none",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    {obs.label && (
                      <div style={{
                        fontFamily: MT,
                        fontSize: "6px",
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: TEAL,
                        marginBottom: "3px",
                        fontWeight: 600,
                      }}>
                        {obs.label}
                      </div>
                    )}
                    <div style={{
                      fontFamily: CG,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: CREAM,
                      lineHeight: 1.25,
                      marginBottom: "4px",
                    }}>
                      {obs.title || `Observation ${i + 1}`}
                    </div>
                    {obs.body && (
                      <div style={{
                        fontFamily: MT,
                        fontSize: "7.5px",
                        fontWeight: 300,
                        color: `rgba(255,255,255,0.62)`,
                        lineHeight: 1.6,
                      }}>
                        {obs.body}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Teal footer bar */}
          <div style={{
            background: TEAL,
            padding: "10px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <LogoMark />
              <div style={{
                fontFamily: MT,
                fontSize: "7px",
                fontWeight: 500,
                color: NAVY,
                lineHeight: 1.4,
                maxWidth: "200px",
              }}>
                Ready for the full picture? Ask about our <strong>Market Intelligence Report.</strong>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: MT, fontSize: "16px", fontWeight: 600, color: NAVY, lineHeight: 1 }}>
                {card.ctaPrice}
              </div>
              <div style={{ fontFamily: MT, fontSize: "5.5px", color: `rgba(10,47,97,0.55)`, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>
                Flat fee · 48–72 hrs
              </div>
            </div>
          </div>
        </div>

        {/* ────────────── BACK — white ────────────── */}
        <div className="card-back" style={{ padding: "16px 20px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* TOP — logo + headline, centered */}
          <div style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo_transparent_FINAL.png"
              alt="Sea Glass Insights"
              style={{ width: "150px", height: "auto", display: "block", margin: "0 auto 8px" }}
            />
            <div style={{ fontFamily: CG, fontSize: "13px", fontStyle: "italic", fontWeight: 600, color: NAVY, lineHeight: 1.3, marginBottom: "7px" }}>
              Know your market. Refine your edge.
            </div>
            {/* Thin TEAL rule */}
            <div style={{ height: "0.75px", background: TEAL, opacity: 0.55, marginBottom: "0" }} />
          </div>

          {/* MIR HERO — full-width featured card */}
          <div style={{
            borderLeft: `2.5px solid ${NAVY}`,
            backgroundColor: `rgba(10,47,97,0.04)`,
            borderRadius: "2px",
            padding: "8px 10px",
          }}>
            <div style={{ fontFamily: MT, fontSize: "5.5px", fontWeight: 700, color: `rgba(10,47,97,0.5)`, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "3px" }}>
              Most Popular
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
              <span style={{ fontFamily: CG, fontSize: "13px", fontWeight: 700, color: NAVY }}>Market Intelligence Report</span>
              <span style={{ fontFamily: MT, fontSize: "10px", fontWeight: 700, color: NAVY, flexShrink: 0, marginLeft: "8px" }}>$199</span>
            </div>
            <div style={{ fontFamily: MT, fontSize: "5.5px", color: `rgba(10,47,97,0.5)`, marginBottom: "5px" }}>
              48-72 hr delivery · Flat fee
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 8px" }}>
              {BACK_SERVICES[0].checklist.map(item => (
                <div key={item} style={{ display: "flex", gap: "3px", alignItems: "flex-start", marginBottom: "2px" }}>
                  <SvgCheck size={7} color={TEAL} />
                  <span style={{ fontFamily: MT, fontSize: "6px", fontWeight: 400, color: NAVY, opacity: 0.72, lineHeight: 1.35 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6-SERVICE COMPACT GRID — 2×3 with checklists */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
            {BACK_SERVICES.slice(1).map(svc => (
              <div key={svc.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                  <span style={{ fontFamily: MT, fontSize: "6.5px", fontWeight: 600, color: NAVY }}>{svc.name}</span>
                  <span style={{ fontFamily: MT, fontSize: "6px", fontWeight: 700, color: NAVY, flexShrink: 0, marginLeft: "4px" }}>{svc.price}</span>
                </div>
                {svc.checklist.map(item => (
                  <div key={item} style={{ display: "flex", gap: "3px", alignItems: "flex-start", marginBottom: "1.5px" }}>
                    <SvgCheck size={6} color={TEAL} />
                    <span style={{ fontFamily: MT, fontSize: "5.5px", fontWeight: 300, color: NAVY, opacity: 0.65, lineHeight: 1.35 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* BOTTOM — contact (left) + QR (right), pinned to bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
            <div style={{ fontFamily: MT, fontSize: "6px", fontWeight: 300, color: NAVY, lineHeight: 1.7, opacity: 0.72 }}>
              <div style={{ fontFamily: CG, fontSize: "9px", fontWeight: 600, color: NAVY, opacity: 1, marginBottom: "2px" }}>{card.analystName}</div>
              {card.phone && <div>{card.phone}</div>}
              <div>{card.email}</div>
              <div>{card.website}</div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR code — seaglassinsights.com" width={48} height={48} style={{ display: "block", marginBottom: "3px" }} />
              <div style={{ fontFamily: MT, fontSize: "5.5px", color: NAVY, opacity: 0.45, letterSpacing: "0.05em" }}>
                Scan to get started
              </div>
            </div>
          </div>

        </div>

      </body>
    </html>
  );
}
