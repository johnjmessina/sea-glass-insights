// ── SMA report → self-contained HTML (printed to PDF by ./render.ts) ──────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY      = "#0A2F61";
const TEAL      = "#00CED1";
const CREAM     = "#F4EADA";
const WHITE     = "#FFFFFF";
const INK       = "#1C1C1C";
const GRAY      = "#6B7280";
const ROW_TINT  = "#E8EDF4";

type Obj = Record<string, unknown>;

export type SmaOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  location?: string | null;
  created_at: string;
};

export type SmaSectionId =
  | "profile_setup_review"
  | "content_quality_scoring"
  | "posting_consistency_analysis"
  | "engagement_assessment"
  | "brand_consistency_evaluation"
  | "platform_utilization_review"
  | "overall_presence_score";

export const SMA_SECTIONS: { id: SmaSectionId; title: string }[] = [
  { id: "profile_setup_review",         title: "Profile & Setup Review" },
  { id: "content_quality_scoring",      title: "Content Quality Scoring" },
  { id: "posting_consistency_analysis", title: "Posting Consistency Analysis" },
  { id: "engagement_assessment",        title: "Engagement Assessment" },
  { id: "brand_consistency_evaluation", title: "Brand Consistency Evaluation" },
  { id: "platform_utilization_review",  title: "Platform Utilization Review" },
  { id: "overall_presence_score",       title: "Overall Presence Score & Recommendations" },
];

