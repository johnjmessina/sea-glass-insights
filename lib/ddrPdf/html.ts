// ── DDR report → self-contained HTML (printed to PDF by ./render.ts) ──────────
// Matches the MIR design system: Georgia/Gelasio font, navy/teal/white palette,
// named @page sections with navy header bars, cover page, TOC, and footer.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY      = "#0A2F61";
const TEAL      = "#00CED1";
const CREAM     = "#F4EADA";
const WHITE     = "#FFFFFF";
const INK       = "#1C1C1C";
const GRAY      = "#6B7280";
const LIGHT_GRAY = "#E5E7EB";
const ROW_TINT  = "#E8EDF4";
const RULE      = "#E0E0E0";

type Obj = Record<string, unknown>;

export type DdrOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  location?: string | null;
  created_at: string;
};

export type DdrSectionId =
  | "executive_summary"
  | "business_snapshot"
  | "customer_segments"
  | "competitive_intelligence"
  | "market_context"
  | "decision_specific_analysis"
  | "extended_recommendations"
  | "priority_action_framework"
  | "expanded_analyst_interpretation";

export const DDR_SECTIONS: { id: DdrSectionId; title: string }[] = [
  { id: "executive_summary",               title: "Executive Summary" },
  { id: "business_snapshot",              title: "Business Snapshot" },
  { id: "customer_segments",              title: "Customer Segments" },
  { id: "competitive_intelligence",       title: "Competitive Intelligence" },
  { id: "market_context",                 title: "Market Context & Trend Analysis" },
  { id: "decision_specific_analysis",     title: "Decision-Specific Analysis" },
  { id: "extended_recommendations",       title: "Extended Recommendations" },
  { id: "priority_action_framework",      title: "Priority Action Framework" },
  { id: "expanded_analyst_interpretation", title: "Expanded Analyst Interpretation" },
];

