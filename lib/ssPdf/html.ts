// ── SS (Secret Shopping) report → self-contained HTML (printed to PDF) ────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.
// Special: Visit Overview table, Experience Scorecard table with per-dimension
// scores, Analyst Observations, Narrative Notes, Summary & Recommendations.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY      = "#0A2F61";
const TEAL      = "#00CED1";
const CREAM     = "#F4EADA";
const WHITE     = "#FFFFFF";
const INK       = "#1C1C1C";
const GRAY      = "#6B7280";
const ROW_TINT  = "#E8EDF4";
const RULE      = "#E0E0E0";

type Obj = Record<string, unknown>;

export type SsOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  created_at: string;
};

export type SsSectionId =
  | "visit_overview"
  | "experience_scorecard"
  | "analyst_observations"
  | "narrative_notes"
  | "summary_and_recommendations";

export const SS_SECTIONS: { id: SsSectionId; title: string }[] = [
  { id: "visit_overview",             title: "Visit Overview" },
  { id: "experience_scorecard",       title: "Experience Scorecard" },
  { id: "analyst_observations",       title: "Analyst Observations" },
  { id: "narrative_notes",            title: "Narrative Notes" },
  { id: "summary_and_recommendations", title: "Summary & Recommendations" },
];

export type BuildOptions = {
  only?: SsSectionId;
  pageNumbers?: Partial<Record<SsSectionId, number>>;
};

// ── Scoring Dimensions (mirrors SecretShoppingScorecard.tsx / ssReportGenerator.js)
const SS_DIMS: {
  key: string; label: string; weight: number;
  yesno: string[]; rated: string[];
}[] = [
  {
    key: "first_impression", label: "First Impression", weight: 0.10,
    yesno: ["fi_exterior_signage","fi_entrance_clear","fi_hours_posted","fi_acknowledged_60s"],
    rated: ["fi_greeting_quality","fi_overall_first"],
  },
  {
    key: "physical_environment", label: "Physical Environment", weight: 0.10,
    yesno: ["pe_clean","pe_organized","pe_interior_signage","pe_lighting","pe_music","pe_temperature"],
    rated: ["pe_overall_env","pe_visual_merch"],
  },
  {
    key: "staff_engagement", label: "Staff Engagement", weight: 0.25,
    yesno: ["se_visible","se_natural","se_listened","se_accurate"],
    rated: ["se_friendliness","se_knowledge","se_objection","se_consistency"],
  },
  {
    key: "core_experience", label: "Core Experience", weight: 0.25,
    yesno: ["ce_easy_find","ce_upsell_attempted","ce_upsell_helpful","ce_matched_promise"],
    rated: ["ce_relevance","ce_personalization","ce_valued"],
  },
  {
    key: "purchase_process", label: "Purchase Process", weight: 0.15,
    yesno: ["pp_efficient","pp_accurate","pp_loyalty","pp_receipt","pp_packaging"],
    rated: ["pp_checkout_staff","pp_farewell"],
  },
  {
    key: "digital_touchpoints", label: "Digital Touchpoints", weight: 0.10,
    yesno: ["dt_findable","dt_website_accurate","dt_hours_match","dt_contact_accurate","dt_reviews_responded"],
    rated: ["dt_overall_digital"],
  },
  {
    key: "lasting_impression", label: "Lasting Impression", weight: 0.05,
    yesno: ["li_would_return","li_would_recommend"],
    rated: ["li_gut_score"],
  },
];

const NARRATIVE_SECTIONS = [
  { key: "narrative_first_impression",     label: "First Impression" },
  { key: "narrative_physical_environment", label: "Physical Environment" },
  { key: "narrative_staff_engagement",     label: "Staff Engagement" },
  { key: "narrative_core_experience",      label: "Core Experience" },
  { key: "narrative_purchase_process",     label: "Purchase Process" },
  { key: "narrative_digital_touchpoints",  label: "Digital Touchpoints" },
  { key: "narrative_lasting_impression",   label: "Lasting Impression" },
];

// ── Scoring ────────────────────────────────────────────────────────────────