export type BuildOptions = {
  only?: SmaSectionId;
  pageNumbers?: Partial<Record<SmaSectionId, number>>;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function fmtDate(str: string): string {
  const d = new Date(str);
  if (isNaN(d.getTime())) return String(str || "");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function text(v: unknown): string {
  const s = String(v ?? "")
    .replace(/\*{2,3}([^*\n]+)\*{2,3}/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  return esc(s);
}

function paragraphs(v: unknown, cls = ""): string {
  return String(v ?? "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p${cls ? ` class="${cls}"` : ""}>${text(p)}</p>`).join("");
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

// Generic narrative section: handles plain string or object with keys
function narrativeSection(content: unknown): string {
  if (typeof content === "string") return paragraphs(content);
  const c = content as Obj;
  if (!c || typeof c !== "object" || Array.isArray(c)) return "";
  const keys = Object.keys(c);
  if (!keys.length) return "";
  return keys.map(k => {
    const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `<div class="subsection">
      <h3 class="subsection-head">${esc(label)}</h3>
      ${paragraphs((c as Obj)[k])}
    </div>`;
  }).join("");
}

function scoreBand(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Needs Work";
  return "Critical";
}

function bandColor(score: number): string {
  if (score >= 75) return "#059669"; // emerald green — strong/exceptional
  if (score >= 60) return "#8FADC8"; // blue-gray — average
  return "#DC6B6B";                  // soft red — below average/critical
}

// Try to extract a numeric score (0–100) from structured content
function extractScore(content: unknown): number | null {
  const c = obj(content);
  const candidates = [
    c.score, c.overall_score, c.total_score, c.rating, c.overall_rating,
    c.section_score, c.audit_score,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (!isNaN(n) && n >= 0) return Math.min(100, n <= 10 ? n * 10 : n);
  }
  return null;
}

// Score hero for sections that carry a numeric score
function scoreHero(score: number, label: string): string {
  const band  = scoreBand(score);
  const color = bandColor(score);
  return `
  <div class="sma-score-hero">
    <div class="sma-score-left">
      <div class="sma-score-label">${esc(label)}</div>
      <div class="sma-score-number" style="color:${color}">${score}</div>
      <div class="sma-score-denom">/100</div>
      <div class="sma-score-band" style="background:${color}">${esc(band)}</div>
    </div>
    <div class="sma-score-bar-wrap">
      <div class="sma-score-bar-track">
        <div class="sma-score-bar-fill" style="width:${score}%;background:${color}"></div>
      </div>
      <div class="sma-score-scale">0 &nbsp;&mdash;&nbsp; Needs Work &nbsp;&mdash;&nbsp; Fair &nbsp;&mdash;&nbsp; Good &nbsp;&mdash;&nbsp; 100</div>
    </div>
  </div>`;
}

// Overall Presence Score — full visual treatment with per-dimension rows
function overallPresenceSection(content: unknown): string {
  const c     = obj(content);
  const score = extractScore(content);

  // Try to find a per-dimension breakdown
  const dims: unknown[] = Array.isArray(c.dimensions) ? c.dimensions
    : Array.isArray(c.scores) ? c.scores
    : Array.isArray(c.category_scores) ? c.category_scores
    : [];

  const hero = score !== null ? scoreHero(score, "Overall Social Media Presence Score") : "";
  const dimTable = dims.length ? `
    <table class="sma-dim-table">
      <thead><tr><th>Category</th><th style="text-align:center">Score</th><th>Rating</th><th>Bar</th></tr></thead>
      <tbody>${dims.map((d, i) => {
        const g     = obj(d);
        const dName = String(g.category ?? g.dimension ?? g.name ?? g.label ?? `Category ${i + 1}`);
        const dScore = Math.min(100, Number(g.score ?? g.value ?? 0) <= 10 ? Number(g.score ?? g.value ?? 0) * 10 : Number(g.score ?? g.value ?? 0));
        const color  = bandColor(dScore);
        return `<tr class="${i % 2 ? "even" : ""}">
          <th scope="row">${esc(dName)}</th>
          <td style="text-align:center"><strong style="color:${color}">${dScore}</strong></td>
          <td><span class="band-badge" style="background:${color}20;color:${color};border:1pt solid ${color}40">${esc(scoreBand(dScore))}</span></td>
          <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${dScore}%;background:${color}"></div></div></td>
        </tr>`;
      }).join("")}</tbody>
    </table>` : "";

  // Render any prose/recommendations that aren't the score numbers
  const remainingKeys = Object.keys(c).filter(k =>
    !["score","overall_score","total_score","rating","overall_rating","dimensions","scores","category_scores"].includes(k)
  );
  const prose = remainingKeys.length ? remainingKeys.map(k => {
    const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `<div class="subsection"><h3 class="subsection-head">${esc(label)}</h3>${paragraphs(c[k])}</div>`;
  }).join("") : (score === null ? narrativeSection(content) : "");

  return hero + dimTable + (dimTable ? `<div style="margin-top:16pt">${prose}</div>` : prose);
}

// Platform grid — if content has per-platform data, render as platform cards
function platformSection(content: unknown): string {
  const c = obj(content);
  // Look for per-platform keys (instagram, facebook, tiktok, etc.)
  const platformKeys = Object.keys(c).filter(k =>
    /instagram|facebook|tiktok|twitter|linkedin|pinterest|youtube|yelp/i.test(k)
  );
  if (platformKeys.length >= 2) {
    return `<div class="platform-grid">${platformKeys.map(k => {
      const p = obj(c[k]);
      const score = extractScore(c[k]);
      const color = score !== null ? bandColor(score) : NAVY;
      return `<div class="platform-card" style="border-top:3pt solid ${color}">
        <div class="platform-name" style="color:${color}">${esc(k.charAt(0).toUpperCase() + k.slice(1))}</div>
        ${score !== null ? `<div class="platform-score" style="color:${color}">${score}<span class="platform-denom">/100</span></div>` : ""}
        ${Object.keys(p).filter(pk => !["score","rating"].includes(pk)).map(pk => {
          const label = pk.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          return `<div class="platform-field"><span class="platform-field-label">${esc(label)}</span>${text(p[pk])}</div>`;
        }).join("")}
      </div>`;
    }).join("")}</div>` + (c.summary || c.overall_summary ? `<div style="margin-top:14pt">${paragraphs(c.summary ?? c.overall_summary)}</div>` : "");
  }
  return narrativeSection(content);
}

// Scoring section — renders score hero if numeric score present, else narrative
function scoringSection(content: unknown, sectionLabel: string): string {
  const score = extractScore(content);
  if (score !== null) {
    return scoreHero(score, sectionLabel) + narrativeSection(content);
  }
  return narrativeSection(content);
}

function analystNote(note: string, icon: string): string {
  return `
    ${note.trim() ? `<div class="note">${paragraphs(note)}</div>` : ""}
    <div class="signature">
      <div class="sig-name">John Messina</div>
      <div class="sig-title">Founder, Sea Glass Insights</div>
    </div>
    <div class="brand-footer">
      <img src="data:image/png;base64,${icon}" alt="">
      <div>
        <div class="brand-name">Sea Glass Insights</div>
        <div class="brand-meta">seaglassinsights.com &nbsp;|&nbsp; john@seaglassinsights.com</div>
      </div>
    </div>`;
}

// ── CSS ────────────────────────────────────────────────────────────────────

function fontFaces(): string {
  const face = (data: string, weight: number, style: string) =>
    `@font-face{font-family:"Gelasio";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style};}`;
  return face(gelasio.regular, 400, "normal") + face(gelasio.italic, 400, "italic") +
         face(gelasio.bold, 700, "normal") + face(gelasio.boldItalic, 700, "italic");
}

function pageRules(): string {
  const chrome = (name: string) => `
    @top-center {
      content: "${name.toUpperCase()}";
      background: ${NAVY}; color: ${WHITE};
      font: 700 9pt Georgia, "Gelasio", serif; letter-spacing: 1.5pt;
      text-align: left; vertical-align: middle;
      padding-left: 12pt; margin-top: 0.4in; margin-bottom: 0.22in;
    }
    @bottom-left {
      content: "Sea Glass Insights  |  Confidential";
      font: 8.5pt Georgia, "Gelasio", serif; color: ${GRAY};
      vertical-align: top; padding-top: 0.28in;
    }
    @bottom-right {
      content: "Page " counter(page);
      font: 8.5pt Georgia, "Gelasio", serif; color: ${GRAY};
      vertical-align: top; padding-top: 0.28in;
    }`;
  return [
    `@page { size: Letter; margin: 1in; }`,
    `@page cover { margin: 1in 1in 0 1in; }`,
    `@page contents { ${chrome("Contents")} }`,
    ...SMA_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
  ].join("\n");
}

const CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: Georgia, "Gelasio", serif; font-size: 11pt; line-height: 1.5; color: ${INK};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
p { margin: 0 0 8pt; }
h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
.keep, .card, .subsection { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${SMA_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
section.cover { page: cover; }
section.contents { page: contents; }

.section-title {
  font-size: 16pt; font-weight: 700; color: ${NAVY}; margin: 0 0 14pt;
  padding-bottom: 6pt; border-bottom: 2pt solid ${TEAL};
}

/* Cover */
.cover-inner { height: 10in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-logo { width: 2.8in; margin-top: 0.7in; }
.cover-type { font-size: 9pt; font-weight: 700; color: ${TEAL}; letter-spacing: 3pt; text-transform: uppercase; margin: 0.65in 0 0; }
.cover-rule { width: 1.2in; height: 3pt; background: ${TEAL}; margin: 16pt auto; }
.cover-business { font-size: 28pt; font-weight: 700; color: ${NAVY}; margin: 0; line-height: 1.2; }
.cover-sub { font-size: 11pt; color: ${GRAY}; margin-top: 12pt; }
.cover-footer { margin-top: auto; width: calc(100% + 2in); margin-left: -1in; margin-right: -1in; background: ${NAVY}; padding: 22pt 1in; text-align: left; }
.cover-footer-biz { font-size: 13pt; font-weight: 700; color: ${WHITE}; margin-bottom: 4pt; }
.cover-footer-meta { font-size: 9pt; color: rgba(255,255,255,0.65); font-style: italic; }

/* Contents */
.toc { list-style: none; margin: 8pt 0 0; padding: 0; }
.toc li { display: flex; align-items: baseline; padding: 9pt 0; font-size: 12pt; color: ${NAVY}; }
.toc .toc-num { color: ${TEAL}; font-weight: 700; width: 28pt; }
.toc .toc-dots { flex: 1; border-bottom: 1pt dotted ${GRAY}; margin: 0 8pt; transform: translateY(-3pt); }
.toc .toc-page { font-weight: 700; min-width: 18pt; text-align: right; }

/* Subsections */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

/* Score Hero */
.sma-score-hero { display: flex; align-items: flex-start; gap: 24pt; padding: 18pt 20pt; background: ${ROW_TINT}; border-radius: 4pt; border-top: 4pt solid ${TEAL}; margin-bottom: 20pt; }
.sma-score-left { min-width: 100pt; }
.sma-score-label { font-size: 8.5pt; font-weight: 700; color: ${GRAY}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 4pt; }
.sma-score-number { font-size: 48pt; font-weight: 700; line-height: 1; }
.sma-score-denom { font-size: 14pt; color: ${GRAY}; margin-top: -4pt; }
.sma-score-band { display: inline-block; margin-top: 8pt; padding: 3pt 10pt; border-radius: 12pt; color: ${WHITE}; font-size: 10pt; font-weight: 700; }
.sma-score-bar-wrap { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6pt; }
.sma-score-bar-track { height: 12pt; background: #E0E0E0; border-radius: 6pt; overflow: hidden; }
.sma-score-bar-fill { height: 100%; border-radius: 6pt; }
.sma-score-scale { font-size: 8pt; color: ${GRAY}; }

/* Dimension table */
table { border-collapse: collapse; width: 100%; }
.sma-dim-table thead th { background: ${NAVY}; color: ${WHITE}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.sma-dim-table tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; font-weight: 700; padding: 9pt 10pt; border-top: 1pt solid rgba(255,255,255,0.15); width: 34%; }
.sma-dim-table tbody td { padding: 9pt 10pt; background: ${WHITE}; border-bottom: 1px solid #E0E0E0; }
.sma-dim-table tbody tr.even td { background: ${ROW_TINT}; }
.sma-dim-table tbody tr.even th { background: ${ROW_TINT}; color: ${NAVY}; }
.band-badge { display: inline-block; padding: 2pt 8pt; border-radius: 10pt; font-size: 9pt; font-weight: 700; }
.bar-cell { width: 100pt; }
.bar-track { height: 8pt; background: #E0E0E0; border-radius: 4pt; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4pt; }

/* Platform Grid */
.platform-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 16pt; }
.platform-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.platform-name { font-size: 13pt; font-weight: 700; margin-bottom: 4pt; }
.platform-score { font-size: 24pt; font-weight: 700; line-height: 1; margin-bottom: 8pt; }
.platform-denom { font-size: 12pt; color: ${GRAY}; }
.platform-field { font-size: 10pt; margin-bottom: 4pt; }
.platform-field-label { font-weight: 700; color: ${NAVY}; text-transform: uppercase; font-size: 8pt; letter-spacing: 1pt; display: block; margin-bottom: 1pt; }

/* Analyst Note */
.note p { font-style: italic; font-size: 12pt; line-height: 1.6; color: ${INK}; margin-bottom: 12pt; }
.signature { margin-top: 26pt; padding-top: 10pt; border-top: 2pt solid ${NAVY}; width: 3in; }
.sig-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.sig-title { color: ${GRAY}; font-size: 10pt; }
.brand-footer { display: flex; align-items: center; gap: 12pt; margin-top: 48pt; padding: 14pt 16pt; background: ${WHITE}; border: 1pt solid ${CREAM}; border-top: 3pt solid ${TEAL}; border-radius: 4pt; }
.brand-footer img { width: 40pt; height: 40pt; object-fit: contain; }
.brand-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.brand-meta { color: ${GRAY}; font-size: 9.5pt; }
`;

// ── Document ───────────────────────────────────────────────────────────────

export function buildSmaReportHtml(
  order: SmaOrderInfo,
  draft: Obj,
  analystNoteText: string,
  opts: BuildOptions = {},
): string {
  const LAST_ID = SMA_SECTIONS[SMA_SECTIONS.length - 1].id;

  const sectionBody = (id: SmaSectionId, title: string, content: unknown): string => {
    if (id === "overall_presence_score")       return overallPresenceSection(content);
    if (id === "platform_utilization_review")  return platformSection(content);
    if (id === "content_quality_scoring")      return scoringSection(content, "Content Quality Score");
    if (id === "engagement_assessment")        return scoringSection(content, "Engagement Score");
    if (id === "brand_consistency_evaluation") return scoringSection(content, "Brand Consistency Score");
    return narrativeSection(content);
  };

  const section = (id: SmaSectionId, title: string) => {
    const isLast = id === LAST_ID;
    const content = draft[id];
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${sectionBody(id, title, content)}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNote(analystNoteText, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  let pages: string;
  if (opts.only) {
    const s = SMA_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Social Media Audit</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-footer">
            <div class="cover-footer-biz">${esc(order.business_name)}</div>
            <div class="cover-footer-meta">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
          </div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${SMA_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + SMA_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Social Media Audit</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
