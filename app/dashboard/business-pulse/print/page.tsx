// Dedicated print/PDF render page — no nav, no dashboard UI.
// Puppeteer navigates here and calls page.pdf() to generate the final PDF.
// Also usable directly in a browser for in-browser printing.

import type { Metadata } from "next";

export const metadata: Metadata = { robots: "noindex" };

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const SAND  = "#F4EADA";
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
  { name: "Market Intelligence Report", price: "$199" },
  { name: "Social Media Audit",         price: "$199" },
  { name: "Secret Shopping",            price: "$299" },
  { name: "Deep Dive Report",           price: "$399" },
  { name: "Voice of Customer Survey",   price: "$499" },
  { name: "AI Starter Kit",             price: "$99"  },
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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap"
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
            background: ${SAND};
            overflow: hidden;
            display: flex;
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

          {/* Header */}
          <div style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: MT, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: TEAL, marginBottom: "7px" }}>
                Business Pulse
              </div>
              <div style={{ fontFamily: CG, fontSize: "19px", fontWeight: 700, color: WHITE, lineHeight: 1.15 }}>
                Three things we<br />noticed about<br />
                <span style={{ color: TEAL }}>{card.businessName || "Your Business"}</span>
              </div>
              {card.location && (
                <div style={{ fontFamily: MT, fontSize: "7px", color: "rgba(255,255,255,0.35)", marginTop: "5px", letterSpacing: "0.1em" }}>
                  {card.location}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
              <LogoMark />
            </div>
          </div>

          {/* Observations — flex-grow to fill remaining height before footer */}
          <div style={{ flex: 1, padding: "10px 22px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
            {card.obs.map((obs, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  paddingBottom: i < 2 ? "10px" : 0,
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                {/* Ghost number */}
                <div style={{ fontFamily: CG, fontSize: "28px", fontWeight: 700, color: "rgba(0,206,209,0.15)", lineHeight: 1, flexShrink: 0, width: "22px", marginTop: "-3px" }}>
                  {i + 1}
                </div>
                <div>
                  {obs.label && (
                    <div style={{ fontFamily: MT, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: TEAL, marginBottom: "4px" }}>
                      {obs.label}
                    </div>
                  )}
                  <div style={{ fontFamily: CG, fontSize: "13px", fontWeight: 700, color: SAND, lineHeight: 1.25, marginBottom: "4px" }}>
                    {obs.title || `Observation ${i + 1}`}
                  </div>
                  {obs.body && (
                    <div style={{ fontFamily: MT, fontSize: "8.5px", fontWeight: 300, color: "rgba(244,234,218,0.55)", lineHeight: 1.65 }}>
                      {obs.body}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Teal footer */}
          <div style={{
            background: TEAL,
            padding: "12px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: MT, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(10,47,97,0.6)", marginBottom: "3px" }}>
                Want the full picture?
              </div>
              <div style={{ fontFamily: CG, fontSize: "11px", fontWeight: 700, color: NAVY }}>
                Market Intelligence Report
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MT, fontSize: "18px", fontWeight: 600, color: NAVY, lineHeight: 1 }}>
                {card.ctaPrice}
              </div>
              <div style={{ fontFamily: MT, fontSize: "6.5px", color: "rgba(10,47,97,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>
                Flat fee · 48–72 hrs
              </div>
            </div>
          </div>
        </div>

        {/* ────────────── BACK ────────────── */}
        <div className="card-back">

          {/* Navy left panel */}
          <div style={{
            background: NAVY,
            width: "38%",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 14px",
          }}>
            <div style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/logo_negative_transparent.png"
                alt="Sea Glass Insights"
                style={{ width: "90px", height: "auto", marginBottom: "10px" }}
              />
            </div>
            <div style={{ fontFamily: MT, fontSize: "8px", fontWeight: 300, color: "rgba(244,234,218,0.5)", lineHeight: 1.9, textAlign: "center" }}>
              <div style={{ fontFamily: CG, fontSize: "11px", fontWeight: 700, color: WHITE, marginBottom: "8px" }}>
                {card.analystName}
              </div>
              {card.phone && <div>{card.phone}</div>}
              <div style={{ color: TEAL }}>{card.email}</div>
              <div style={{ color: TEAL }}>{card.website}</div>
            </div>
          </div>

          {/* Cream right panel */}
          <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: MT, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: NAVY, opacity: 0.45, marginBottom: "8px" }}>
              What we offer
            </div>
            <div style={{ fontFamily: CG, fontSize: "13px", fontWeight: 700, color: NAVY, lineHeight: 1.25, marginBottom: "8px" }}>
              Professional research. Real analyst. Flat fee.
            </div>
            <div style={{ fontFamily: MT, fontSize: "8px", fontWeight: 300, color: "#555", lineHeight: 1.7, marginBottom: "10px" }}>
              Every report reviewed by a market researcher with over ten years of experience.
            </div>

            <ul style={{ listStyle: "none", flex: 1 }}>
              {BACK_SERVICES.map(svc => (
                <li key={svc.name} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: MT,
                  fontSize: "8px",
                  color: "#333",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(10,47,97,0.07)",
                }}>
                  <span>{svc.name}</span>
                  <span style={{ color: NAVY, fontWeight: 600 }}>{svc.price}</span>
                </li>
              ))}
            </ul>

            <div style={{
              marginTop: "10px",
              display: "inline-block",
              background: NAVY,
              padding: "6px 12px",
              borderRadius: "2px",
              fontFamily: MT,
              fontSize: "7px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: SAND,
            }}>
              seaglassinsights.com →
            </div>
          </div>
        </div>

      </body>
    </html>
  );
}