export type BuildOptions = {
  only?: DdrSectionId;
  pageNumbers?: Partial<Record<DdrSectionId, number>>;
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
const list = (v: unknown): string => (Array.isArray(v) ? v.map(x => String(x ?? "")).filter(Boolean).join(", ") : String(v ?? ""));

function labeledBullet(v: unknown): string {
  const s = String(v ?? "");
  const m = /^([A-Z][^:]{1,40}):\s+([\s\S]+)$/.exec(s);
  return m ? `<strong>${text(m[1])}:</strong> ${text(m[2])}` : text(s);
}

function yearsValue(v: unknown): string {
  const t = String(v ?? "").trim();
  const m = /^(?:about |around |over |nearly |almost )?(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i.exec(t);
  if (m) return `${m[1]} ${m[1] === "1" ? "Year" : "Years"}`;
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

const STAGES = ["Early Stage", "Growth Stage", "Established", "Scaling"];
function stageValue(v: unknown): string {
  const t = String(v ?? "").trim();
  const known = STAGES.find(st => st.toLowerCase() === t.toLowerCase());
  if (known) return known;
  return t && t.split(/\s+/).length <= 3 ? titleCase(t) : "";
}

function noBreakHyphens(html: string): string {
  return html.replace(/\S+-\S+/g, w => `<span class="nowrap">${w}</span>`);
}

const SMALL_WORDS = new Set(["a","an","and","as","at","by","for","in","of","on","or","the","to","with"]);
function titleCase(s: string): string {
  return s.split(/\s+/).filter(Boolean).map((w, i) => {
    if (i > 0 && SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
    if (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w;
    return w.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("-");
  }).join(" ");
}

function shortType(v: unknown): string {
  const t = String(v ?? "").trim();
  if (!t) return "";
  const head = t.split(/\s+(?:with|offering|that|which|specializing|focused on)\s+|\s+[-–—]\s+|;/i)[0].trim() || t;
  const parts = head.split(/\s*,\s*|\s+(?:and|&)\s+/i).map(x => x.trim()).filter(Boolean);
  const first = parts[0] ?? head;
  const last  = parts[parts.length - 1];
  const label = parts.length > 1 && `${first} & ${last}`.length <= 28 ? `${first} & ${last}` : first;
  return titleCase(label);
}

// ── Section bodies ─────────────────────────────────────────────────────────

function executiveSummary(es: unknown): string {
  if (typeof es === "string") return paragraphs(es, "lead");
  const e = obj(es);
  const bullets = arr(e.bullets);
  return `
    ${e.intro ? `<p class="lead">${text(e.intro)}</p>` : ""}
    ${bullets.length ? `<ul class="bullets">${bullets.map(b => `<li>${labeledBullet(b)}</li>`).join("")}</ul>` : ""}
    <div class="callouts">
      <div class="callout navy"><div class="callout-label">Key Finding</div><p>${text(e.your_edge ?? e.key_finding)}</p></div>
      <div class="callout teal"><div class="callout-label">Priority Action</div><p>${text(e.priority_action)}</p></div>
    </div>`;
}

function businessSnapshot(bs: unknown, legacy: unknown): string {
  const b = obj(bs);
  if (!Object.keys(b).length) return paragraphs(legacy);

  const stats: { label: string; value: string }[] = [
    { label: "Years in Business", value: yearsValue(b.time_in_business) },
    { label: "Business Type",     value: shortType(b.business_type) },
    { label: "Business Stage",    value: stageValue(b.business_stage) },
  ].filter(st => st.value);

  const details = ([
    ["Primary Offering",   b.primary_offering],
    ["Target Customer",    b.target_customer],
    ["Top Competitors",    list(b.top_competitors)],
    ["Marketing Channels", list(b.marketing_channels)],
    ["Key Challenge",      b.key_challenge],
    ["Success Goal",       b.success_goal],
    ["Decision Focus",     b.decision_focus],
  ] as [string, unknown][]).filter(([, v]) => v);

  return `
    <div class="snap-banner">
      <div class="snap-name">${text(b.business_name)}</div>
      ${b.location ? `<div class="snap-location">${text(b.location)}</div>` : ""}
      ${b.business_descriptor ? `<div class="snap-descriptor">${text(b.business_descriptor)}</div>` : ""}
    </div>
    ${stats.length ? `<div class="snap-bar">${stats.map(st => `
      <div class="snap-bar-item">
        <div class="snap-bar-label">${esc(st.label)}</div>
        <div class="snap-bar-value">${noBreakHyphens(text(st.value).replace(/\//g, "/<wbr>"))}</div>
      </div>`).join("")}
    </div>` : ""}
    <div class="snap-list">${details.map(([l, v]) => `
      <div class="snap-row">
        <div class="snap-row-label">${esc(l as string)}</div>
        <div class="snap-row-value">${text(v) || "&mdash;"}</div>
      </div>`).join("")}
    </div>`;
}

function customerSegments(segs: unknown): string {
  // May come as array of segment objects OR as a plain string from the AI
  if (typeof segs === "string") return paragraphs(segs);
  return `<div class="segments">${arr(segs).map(s => {
    const g = obj(s);
    return `<div class="card segment">
      <h3>${text(g.name)}</h3>
      <p>${text(g.desc ?? g.description)}</p>
      ${g.motivation  ? `<p class="field"><span class="field-label">Motivation:</span> ${text(g.motivation)}</p>` : ""}
      ${g.key_need    ? `<p class="field"><span class="field-label">Key Need:</span> ${text(g.key_need)}</p>` : ""}
      ${g.size        ? `<p class="field"><span class="field-label">Segment Size:</span> ${text(g.size)}</p>` : ""}
    </div>`;
  }).join("")}</div>`;
}

function competitiveIntelligence(comps: unknown): string {
  // May come as array of competitor objects OR plain string
  if (typeof comps === "string") return paragraphs(comps);
  const competitors = arr(comps);
  if (!competitors.length) return "";
  return `<table class="compare">
    <thead><tr><th>Competitor</th><th>Their Strength</th><th>Vulnerability</th><th class="edge">Your Edge</th></tr></thead>
    <tbody>${competitors.map(c => {
      const x = obj(c);
      return `<tr>
        <th scope="row">${text(x.name)}</th>
        <td>${text(x.strength) || "&mdash;"}</td>
        <td>${text(x.vulnerability ?? x.weakness) || "&mdash;"}</td>
        <td>${text(x.edge ?? x.your_edge) || "&mdash;"}</td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

// Generic narrative section (market context, decision analysis, etc.)
function narrativeSection(content: unknown): string {
  if (typeof content === "string") return paragraphs(content);
  const c = obj(content);
  const keys = Object.keys(c);
  if (!keys.length) return "";
  // Try to render as labeled subsections if the object has named keys
  return keys.map(k => {
    const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `<div class="subsection">
      <h3 class="subsection-head">${esc(label)}</h3>
      ${paragraphs(c[k])}
    </div>`;
  }).join("");
}

// Market stat callout boxes — extract structured stats array and render as a row of tiles
function marketStatCallouts(content: unknown): string {
  const c = obj(content);
  const stats: unknown[] = Array.isArray(c.key_stats) ? c.key_stats
    : Array.isArray(c.market_stats) ? c.market_stats
    : Array.isArray(c.statistics) ? c.statistics
    : [];
  if (!stats.length) return "";
  return `<div class="stat-row">${stats.map(s => {
    const g     = obj(s);
    const value = String(g.value ?? g.stat ?? g.number ?? "");
    const label = String(g.label ?? g.metric ?? g.name ?? "");
    const note  = String(g.note ?? g.source ?? g.context ?? "");
    if (!value) return "";
    return `<div class="stat-tile">
      <div class="stat-value">${esc(value)}</div>
      ${label ? `<div class="stat-label">${esc(label)}</div>` : ""}
      ${note  ? `<div class="stat-note">${esc(note)}</div>`  : ""}
    </div>`;
  }).join("")}</div>`;
}

// Decision focus callout
function decisionFocusCallout(content: unknown): string {
  const c = obj(content);
  const focus = String(c.decision_focus ?? c.decision_question ?? c.research_question ?? "");
  if (!focus) return "";
  return `<div class="decision-callout">
    <div class="decision-callout-label">Decision Focus</div>
    <div class="decision-callout-text">${text(focus)}</div>
  </div>`;
}

// Enhanced market context — stat tiles first, then prose
function marketContextSection(content: unknown): string {
  const stats = marketStatCallouts(content);
  return stats + narrativeSection(content);
}

// Enhanced decision analysis — decision callout box first, then prose
function decisionAnalysisSection(content: unknown): string {
  const callout = decisionFocusCallout(content);
  return callout + narrativeSection(content);
}

function extendedRecommendations(recs: unknown): string {
  if (typeof recs === "string") return paragraphs(recs);
  const all = arr(recs).map(obj);
  if (!all.length) return "";

  const TIERS = [
    { tier: 1, cls: "p1", label: "Priority 1", sub: "Do first" },
    { tier: 2, cls: "p2", label: "Priority 2", sub: "Do next" },
    { tier: 3, cls: "p3", label: "Priority 3", sub: "When ready" },
  ];

  function recTier(rec: Obj, i: number, n: number): 1|2|3 {
    const p = Number(rec.priority);
    if (p === 1 || p === 2 || p === 3) return p;
    return Math.min(3, 1 + Math.floor((i * 3) / n)) as 1|2|3;
  }

  let num = 0;
  return TIERS.map(t => {
    const items = all.filter((r, i) => recTier(r, i, all.length) === t.tier);
    if (!items.length) return "";
    return `<div class="tier ${t.cls}">${items.map((r, i) => {
      num += 1;
      const steps = arr(r.steps ?? r.implementation_steps);
      const stepsHtml = steps.length
        ? `<ul class="rec-steps">${steps.map(s => `<li>${text(s)}</li>`).join("")}</ul>`
        : "";
      const rec = `<div class="rec">
        <h3><span class="rec-num">${num}.</span> ${text(r.title)}</h3>
        <p>${text(r.body ?? r.description)}</p>
        ${stepsHtml}
        ${r.timeline ? `<p class="rec-timeline"><span class="field-label">Timeline:</span> ${text(r.timeline)}</p>` : ""}
      </div>`;
      return i === 0
        ? `<div class="keep"><div class="tier-head"><span>${t.label}</span><span class="tier-sub">${t.sub}</span></div>${rec}</div>`
        : rec;
    }).join("")}</div>`;
  }).join("");
}

function priorityActionFramework(paf: unknown): string {
  if (typeof paf === "string") return paragraphs(paf);
  const p = obj(paf);
  const phases = arr(p.phases ?? p.actions ?? p.framework);
  if (!phases.length) return narrativeSection(paf);

  return `<div class="paf">${phases.map((phase, i) => {
    const ph = obj(phase);
    const actions = arr(ph.actions ?? ph.items);
    return `<div class="paf-phase">
      <div class="paf-phase-head">
        <span class="paf-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="paf-phase-title">${text(ph.title ?? ph.phase ?? ph.name)}</span>
        ${ph.timeline ? `<span class="paf-timeline">${text(ph.timeline)}</span>` : ""}
      </div>
      ${actions.length ? `<ul class="paf-actions">${actions.map(a => `<li>${text(a)}</li>`).join("")}</ul>` : paragraphs(ph.description ?? ph.body)}
    </div>`;
  }).join("")}</div>`;
}

function analystNote(note: string, perspectives: Record<string, string>, icon: string): string {
  const hasPerspectives = Object.values(perspectives).some(v => v?.trim());
  return `
    ${note.trim() ? `<div class="note">${paragraphs(note)}</div>` : ""}
    <div class="signature">
      <div class="sig-name">John Messina</div>
      <div class="sig-title">Founder, Sea Glass Insights</div>
    </div>
    ${hasPerspectives ? `
    <div class="perspectives-summary">
      <h3 class="subsection-head">Analyst Perspectives by Section</h3>
      ${DDR_SECTIONS.filter(s => perspectives[s.id]?.trim()).map(s => `
        <div class="perspective-item">
          <div class="perspective-section">${esc(s.title)}</div>
          <p>${text(perspectives[s.id])}</p>
        </div>`).join("")}
    </div>` : ""}
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
    `@page cover { }`,
    `@page contents { ${chrome("Contents")} }`,
    ...DDR_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .card, .callouts, .pos-card, .rec, .paf-phase, tr, li { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${DDR_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
section.cover { page: cover; }
section.contents { page: contents; }

.section-title {
  font-size: 16pt; font-weight: 700; color: ${NAVY}; margin: 0 0 14pt;
  padding-bottom: 6pt; border-bottom: 2pt solid ${TEAL};
}

/* Cover */
.cover-inner { height: 9in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-logo { width: 2.6in; margin-top: 0.6in; }
.cover-type { font-size: 10pt; font-weight: 700; color: ${TEAL}; letter-spacing: 2.5pt; text-transform: uppercase; margin: 0.55in 0 0; }
.cover-title { font-size: 26pt; font-weight: 700; color: ${NAVY}; letter-spacing: 2.5pt; margin: 6pt 0 0; line-height: 1.2; }
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

table { border-collapse: collapse; width: 100%; }

/* Business Snapshot */
.snap-banner { background: ${NAVY}; min-height: 80px; padding: 16px 22px; border-radius: 4pt; display: flex; flex-direction: column; justify-content: center; }
.snap-name { color: ${WHITE}; font-size: 32px; font-weight: 700; line-height: 1.15; }
.snap-location { color: ${TEAL}; font-size: 15px; margin-top: 4px; }
.snap-descriptor { color: ${WHITE}; font-size: 12px; font-style: italic; margin-top: 6px; opacity: 0.92; }
.snap-bar { display: flex; background: ${WHITE}; border: 1px solid ${ROW_TINT}; padding: 12px 0; margin: 14px 0 6px; }
.snap-bar-item { flex: 1 1 auto; padding: 0 14px; }
.snap-bar-item + .snap-bar-item { border-left: 1px solid ${ROW_TINT}; }
.snap-bar-label { color: ${NAVY}; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 4px; white-space: nowrap; }
.snap-bar-value { color: ${NAVY}; font-size: 14px; font-weight: 700; line-height: 1.3; }
.snap-list { margin-top: 4px; }
.snap-row { display: flex; gap: 16px; padding: 11px 0; border-bottom: 1px solid ${ROW_TINT}; break-inside: avoid; }
.snap-row:last-child { border-bottom: none; }
.snap-row-label { flex: 0 0 30%; color: ${NAVY}; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding-top: 2px; }
.snap-row-value { flex: 1; color: #333333; font-size: 13px; line-height: 1.5; }
.nowrap { white-space: nowrap; }

/* Customer Segments */
.segments { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
.card { background: ${WHITE}; border: 1pt solid ${CREAM}; border-radius: 4pt; padding: 12pt 14pt; }
.segment h3 { font-size: 13pt; color: ${NAVY}; margin: 0 0 6pt; }
.segment p { font-size: 11pt; }
.field { margin-bottom: 5pt; }
.field-label { color: ${TEAL}; font-weight: 700; }

/* Competitive Intelligence */
.compare thead { display: table-header-group; }
.compare thead th { background: ${NAVY}; color: ${WHITE}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.compare thead th.edge { border-bottom: 3pt solid ${TEAL}; }
.compare tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; width: 20%; border-top: 1pt solid rgba(255,255,255,0.25); }
.compare tbody td, .compare tbody th { padding: 10pt; vertical-align: top; font-size: 11pt; }
.compare tbody td { background: ${WHITE}; border-bottom: 1px solid ${RULE}; }
.compare tbody td:last-child { border-right: 1px solid ${RULE}; }
.compare tbody tr:nth-child(even) td { background: ${ROW_TINT}; }

/* Subsections (for narrative sections with labeled parts) */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

/* Market Stat Callout Tiles */
.stat-row { display: flex; gap: 10pt; margin-bottom: 20pt; }
.stat-tile { flex: 1; background: ${NAVY}; color: ${WHITE}; border-radius: 4pt; padding: 14pt 16pt; text-align: center; border-top: 3pt solid ${TEAL}; }
.stat-value { font-size: 24pt; font-weight: 700; color: ${TEAL}; line-height: 1; margin-bottom: 5pt; }
.stat-label { font-size: 9pt; font-weight: 700; letter-spacing: 1pt; text-transform: uppercase; color: ${WHITE}; margin-bottom: 4pt; }
.stat-note { font-size: 8pt; color: rgba(255,255,255,0.65); font-style: italic; }

/* Decision Focus Callout */
.decision-callout { background: ${ROW_TINT}; border-left: 4pt solid ${TEAL}; border-radius: 0 4pt 4pt 0; padding: 14pt 16pt; margin-bottom: 18pt; break-inside: avoid; }
.decision-callout-label { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: ${NAVY}; margin-bottom: 6pt; }
.decision-callout-text { font-size: 12pt; font-style: italic; color: ${INK}; line-height: 1.5; }

/* Extended Recommendations */
.tier { margin-bottom: 10pt; border-radius: 4pt; border: 1pt solid ${CREAM}; }
.tier-head { display: flex; align-items: baseline; gap: 10pt; padding: 5pt 12pt; font-size: 10pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; border-radius: 4pt 4pt 0 0; }
.tier-sub { font-size: 8pt; letter-spacing: 1pt; }
.tier.p1 { border-color: ${NAVY}; } .tier.p1 .tier-head { background: ${NAVY}; color: ${WHITE}; } .tier.p1 .tier-sub { color: ${TEAL}; }
.tier.p2 { border-color: ${TEAL}; } .tier.p2 .tier-head { background: ${TEAL}; color: ${NAVY}; }
.tier.p3 { border-color: ${LIGHT_GRAY}; } .tier.p3 .tier-head { background: ${LIGHT_GRAY}; color: ${NAVY}; } .tier.p3 .tier-sub { color: ${GRAY}; }
.rec { padding: 7pt 12pt; background: ${WHITE}; }
.rec + .rec, .keep + .rec { border-top: 1pt solid ${CREAM}; }
.rec h3 { font-size: 12pt; line-height: 1.3; color: ${NAVY}; margin: 0 0 3pt; }
.rec-num { color: ${TEAL}; }
.rec p { margin: 0 0 5pt; font-size: 13px; line-height: 1.45; }
.rec-steps { margin: 4pt 0 0; padding-left: 16pt; font-size: 11px; }
.rec-steps li { margin-bottom: 4pt; }
.rec-steps li::marker { color: ${TEAL}; }
.rec-timeline { font-size: 10px; color: ${GRAY}; margin: 3pt 0 0; }

/* Priority Action Framework */
.paf { display: flex; flex-direction: column; gap: 10pt; }
.paf-phase { border: 1pt solid ${ROW_TINT}; border-radius: 4pt; overflow: hidden; }
.paf-phase-head { display: flex; align-items: center; gap: 12pt; background: ${NAVY}; padding: 8pt 14pt; }
.paf-num { font-size: 18pt; font-weight: 700; color: ${TEAL}; min-width: 28pt; }
.paf-phase-title { font-size: 11pt; font-weight: 700; color: ${WHITE}; flex: 1; }
.paf-timeline { font-size: 9pt; color: ${TEAL}; white-space: nowrap; }
.paf-actions { margin: 0; padding: 10pt 14pt 10pt 28pt; background: ${WHITE}; }
.paf-actions li { font-size: 11pt; margin-bottom: 5pt; }
.paf-actions li::marker { color: ${TEAL}; }

/* Analyst Note */
.note p { font-style: italic; font-size: 12pt; line-height: 1.6; color: ${INK}; margin-bottom: 12pt; }
.signature { margin-top: 26pt; padding-top: 10pt; border-top: 2pt solid ${NAVY}; width: 3in; }
.sig-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.sig-title { color: ${GRAY}; font-size: 10pt; }
.perspectives-summary { margin-top: 28pt; padding-top: 14pt; border-top: 1pt solid ${CREAM}; }
.perspective-item { margin-bottom: 12pt; break-inside: avoid; }
.perspective-section { font-size: 9pt; font-weight: 700; color: ${TEAL}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 4pt; }
.perspective-item p { font-style: italic; margin: 0; font-size: 10.5pt; color: ${INK}; }
.brand-footer { display: flex; align-items: center; gap: 12pt; margin-top: 48pt; padding: 14pt 16pt; background: ${WHITE}; border: 1pt solid ${CREAM}; border-top: 3pt solid ${TEAL}; border-radius: 4pt; }
.brand-footer img { width: 40pt; height: 40pt; object-fit: contain; }
.brand-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.brand-meta { color: ${GRAY}; font-size: 9.5pt; }
`;

// ── Document ───────────────────────────────────────────────────────────────

export function buildDdrReportHtml(
  order: DdrOrderInfo,
  draft: Obj,
  analystNoteText: string,
  analystPerspectives: Record<string, string> = {},
  opts: BuildOptions = {},
): string {
  const body: Record<DdrSectionId, () => string> = {
    executive_summary:               () => executiveSummary(draft.executive_summary),
    business_snapshot:              () => businessSnapshot(draft.business_snapshot, draft.snapshot),
    customer_segments:              () => customerSegments(draft.customer_segments),
    competitive_intelligence:       () => competitiveIntelligence(draft.competitive_intelligence),
    market_context:                  () => marketContextSection(draft.market_context),
    decision_specific_analysis:     () => decisionAnalysisSection(draft.decision_specific_analysis),
    extended_recommendations:       () => extendedRecommendations(draft.extended_recommendations),
    priority_action_framework:      () => priorityActionFramework(draft.priority_action_framework),
    expanded_analyst_interpretation: () => narrativeSection(draft.expanded_analyst_interpretation),
  };

  // Wrap each section — the last one (expanded_analyst_interpretation) gets the
  // Analyst Note content appended after it (like MIR's analyst_note section).
  const section = (id: DdrSectionId, title: string) => {
    const isLast = id === "expanded_analyst_interpretation";
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${body[id]()}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNote(analystNoteText, analystPerspectives, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  let pages: string;
  if (opts.only) {
    const s = DDR_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Deep Dive Report</div>
          <div class="cover-title">DEEP DIVE REPORT</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-conf">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${DDR_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + DDR_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Deep Dive Report</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
