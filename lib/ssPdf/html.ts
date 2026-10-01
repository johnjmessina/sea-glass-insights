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
  if (score >= 90) return "#059669"; // green
  if (score >= 75) return "#0A2F61"; // navy
  if (score >= 60) return "#6B7280"; // gray
  if (score >= 45) return "#D97706"; // amber
  return "#DC2626";                  // red
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
  const rows: [string, unknown][] = [
    ["Business Name",    visitOV.business_name],
    ["Location",         visitOV.location],
    ["Date of Visit",    visitOV.date_of_visit ? fmtDate(String(visitOV.date_of_visit)) : "—"],
    ["Time of Visit",    visitOV.time_of_visit],
    ["Shopper Scenario", visitOV.shopper_scenario],
    ["Template Used",    visitOV.template_used],
  ];
  return `
    <table class="overview-table">
      <tbody>${rows.map(([label, val], i) => `
        <tr class="${i % 2 === 1 ? "even" : ""}">
          <th>${esc(label)}</th>
          <td>${text(val) || "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

function scorecardSection(sc: Record<string, boolean | number | unknown>): string {
  const total     = totalScore(sc);
  const totalBand = scoreBand(total);
  const totalColor = bandColor(total);

  return `
    <div class="score-callout">
      <div class="score-total">
        <span class="score-number" style="color:${totalColor}">${total}</span>
        <span class="score-denom">/100</span>
        <span class="score-band" style="color:${totalColor}">${esc(totalBand)}</span>
      </div>
      <div class="score-scale">90–100 Exceptional &nbsp;·&nbsp; 75–89 Strong &nbsp;·&nbsp; 60–74 Average &nbsp;·&nbsp; 45–59 Below Average &nbsp;·&nbsp; Below 45 Critical</div>
    </div>
    <table class="compare scorecard-table">
      <thead>
        <tr>
          <th>Dimension</th>
          <th>Score</th>
          <th>Weight</th>
          <th>Rating</th>
          <th>Bar</th>
        </tr>
      </thead>
      <tbody>
        ${SS_DIMS.map((dim, i) => {
          const raw  = dimScore(dim, sc);
          const band = scoreBand(raw);
          const color = bandColor(raw);
          const pct  = raw;
          return `<tr class="${i % 2 === 1 ? "even" : ""}">
            <th scope="row">${esc(dim.label)}</th>
            <td><strong style="color:${color}">${raw}</strong>/100</td>
            <td>${Math.round(dim.weight * 100)}%</td>
            <td style="color:${color}">${esc(band)}</td>
            <td class="bar-cell">
              <div class="score-bar-track">
                <div class="score-bar-fill" style="width:${pct}%;background:${color}"></div>
              </div>
            </td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <th scope="row">TOTAL WEIGHTED SCORE</th>
          <td><strong style="color:${totalColor}">${total}</strong>/100</td>
          <td>100%</td>
          <td style="color:${totalColor}">${esc(totalBand)}</td>
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
  const fields: [string, unknown][] = [
    ["Best Moment",                obs.best_moment],
    ["Biggest Missed Opportunity", obs.biggest_miss],
    ["Immediate Fix",              obs.immediate_fix],
    ["Additional Observations",    obs.additional_observations],
  ];
  return fields.filter(([, v]) => String(v ?? "").trim()).map(([label, val]) => `
    <div class="obs-block">
      <h3 class="obs-head">${esc(label as string)}</h3>
      ${paragraphs(val)}
    </div>`).join("");
}

function narrativeNotesSection(aiDraft: Record<string, unknown>): string {
  return NARRATIVE_SECTIONS.map(({ key, label }) => `
    <div class="narrative-block">
      <h3 class="obs-head">${esc(label)}</h3>
      ${paragraphs(aiDraft[key])}
    </div>`).join("");
}

function summarySection(
  aiDraft: Record<string, unknown>,
  summaryAnalystNote: string,
): string {
  return `
    ${paragraphs(aiDraft.summary_and_recommendations)}
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
    `@page cover { }`,
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

/* Visit Overview table */
table { border-collapse: collapse; width: 100%; }
.overview-table th, .overview-table td { padding: 9pt 12pt; font-size: 11pt; vertical-align: top; border-bottom: 1px solid ${RULE}; }
.overview-table th { width: 32%; color: ${NAVY}; font-weight: 700; font-size: 10pt; letter-spacing: 1px; text-transform: uppercase; background: ${ROW_TINT}; }
.overview-table td { color: ${INK}; }
.overview-table tr.even th, .overview-table tr.even td { background: ${WHITE}; }
.overview-table tr:last-child th, .overview-table tr:last-child td { border-bottom: none; }

/* Scorecard */
.score-callout { border-left: 4pt solid ${TEAL}; padding: 12pt 16pt; margin-bottom: 18pt; background: ${ROW_TINT}; border-radius: 0 4pt 4pt 0; }
.score-total { display: flex; align-items: baseline; gap: 8pt; }
.score-number { font-size: 32pt; font-weight: 700; line-height: 1; }
.score-denom { font-size: 16pt; color: ${GRAY}; }
.score-band { font-size: 14pt; font-weight: 700; margin-left: 8pt; }
.score-scale { font-size: 9pt; color: ${GRAY}; margin-top: 6pt; }
.scorecard-table thead th { background: ${NAVY}; color: ${WHITE}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.scorecard-table tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; width: 30%; font-weight: 700; padding: 9pt 10pt; border-top: 1pt solid rgba(255,255,255,0.15); }
.scorecard-table tbody td { padding: 9pt 10pt; font-size: 11pt; background: ${WHITE}; border-bottom: 1px solid ${RULE}; }
.scorecard-table tbody tr.even td { background: ${ROW_TINT}; }
.scorecard-table .total-row th { background: ${NAVY}; color: ${TEAL}; }
.scorecard-table .total-row td { background: ${NAVY}; color: ${WHITE}; font-weight: 700; }
.bar-cell { width: 120pt; }
.score-bar-track { height: 6pt; background: ${RULE}; border-radius: 3pt; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 3pt; }

/* Analyst Observations & Narrative */
.obs-block, .narrative-block { margin-bottom: 18pt; }
.obs-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }
.summary-analyst-note { margin-top: 16pt; padding: 12pt 14pt; background: ${ROW_TINT}; border-radius: 4pt; }
.gray-text { color: ${GRAY}; font-style: italic; }

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
          <div class="cover-title">SECRET SHOPPING REPORT</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-conf">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
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
