// ── MIR report → self-contained HTML (printed to PDF by ./render.ts) ─────────
// Everything is inline: fonts and logos are embedded as data URIs so the page
// renders identically in local Chrome and in Chromium on Vercel.

import { gelasio } from "./fontAssets";
import logoAssets from "../logoAssets";

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const CREAM = "#F4EADA";
const WHITE = "#FFFFFF";
const INK   = "#1C1C1C";
const GRAY  = "#6B7280";
const LIGHT_GRAY = "#E5E7EB";

// ── Types (loose on purpose: drafts come from AI output and older formats) ──

type Obj = Record<string, unknown>;

export type MirOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  created_at: string;
};

export type SectionId =
  | "executive_summary" | "business_snapshot" | "customer_profile"
  | "competitive_landscape" | "positioning" | "insights"
  | "recommendations" | "analyst_note";

// Report order after the cover and contents pages
export const REPORT_SECTIONS: { id: SectionId; title: string }[] = [
  { id: "executive_summary",     title: "Executive Summary" },
  { id: "business_snapshot",     title: "Business Snapshot" },
  { id: "customer_profile",      title: "Customer Profile" },
  { id: "competitive_landscape", title: "Competitive Landscape" },
  { id: "positioning",           title: "Market Positioning" },
  { id: "insights",              title: "Key Insights" },
  { id: "recommendations",       title: "Recommendations" },
  { id: "analyst_note",          title: "Analyst Note" },
];