function dimScore(
  dim: typeof SS_DIMS[0],
  sc: Record<string, boolean | number | unknown>,
): number {
  let total = 0, max = 0;
  for (const k of dim.yesno) { max += 1; if (sc[k] === true) total += 1; }
  for (const k of dim.rated)  { max += 5; const v = sc[k]; if (typeof v === "number") total += v; }
  return max === 0 ? 0 : Math.round((total / max) * 100);
}

function totalScore(sc: Record<string, boolean | number | unknown>): number {
  return Math.round(
    SS_DIMS.reduce((acc, d) => acc + (dimScore(d, sc) / 100) * d.weight * 100, 0),
  );
}

function scoreBand(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Average";
  if (score >= 45) return "Below Average";
  return "Critical";
}

function bandColor(score: number): string {
  if (score >= 75) return "#059669"; // emerald green — strong/exceptional
  if (score >= 60) return "#8FADC8"; // blue-gray — average
  return "#DC6B6B";                  // soft red — below average/critical
}

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

// ── Section renderers ──────────────────────────────────────────────────────

function visitOverviewSection(visitOV: Record<string, unknown>): string {
  const fields: [string, string, unknown][] = [
    ["&#9679;", "Business",        visitOV.business_name],
    ["&#9679;", "Location",        visitOV.location],
    ["&#9679;", "Date of Visit",   visitOV.date_of_visit ? fmtDate(String(visitOV.date_of_visit)) : null],
    ["&#9679;", "Time of Visit",   visitOV.time_of_visit],
    ["&#9679;", "Shopper Scenario",visitOV.shopper_scenario],
    ["&#9679;", "Template Used",   visitOV.template_used],
  ];
  const cards = fields.map(([, label, val]) => `
    <div class="ov-card">
      <div class="ov-label">${esc(label)}</div>
      <div class="ov-value">${text(val) || "—"}</div>
    </div>`).join("");
  return `<div class="ov-grid">${cards}</div>`;
}