export type BuildOptions = {
  // Render only these sections (no cover/contents) — used to measure each
  // section's page count before the final render.
  only?: SectionId;
  // Starting page number of each section, shown in the table of contents.
  pageNumbers?: Partial<Record<SectionId, number>>;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

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

// Strip markdown the model sometimes emits, then escape.
function text(v: unknown): string {
  const s = String(v ?? "")
    .replace(/\*{2,3}([^*\n]+)\*{2,3}/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  return esc(s);
}

// Plain text → paragraphs (blank lines separate paragraphs)
function paragraphs(v: unknown, cls = ""): string {
  return String(v ?? "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p${cls ? ` class="${cls}"` : ""}>${text(p)}</p>`).join("");
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const list = (v: unknown): string => (Array.isArray(v) ? v.map(x => String(x ?? "")).filter(Boolean).join(", ") : String(v ?? ""));

// Bold a leading "Label:" (e.g. "Key finding: …") in exec summary bullets
function labeledBullet(v: unknown): string {
  const s = String(v ?? "");
  const m = /^([A-Z][^:]{1,40}):\s+([\s\S]+)$/.exec(s);
  return m ? `<strong>${text(m[1])}:</strong> ${text(m[2])}` : text(s);
}

// Same fallback as the dashboard: drafts without `priority` are tiered by
// list order, which the prompt ranks by impact (4 items → 1, 1, 2, 3).
function recTier(rec: Obj, i: number, n: number): 1 | 2 | 3 {
  const p = Number(rec.priority);
  if (p === 1 || p === 2 || p === 3) return p;
  return Math.min(3, 1 + Math.floor((i * 3) / n)) as 1 | 2 | 3;
}

// ── Section bodies ─────────────────────────────────────────────────────────

function executiveSummary(es: unknown): string {
  if (typeof es === "string") return paragraphs(es, "lead");       // legacy drafts
  const e = obj(es);
  const bullets = arr(e.bullets);
  return `
    ${e.intro ? `<p class="lead">${text(e.intro)}</p>` : ""}
    ${bullets.length ? `<ul class="bullets">${bullets.map(b => `<li>${labeledBullet(b)}</li>`).join("")}</ul>` : ""}
    <div class="callouts">
      <div class="callout navy"><div class="callout-label">Your Edge</div><p>${text(e.your_edge)}</p></div>
      <div class="callout teal"><div class="callout-label">Priority Action</div><p>${text(e.priority_action)}</p></div>
    </div>`;
}

function businessSnapshot(bs: unknown, legacy: unknown): string {
  const b = obj(bs);
  if (!Object.keys(b).length) return paragraphs(legacy);           // legacy drafts
  const rows: [string, unknown][] = [
    ["Business Name",      b.business_name],
    ["Location",           b.location],
    ["Time in Business",   b.time_in_business],
    ["Business Type",      b.business_type],
    ["Primary Offering",   b.primary_offering],
    ["Target Customer",    b.target_customer],
    ["Top Competitors",    list(b.top_competitors)],
    ["Marketing Channels", list(b.marketing_channels)],
    ["Key Challenge",      b.key_challenge],
    ["Success Goal",       b.success_goal],
  ];
  return `<table class="snapshot">${rows.map(([l, v]) =>
    `<tr><th>${esc(l)}</th><td>${text(v) || "&mdash;"}</td></tr>`).join("")}</table>`;
}

function customerProfile(segs: unknown): string {
  return `<div class="segments">${arr(segs).map(s => {
    const g = obj(s);
    return `<div class="card segment">
      <h3>${text(g.name)}</h3>
      <p>${text(g.desc)}</p>
      <p class="field"><span class="field-label">Motivation:</span> ${text(g.motivation)}</p>
      <p class="field"><span class="field-label">Key Need:</span> ${text(g.key_need)}</p>
    </div>`;
  }).join("")}</div>`;
}

function competitiveLandscape(comps: unknown): string {
  return `<table class="compare">
    <thead><tr><th>Competitor</th><th>Their Strength</th><th>Your Edge</th></tr></thead>
    <tbody>${arr(comps).map(c => {
      const x = obj(c);
      return `<tr><th scope="row">${text(x.name)}</th><td>${text(x.strength) || "&mdash;"}</td><td>${text(x.edge) || "&mdash;"}</td></tr>`;
    }).join("")}</tbody>
  </table>`;
}

function positioning(pos: unknown): string {
  const p = obj(pos);
  const card = (cls: string, label: string, items: unknown) => `
    <div class="pos-card ${cls}">
      <div class="pos-head">${label}</div>
      <ul>${arr(items).filter(Boolean).map(i => `<li>${text(i)}</li>`).join("")}</ul>
    </div>`;
  return `<div class="positioning">
    ${card("navy", "Strengths", p.strengths)}
    ${card("teal", "Vulnerabilities", p.vulnerabilities)}
  </div>`;
}

// 2-column grid like Customer Profile; an odd final insight spans full width
function insights(ins: unknown): string {
  const all = arr(ins);
  return `<div class="insights">${all.map((i, n) => {
    const x = obj(i);
    const span = all.length % 2 === 1 && n === all.length - 1 ? " span" : "";
    return `<div class="card insight${span}">
      <h3><span class="insight-num">${String(n + 1).padStart(2, "0")}</span>${text(x.title)}</h3><p>${text(x.body)}</p>
    </div>`;
  }).join("")}</div>`;
}

function recommendations(recs: unknown): string {
  const all = arr(recs).map(obj);
  const TIERS = [
    { tier: 1, cls: "p1", label: "Priority 1", sub: "Do first" },
    { tier: 2, cls: "p2", label: "Priority 2", sub: "Do next" },
    { tier: 3, cls: "p3", label: "Priority 3", sub: "When ready" },
  ];
  let num = 0;
  return TIERS.map(t => {
    const items = all.filter((r, i) => recTier(r, i, all.length) === t.tier);
    if (!items.length) return "";
    // Tier header is kept with its first recommendation (no orphaned header)
    return `<div class="tier ${t.cls}">${items.map((r, i) => {
      num += 1;
      const rec = `<div class="rec"><h3><span class="rec-num">${num}.</span> ${text(r.title)}</h3><p>${text(r.body)}</p></div>`;
      return i === 0
        ? `<div class="keep"><div class="tier-head"><span>${t.label}</span><span class="tier-sub">${t.sub}</span></div>${rec}</div>`
        : rec;
    }).join("")}</div>`;
  }).join("");
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

// ── Page CSS ───────────────────────────────────────────────────────────────

function fontFaces(): string {
  const face = (data: string, weight: number, style: string) =>
    `@font-face{font-family:"Gelasio";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style};}`;
  return face(gelasio.regular, 400, "normal") + face(gelasio.italic, 400, "italic") +
         face(gelasio.bold, 700, "normal") + face(gelasio.boldItalic, 700, "italic");
}

// One named @page per section so its navy header bar carries the section
// name on every page it spans, including overflow pages.
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
    `@page cover { }`,
    `@page contents { ${chrome("Contents")} }`,
    ...REPORT_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .card, .callouts, .pos-card, .rec, tr, li { break-inside: avoid; page-break-inside: avoid; }

/* Each numbered section starts on its own page */
section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${REPORT_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
section.cover { page: cover; }
section.contents { page: contents; }

.section-title {
  font-size: 16pt; font-weight: 700; color: ${NAVY}; margin: 0 0 14pt;
  padding-bottom: 6pt; border-bottom: 2pt solid ${TEAL};
}

/* Cover */
.cover-inner { height: 9in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-logo { width: 2.6in; margin-top: 0.6in; }
.cover-title { font-size: 26pt; font-weight: 700; color: ${NAVY}; letter-spacing: 2.5pt; margin: 0.55in 0 0; line-height: 1.2; }
.cover-rule { width: 1.2in; height: 3pt; background: ${TEAL}; margin: 18pt auto; }
.cover-business { font-size: 20pt; color: ${NAVY}; margin: 0; }
.cover-sub { font-size: 11pt; color: ${GRAY}; margin-top: 10pt; }
.cover-conf { margin-top: auto; font-size: 9pt; color: ${GRAY}; font-style: italic; border-top: 1pt solid ${CREAM}; padding-top: 10pt; width: 100%; }

/* Contents */
.toc { list-style: none; margin: 8pt 0 0; padding: 0; }
.toc li { display: flex; align-items: baseline; padding: 9pt 0; font-size: 12pt; color: ${NAVY}; }
.toc .toc-num { color: ${TEAL}; font-weight: 700; width: 28pt; }
.toc .toc-dots { flex: 1; border-bottom: 1pt dotted ${GRAY}; margin: 0 8pt; transform: translateY(-3pt); }
.toc .toc-page { font-weight: 700; min-width: 18pt; text-align: right; }

/* Executive Summary */
.lead { font-size: 12pt; line-height: 1.55; color: ${NAVY}; margin-bottom: 12pt; }
.bullets { margin: 0 0 16pt; padding-left: 16pt; }
.bullets li { margin-bottom: 7pt; }
.bullets li::marker { color: ${TEAL}; }
.bullets strong { color: ${NAVY}; }
.callouts { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
.callout { padding: 14pt 16pt; border-radius: 4pt; }
.callout p { margin: 0; }
.callout.navy { background: ${NAVY}; color: ${WHITE}; }
.callout.teal { background: ${TEAL}; color: ${NAVY}; }
.callout-label { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 6pt; }
.callout.navy .callout-label { color: ${TEAL}; }

/* Business Snapshot */
table { border-collapse: collapse; width: 100%; }
.snapshot th, .snapshot td { border: 1pt solid ${CREAM}; padding: 8pt 10pt; vertical-align: top; text-align: left; }
.snapshot th { width: 32%; background: ${CREAM}; color: ${NAVY}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; }
.snapshot td { background: ${WHITE}; }

/* Customer Profile */
.segments { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
.card { background: ${WHITE}; border: 1pt solid ${CREAM}; border-radius: 4pt; padding: 12pt 14pt; }
.segment h3 { font-size: 13pt; color: ${NAVY}; margin: 0 0 6pt; }
.segment p { font-size: 11pt; }
.field { margin-bottom: 5pt; }
.field-label { color: ${TEAL}; font-weight: 700; }

/* Competitive Landscape */
.compare thead { display: table-header-group; }
.compare thead th { background: ${TEAL}; color: ${NAVY}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.compare tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; width: 24%; }
.compare tbody td, .compare tbody th { padding: 10pt; vertical-align: top; font-size: 11pt; }
.compare tbody tr:nth-child(odd) td { background: ${CREAM}; }
.compare tbody tr:nth-child(even) td { background: ${WHITE}; }
.compare tbody tr + tr th { border-top: 1pt solid rgba(255,255,255,0.25); }

/* Market Positioning */
.positioning { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; align-items: stretch; }
.pos-card { border-radius: 4pt; overflow: hidden; background: ${CREAM}; }
.pos-head { padding: 9pt 14pt; font-size: 9pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; }
.pos-card.navy .pos-head { background: ${NAVY}; color: ${WHITE}; }
.pos-card.teal .pos-head { background: ${TEAL}; color: ${NAVY}; }
.pos-card ul { margin: 0; padding: 12pt 14pt 12pt 28pt; }
.pos-card li { font-size: 13px; margin-bottom: 6px; }
.pos-card.navy li::marker { color: ${NAVY}; }
.pos-card.teal li::marker { color: ${TEAL}; }

/* Key Insights */
.insights { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
.insight { border-left: 4pt solid ${TEAL}; padding: 10pt 12pt; }
.insight.span { grid-column: 1 / -1; }
.insight-num { color: ${TEAL}; margin-right: 6pt; }
.insight h3 { font-size: 12pt; line-height: 1.3; color: ${NAVY}; margin: 0 0 5pt; }
.insight p { margin: 0; font-size: 13px; line-height: 1.45; }

/* Recommendations */
.tier { margin-bottom: 16pt; border-radius: 4pt; border: 1pt solid ${CREAM}; }
.tier-head { display: flex; align-items: baseline; gap: 10pt; padding: 8pt 14pt; font-size: 10pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; border-radius: 4pt 4pt 0 0; }
.tier-sub { font-size: 8pt; letter-spacing: 1pt; }
.tier.p1 { border-color: ${NAVY}; } .tier.p1 .tier-head { background: ${NAVY}; color: ${WHITE}; } .tier.p1 .tier-sub { color: ${TEAL}; }
.tier.p2 { border-color: ${TEAL}; } .tier.p2 .tier-head { background: ${TEAL}; color: ${NAVY}; }
.tier.p3 { border-color: ${LIGHT_GRAY}; } .tier.p3 .tier-head { background: ${LIGHT_GRAY}; color: ${NAVY}; } .tier.p3 .tier-sub { color: ${GRAY}; }
.rec { padding: 11pt 14pt; background: ${WHITE}; }
.rec + .rec, .keep + .rec { border-top: 1pt solid ${CREAM}; }
.rec h3 { font-size: 12pt; color: ${NAVY}; margin: 0 0 4pt; }
.rec-num { color: ${TEAL}; }
.rec p { margin: 0; }

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

export function buildMirReportHtml(
  order: MirOrderInfo,
  draft: Obj,
  analystNoteText: string,
  opts: BuildOptions = {},
): string {
  const body: Record<SectionId, () => string> = {
    executive_summary:     () => executiveSummary(draft.executive_summary),
    business_snapshot:     () => businessSnapshot(draft.business_snapshot, draft.snapshot),
    customer_profile:      () => customerProfile(draft.customer_profile),
    competitive_landscape: () => competitiveLandscape(draft.competitive_landscape),
    positioning:           () => positioning(draft.positioning),
    insights:              () => insights(draft.insights),
    recommendations:       () => recommendations(draft.recommendations),
    analyst_note:          () => analystNote(analystNoteText, logoAssets.iconLogo),
  };

  const section = (id: SectionId, title: string) => `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${body[id]()}
    </section>`;

  let pages: string;
  if (opts.only) {
    const s = REPORT_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-title">MARKET INTELLIGENCE REPORT</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-conf">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${REPORT_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + REPORT_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Market Intelligence Report</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