function scorecardSection(sc: Record<string, boolean | number | unknown>): string {
  const total      = totalScore(sc);
  const totalBand  = scoreBand(total);
  const totalColor = bandColor(total);

  // Mini dimension pills for the callout header
  const dimPills = SS_DIMS.map(dim => {
    const raw   = dimScore(dim, sc);
    const color = bandColor(raw);
    return `<div class="dim-pill">
      <div class="dim-pill-bar" style="height:${Math.round(raw * 0.36)}pt;background:${color}"></div>
      <div class="dim-pill-label">${esc(dim.label.replace(" ", " "))}</div>
      <div class="dim-pill-score" style="color:${color}">${raw}</div>
    </div>`;
  }).join("");

  return `
    <div class="score-callout-hero">
      <div class="score-hero-left">
        <div class="score-hero-label">Overall Experience Score</div>
        <div class="score-hero-number" style="color:${totalColor}">${total}</div>
        <div class="score-hero-denom">/100</div>
        <div class="score-hero-band" style="background:${totalColor}">${esc(totalBand)}</div>
        <div class="score-scale">90–100 Exceptional · 75–89 Strong · 60–74 Average · 45–59 Below Avg · &lt;45 Critical</div>
      </div>
      <div class="dim-pills-wrap">${dimPills}</div>
    </div>
    <table class="compare scorecard-table">
      <thead>
        <tr>
          <th>Dimension</th>
          <th style="text-align:center">Score</th>
          <th style="text-align:center">Weight</th>
          <th>Rating</th>
          <th>Visual</th>
        </tr>
      </thead>
      <tbody>
        ${SS_DIMS.map((dim, i) => {
          const raw   = dimScore(dim, sc);
          const band  = scoreBand(raw);
          const color = bandColor(raw);
          return `<tr class="${i % 2 === 1 ? "even" : ""}">
            <th scope="row">${esc(dim.label)}</th>
            <td style="text-align:center"><strong style="color:${color}">${raw}</strong></td>
            <td style="text-align:center">${Math.round(dim.weight * 100)}%</td>
            <td><span class="band-badge" style="background:${color}20;color:${color};border:1pt solid ${color}40">${esc(band)}</span></td>
            <td class="bar-cell">
              <div class="score-bar-track">
                <div class="score-bar-fill" style="width:${raw}%;background:${color}"></div>
              </div>
            </td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <th scope="row">TOTAL WEIGHTED SCORE</th>
          <td style="text-align:center"><strong style="color:${totalColor}">${total}</strong></td>
          <td style="text-align:center">100%</td>
          <td><span class="band-badge" style="background:${totalColor};color:#fff">${esc(totalBand)}</span></td>
          <td class="bar-cell">
            <div class="score-bar-track">
              <div class="score-bar-fill" style="width:${total}%;background:${totalColor}"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>`;
}

function analystObservationsSection(obs: Record<string, unknown>): string {
  const cards: { label: string; val: unknown; accent: string; icon: string }[] = [
    { label: "Best Moment",                val: obs.best_moment,             accent: "#059669", icon: "&#9650;" },
    { label: "Biggest Missed Opportunity", val: obs.biggest_miss,            accent: "#DC6B6B", icon: "&#9660;" },
    { label: "Immediate Fix",              val: obs.immediate_fix,           accent: "#8FADC8", icon: "&#9654;" },
    { label: "Additional Observations",    val: obs.additional_observations, accent: NAVY,      icon: "&#9632;" },
  ];
  return `<div class="obs-cards">${
    cards.filter(({ val }) => String(val ?? "").trim()).map(({ label, val, accent, icon }) => `
    <div class="obs-card" style="border-left:4pt solid ${accent}">
      <div class="obs-card-head" style="color:${accent}">
        <span class="obs-icon">${icon}</span> ${esc(label)}
      </div>
      <div class="obs-card-body">${paragraphs(val)}</div>
    </div>`).join("")
  }</div>`;
}

const NARRATIVE_ACCENTS = [TEAL, NAVY, "#059669", "#8FADC8", "#DC6B6B", "#059669", TEAL];

function narrativeNotesSection(aiDraft: Record<string, unknown>): string {
  return NARRATIVE_SECTIONS.map(({ key, label }, i) => {
    const accent = NARRATIVE_ACCENTS[i % NARRATIVE_ACCENTS.length];
    return `
    <div class="narrative-block narrative-card" style="border-left:3pt solid ${accent}">
      <h3 class="narrative-head" style="color:${accent}">${esc(label)}</h3>
      ${paragraphs(aiDraft[key])}
    </div>`;
  }).join("");
}

function summarySection(
  aiDraft: Record<string, unknown>,
  summaryAnalystNote: string,
): string {
  const raw = String(aiDraft.summary_and_recommendations ?? "").trim();

  // Split prose into paragraphs; detect any "First, ... Second, ... Third, ... Fourth," action sequence
  const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  // Find the paragraph containing the ordered action sequence
  const actionPara = paras.find(p => /\bFirst[,:]/.test(p) && /\bSecond[,:]/.test(p));
  const otherParas = paras.filter(p => p !== actionPara);

  // Parse numbered actions from the action paragraph
  let actionCards = "";
  if (actionPara) {
    const actions: { label: string; body: string }[] = [];
    const actionRe = /\b(First|Second|Third|Fourth|Fifth)[,:]\s*/g;
    const splits = actionPara.split(actionRe).filter(Boolean);
    // splits = ["First", "text...", "Second", "text...", ...]
    for (let i = 0; i < splits.length - 1; i++) {
      if (/^(First|Second|Third|Fourth|Fifth)$/.test(splits[i])) {
        actions.push({ label: splits[i], body: (splits[i + 1] ?? "").replace(/\s+$/, "") });
      }
    }
    if (actions.length >= 2) {
      const ICONS = ["&#9654;", "&#9654;", "&#9654;", "&#9654;", "&#9654;"];
      const COLORS = ["#059669", "#8FADC8", "#8FADC8", "#DC6B6B"];
      actionCards = `<div class="summary-actions">
        <div class="summary-actions-label">Priority Actions</div>
        <div class="summary-action-grid">${actions.map((a, idx) => `
          <div class="summary-action-card" style="border-left:3pt solid ${COLORS[idx] ?? TEAL}">
            <div class="summary-action-num" style="color:${COLORS[idx] ?? TEAL}">${ICONS[idx]} ${a.label}</div>
            <div class="summary-action-body">${esc(a.body)}</div>
          </div>`).join("")}
        </div>
      </div>`;
    }
  }

  return `
    ${otherParas.map(p => `<p>${esc(p)}</p>`).join("")}
    ${actionCards}
    ${summaryAnalystNote && summaryAnalystNote.trim() ? `
      <div class="summary-analyst-note">
        <div class="obs-head">Analyst Notes</div>
        ${paragraphs(summaryAnalystNote, "gray-text")}
      </div>` : ""}`;
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
    `@page cover { margin: 1in; }`,
    `@page contents { ${chrome("Contents")} }`,
    ...SS_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .obs-block, .narrative-block, tr { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${SS_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
section.cover { page: cover; }
section.contents { page: contents; }

.section-title {
  font-size: 16pt; font-weight: 700; color: ${NAVY}; margin: 0 0 14pt;
  padding-bottom: 6pt; border-bottom: 2pt solid ${TEAL};
}

/* Cover */
.cover-inner { height: 9in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-logo { width: 5in; margin-top: 1.5in; }
.cover-type { font-size: 9pt; font-weight: 700; color: ${TEAL}; letter-spacing: 3pt; text-transform: uppercase; margin: 0.65in 0 0; }
.cover-rule { width: 1.2in; height: 3pt; background: ${TEAL}; margin: 20pt auto; }
.cover-business { font-size: 28pt; font-weight: 700; color: ${NAVY}; margin: 0; line-height: 1.2; }
.cover-sub { font-size: 11pt; color: ${GRAY}; margin-top: 12pt; }
.cover-confidential { margin-top: auto; font-size: 8pt; color: ${GRAY}; font-style: italic; }

/* Contents */
.toc { list-style: none; margin: 8pt 0 0; padding: 0; }
.toc li { display: flex; align-items: baseline; padding: 9pt 0; font-size: 12pt; color: ${NAVY}; }
.toc .toc-num { color: ${TEAL}; font-weight: 700; width: 28pt; }
.toc .toc-dots { flex: 1; border-bottom: 1pt dotted ${GRAY}; margin: 0 8pt; transform: translateY(-3pt); }
.toc .toc-page { font-weight: 700; min-width: 18pt; text-align: right; }

/* Visit Overview grid */
table { border-collapse: collapse; width: 100%; }
.ov-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 8pt; }
.ov-card { background: ${ROW_TINT}; border-radius: 4pt; padding: 12pt 14pt; border-left: 3pt solid ${TEAL}; break-inside: avoid; }
.ov-label { font-size: 8.5pt; font-weight: 700; color: ${GRAY}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 5pt; }
.ov-value { font-size: 12pt; color: ${NAVY}; font-weight: 700; line-height: 1.3; }

/* Scorecard Hero */
.score-callout-hero { display: flex; align-items: stretch; gap: 0; margin-bottom: 20pt; background: ${ROW_TINT}; border-radius: 4pt; overflow: hidden; border: 1pt solid ${RULE}; }
.score-hero-left { min-width: 140pt; padding: 20pt 22pt; border-right: 1pt solid ${RULE}; display: flex; flex-direction: column; justify-content: center; }
.score-hero-label { font-size: 8pt; font-weight: 700; color: ${GRAY}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 6pt; }
.score-hero-number { font-size: 68pt; font-weight: 700; line-height: 1; }
.score-hero-denom { font-size: 13pt; color: ${GRAY}; margin-top: 0; }
.score-hero-band { display: inline-block; margin-top: 10pt; padding: 4pt 12pt; border-radius: 12pt; color: ${WHITE}; font-size: 10pt; font-weight: 700; letter-spacing: 0.5pt; }
.score-scale { font-size: 7.5pt; color: ${GRAY}; margin-top: 10pt; line-height: 1.5; }
.dim-pills-wrap { display: flex; align-items: flex-end; gap: 10pt; flex: 1; justify-content: space-around; padding: 18pt 16pt 14pt; }
.dim-pill { display: flex; flex-direction: column; align-items: center; gap: 4pt; }
.dim-pill-bar { width: 18pt; border-radius: 2pt 2pt 0 0; min-height: 4pt; }
.dim-pill-label { font-size: 7pt; color: ${GRAY}; text-align: center; line-height: 1.3; max-width: 44pt; }
.dim-pill-score { font-size: 9pt; font-weight: 700; }

/* Scorecard table */
.scorecard-table thead th { background: ${NAVY}; color: ${WHITE}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.scorecard-table tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; width: 30%; font-weight: 700; padding: 9pt 10pt; border-top: 1pt solid rgba(255,255,255,0.15); }
.scorecard-table tbody td { padding: 9pt 10pt; font-size: 11pt; background: ${WHITE}; border-bottom: 1px solid ${RULE}; }
.scorecard-table tbody tr.even td { background: ${ROW_TINT}; }
.scorecard-table .total-row th { background: ${NAVY}; color: ${TEAL}; }
.scorecard-table .total-row td { background: ${NAVY}; color: ${WHITE}; font-weight: 700; }
.bar-cell { width: 120pt; }
.score-bar-track { height: 8pt; background: ${RULE}; border-radius: 4pt; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 4pt; }
.band-badge { display: inline-block; padding: 2pt 8pt; border-radius: 10pt; font-size: 9pt; font-weight: 700; letter-spacing: 0.3pt; }

/* Analyst Observations Cards */
.obs-cards { display: flex; flex-direction: column; gap: 16pt; }
.obs-card { background: ${WHITE}; border: 1pt solid ${RULE}; border-radius: 0 6pt 6pt 0; padding: 14pt 16pt; break-inside: avoid; }
.obs-card-head { font-size: 11pt; font-weight: 700; margin-bottom: 8pt; display: flex; align-items: center; gap: 6pt; }
.obs-icon { font-size: 9pt; }
.obs-card-body p { margin: 0 0 6pt; font-size: 11pt; }
.obs-card-body p:last-child { margin-bottom: 0; }

/* Narrative Notes */
.narrative-block { margin-bottom: 16pt; }
.narrative-card { padding: 12pt 14pt 12pt 16pt; background: ${WHITE}; border: 1pt solid ${RULE}; border-radius: 0 4pt 4pt 0; }
.narrative-head { font-size: 11pt; font-weight: 700; margin: 0 0 8pt; }
.obs-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }
.summary-analyst-note { margin-top: 16pt; padding: 12pt 14pt; background: ${ROW_TINT}; border-radius: 4pt; }
.gray-text { color: ${GRAY}; font-style: italic; }

/* Summary Actions */
.summary-actions { margin: 20pt 0; }
.summary-actions-label { font-size: 8pt; font-weight: 700; color: ${GRAY}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 10pt; }
.summary-action-grid { display: flex; flex-direction: column; gap: 10pt; }
.summary-action-card { padding: 11pt 14pt; background: ${ROW_TINT}; border-radius: 0 4pt 4pt 0; break-inside: avoid; }
.summary-action-num { font-size: 9pt; font-weight: 700; letter-spacing: 0.5pt; text-transform: uppercase; margin-bottom: 4pt; }
.summary-action-body { font-size: 10.5pt; color: ${INK}; line-height: 1.5; }

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

export type SsReportData = {
  visitOV:            Record<string, unknown>;
  scorecard:          Record<string, boolean | number | unknown>;
  analystObs:         Record<string, unknown>;
  aiDraft:            Record<string, unknown>;
  summaryAnalystNote: string;
};

export function buildSsReportHtml(
  order: SsOrderInfo,
  reportData: SsReportData,
  analystNoteText: string,
  opts: BuildOptions = {},
): string {
  const { visitOV, scorecard, analystObs, aiDraft, summaryAnalystNote } = reportData;
  const LAST_ID = SS_SECTIONS[SS_SECTIONS.length - 1].id;

  const bodies: Record<SsSectionId, () => string> = {
    visit_overview:             () => visitOverviewSection(visitOV),
    experience_scorecard:       () => scorecardSection(scorecard as Record<string, boolean | number | unknown>),
    analyst_observations:       () => analystObservationsSection(analystObs),
    narrative_notes:            () => narrativeNotesSection(aiDraft),
    summary_and_recommendations: () => summarySection(aiDraft, summaryAnalystNote),
  };

  const section = (id: SsSectionId, title: string) => {
    const isLast = id === LAST_ID;
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${bodies[id]()}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNote(analystNoteText, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  let pages: string;
  if (opts.only) {
    const s = SS_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Secret Shopping Report</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-confidential">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${SS_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + SS_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Secret Shopping Report</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
