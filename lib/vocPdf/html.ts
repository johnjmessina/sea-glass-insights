// ── VoC (Voice of Customer) report → self-contained HTML ─────────────────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.
// Includes quantitative stat tables (scale T2B/Mean/B2B, frequency, banner cut)
// and per-section Analyst Perspective callout boxes.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";
import type { VocQuestion, VocQuantData } from "../vocTypes";

const NAVY     = "#0A2F61";
const TEAL     = "#00CED1";
const CREAM    = "#F4EADA";
const WHITE    = "#FFFFFF";
const INK      = "#1C1C1C";
const GRAY     = "#6B7280";
const ROW_TINT = "#E8EDF4";

export type VocOrderInfo = {
  business_name:   string;
  customer_name?:  string | null;
  location?:       string | null;
  created_at:      string;
};

export type VocSectionId =
  | "survey_design"
  | "quantitative_summary"
  | "thematic_analysis"
  | "visual_findings_summary"
  | "analyst_interpretation";

export const VOC_SECTIONS: { id: VocSectionId; title: string }[] = [
  { id: "survey_design",           title: "Survey Design" },
  { id: "quantitative_summary",    title: "Quantitative Summary" },
  { id: "thematic_analysis",       title: "Thematic Analysis" },
  { id: "visual_findings_summary", title: "Visual Findings Summary" },
  { id: "analyst_interpretation",  title: "Analyst Interpretation & Recommendations" },
];

export type VocReportData = {
  aiDraft:             Record<string, string>;
  analystNote:         string;
  analystPerspectives: Record<string, string>;
  questionMap:         VocQuestion[];
  quantData?:          VocQuantData;
};

export type BuildOptions = {
  only?:        VocSectionId;
  pageNumbers?: Partial<Record<VocSectionId, number>>;
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

// Analyst Perspective callout — navy left border, light navy background
function perspectiveCallout(perspectiveText: unknown): string {
  const s = String(perspectiveText ?? "");
  if (!s.trim()) return "";
  return `
    <div class="perspective-callout">
      <div class="perspective-label">Analyst Perspective</div>
      <p>${text(s)}</p>
    </div>`;
}

function analystNoteBlock(note: string, icon: string): string {
  const noteStr = String(note ?? "");
  return `
    ${noteStr.trim() ? `<div class="note">${paragraphs(noteStr)}</div>` : ""}
    <div class="signature">
      <div class="sig-name">John Messina</div>
      <div class="sig-title">Founder, Sea Glass Insights</div>
    </div>
    <p class="voc-closing">This report was prepared as a Voice of Customer Survey. Survey questions were designed from the business intake and administered to the client's customer contacts. Quantitative and qualitative findings are grounded in actual customer responses. This report is intended for internal business use only.</p>
    <div class="brand-footer">
      <img src="data:image/png;base64,${icon}" alt="">
      <div>
        <div class="brand-name">Sea Glass Insights</div>
        <div class="brand-meta">seaglassinsights.com &nbsp;|&nbsp; john@seaglassinsights.com</div>
      </div>
    </div>`;
}

// ── Survey Design section content ─────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  scale_1_7:       "Linear Scale 1–7",
  multiple_choice: "Multiple Choice",
  select_all:      "Checkboxes (Select All That Apply)",
  open_ended:      "Paragraph",
};

function surveyDesignContent(questions: VocQuestion[]): string {
  if (!questions.length) return `<p class="empty-note">No survey questions on record.</p>`;
  const items = questions.map((q, i) => {
    const typeLabel = TYPE_LABELS[q.type] ?? q.type;
    const opts = (q.type === "multiple_choice" || q.type === "select_all") && q.options.length
      ? `<ul class="q-options">${q.options.map(o => `<li>${esc(o)}</li>`).join("")}</ul>`
      : "";
    const tags: string[] = [];
    if (q.t2bB2b)          tags.push("T2B/B2B");
    if (q.bannerCut)        tags.push("Banner Cut");
    if (q.segmentationVar)  tags.push("Seg. Var");
    const tagHtml = tags.length
      ? `<span class="q-tags">${tags.map(t => `<span class="q-tag">${esc(t)}</span>`).join("")}</span>`
      : "";
    return `
      <div class="q-item keep">
        <div class="q-header">
          <span class="q-num">${i + 1}</span>
          <span class="q-text">${esc(q.text || "(no question text)")}</span>
          <span class="q-type-badge">${esc(typeLabel)}</span>
          ${tagHtml}
        </div>
        ${opts}
      </div>`;
  }).join("");
  return `
    <div class="survey-questions">${items}</div>
    <p class="q-note">Copy these questions directly into Google Forms or your preferred survey tool.</p>`;
}

// ── Quantitative table renderers ──────────────────────────────────────────────

function scaleTable(q: VocQuestion, stat: VocQuantData["questionStats"][string]): string {
  if (!stat) return "";
  const dist    = stat.distribution ?? {};
  const distStr = [1,2,3,4,5,6,7].map(i => `${i}: ${dist[String(i)] ?? 0}`).join(" ");
  return `
    <div class="quant-block keep">
      <p class="q-block-text">${esc(q.text)}</p>
      <table class="quant-table">
        <thead>
          <tr>
            <th>T2B (6–7)</th>
            <th>Mean Score</th>
            <th>B2B (1–2)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="bold-cell">${stat.t2b ?? 0}%</td>
            <td>${stat.mean ?? 0}</td>
            <td>${stat.b2b ?? 0}%</td>
          </tr>
        </tbody>
      </table>
      <p class="dist-note">Distribution (n=${stat.totalResponded ?? 0}): ${esc(distStr)}</p>
    </div>`;
}

function freqTable(q: VocQuestion, stat: VocQuantData["questionStats"][string]): string {
  if (!stat?.frequencies) return "";
  const entries = Object.entries(stat.frequencies).sort(([,a],[,b]) => b - a);
  const rows = entries.map(([opt, cnt], i) => `
    <tr${i % 2 === 1 ? ` class="shade"` : ""}>
      <td>${esc(opt)}</td>
      <td>${cnt}</td>
      <td>${stat.percentages?.[opt] ?? 0}%</td>
    </tr>`).join("");
  return `
    <div class="quant-block keep">
      <p class="q-block-text">${esc(q.text)} <span class="resp-count">(n=${stat.totalResponded ?? 0})</span></p>
      <table class="quant-table freq-table">
        <thead>
          <tr>
            <th class="wide-col">Response</th>
            <th>Count</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function bannerTable(
  svId: string,
  cuts: Record<string, Record<string, VocQuantData["questionStats"][string]>>,
  questions: VocQuestion[],
): string {
  const sv     = questions.find(q => q.id === svId);
  if (!sv) return "";
  const scaleQs = questions.filter(q => q.type === "scale_1_7" && q.id !== svId);
  if (!scaleQs.length) return "";
  const headerCols = scaleQs.map(q => {
    const label = esc(q.text.slice(0, 28) + (q.text.length > 28 ? "…" : ""));
    return `<th colspan="2" class="banner-q-head">${label}</th>`;
  }).join("");
  const subHeaderCols = scaleQs.map(() =>
    `<th class="banner-sub-head">T2B</th><th class="banner-sub-head">Mean</th>`
  ).join("");
  const rows = Object.entries(cuts).map(([sv2, segData], ri) => {
    const dataCols = scaleQs.map(tq => {
      const cell = segData[tq.id] as { t2b?: number; mean?: number } | undefined;
      if (!cell) return `<td class="banner-no-data">—</td><td class="banner-no-data">—</td>`;
      return `<td class="banner-t2b">${cell.t2b ?? 0}%</td><td class="banner-mean">${cell.mean ?? 0}</td>`;
    }).join("");
    return `<tr${ri % 2 === 1 ? ` class="shade"` : ""}><td class="seg-val">${esc(sv2)}</td>${dataCols}</tr>`;
  }).join("");
  return `
    <div class="quant-block keep">
      <p class="banner-label">Banner: &ldquo;${esc(sv.text)}&rdquo;</p>
      <table class="quant-table banner-table">
        <thead>
          <tr>
            <th rowspan="2">Segment</th>
            ${headerCols}
          </tr>
          <tr>
            ${subHeaderCols}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function quantSectionContent(
  data: VocReportData,
): string {
  const { aiDraft, analystPerspectives, questionMap, quantData } = data;
  const scaleQs = questionMap.filter(q => q.type === "scale_1_7");
  const mcQs    = questionMap.filter(q => q.type === "multiple_choice" || q.type === "select_all");
  const scaleTbls  = scaleQs.map(q => scaleTable(q, quantData?.questionStats?.[q.id]!)).filter(Boolean);
  const freqTbls   = mcQs.map(q => freqTable(q, quantData?.questionStats?.[q.id]!)).filter(Boolean);
  const bannerTbls = quantData?.bannerCuts
    ? Object.entries(quantData.bannerCuts).map(([svId, cuts]) => bannerTable(svId, cuts as unknown as Record<string, Record<string, VocQuantData["questionStats"][string]>>, questionMap)).filter(Boolean)
    : [];
  const hasQuant = quantData && (scaleTbls.length + freqTbls.length + bannerTbls.length) > 0;

  return `
    ${hasQuant ? `
      <p class="resp-total">Total responses: ${quantData!.totalResponses}</p>
      ${scaleTbls.length ? `<div class="subsection"><h3 class="subsection-head">Rating Scales (1–7)</h3>${scaleTbls.join("")}</div>` : ""}
      ${freqTbls.length  ? `<div class="subsection"><h3 class="subsection-head">Frequency Breakdowns</h3>${freqTbls.join("")}</div>` : ""}
      ${bannerTbls.length? `<div class="subsection"><h3 class="subsection-head">Banner Cut Tables</h3>${bannerTbls.join("")}</div>` : ""}
      <h3 class="subsection-head">Narrative Summary</h3>
    ` : ""}
    ${paragraphs(aiDraft["quant_summary"] ?? "")}
    ${perspectiveCallout(analystPerspectives["quant_summary"] ?? "")}`;
}

// ── Prose section renderers ────────────────────────────────────────────────

// Parse numbered themes from prose text (looks for "1.", "2.", or "Theme 1" patterns)
function vocThematicContent(rawTextIn: unknown): string {
  const rawText = String(rawTextIn ?? "");
  if (!rawText.trim()) return "";
  // Try to split on numbered theme headers: "1. Theme Title\nBody" or "**Theme 1: Title**\nBody"
  const themeRegex = /(?:^|\n)(?:\*{0,2})(?:\d+\.\s+|Theme\s+\d+[:\-\s]+)(.+?)(?:\*{0,2})\n([\s\S]+?)(?=(?:\n(?:\*{0,2})(?:\d+\.\s+|Theme\s+\d+[:\-\s]+)|$))/gi;
  const matches = [...rawText.matchAll(themeRegex)];
  if (matches.length >= 2) {
    return `<div class="voc-themes">${matches.map((m, i) => `
      <div class="voc-theme-card">
        <div class="voc-theme-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="voc-theme-body">
          <div class="voc-theme-title">${text(m[1])}</div>
          <div class="voc-theme-text">${paragraphs(m[2].trim())}</div>
        </div>
      </div>`).join("")}</div>`;
  }
  // Fall back to subsection-style rendering if object, else plain paragraphs
  return paragraphs(rawText);
}

// Analyst Interpretation: pull out recommendation bullets visually
function vocInterpretationContent(rawTextIn: unknown): string {
  const rawText = String(rawTextIn ?? "");
  if (!rawText.trim()) return "";
  // Look for a "Recommendations" block followed by bullets
  const recSplit = rawText.split(/\n(?=Recommendation|Key Recommendation|Strategic Recommendation|Next Step)/i);
  if (recSplit.length >= 2) {
    return paragraphs(recSplit[0]) + `<div class="voc-rec-list">${
      recSplit.slice(1).map((r, i) => {
        const lines = r.trim().split("\n");
        const title = lines[0].replace(/^#+\s+/, "").replace(/\*{2,}/g, "").trim();
        const body  = lines.slice(1).join("\n").trim();
        return `<div class="voc-rec-card" style="border-left:4pt solid ${i % 2 === 0 ? NAVY : TEAL}">
          <div class="voc-rec-title" style="color:${i % 2 === 0 ? NAVY : TEAL}">${text(title)}</div>
          ${body ? `<div class="voc-rec-body">${paragraphs(body)}</div>` : ""}
        </div>`;
      }).join("")
    }</div>`;
  }
  return paragraphs(rawText);
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
    ...VOC_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .card, .subsection, .q-item, .quant-block, .perspective-callout { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${VOC_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
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
.cover-includes { margin-top: 24pt; text-align: left; width: 4in; }
.cover-includes-head { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: ${TEAL}; margin-bottom: 10pt; }
.cover-includes ul { list-style: none; margin: 0; padding: 0; }
.cover-includes li { font-size: 11pt; color: ${NAVY}; margin-bottom: 5pt; }
.cover-includes li::before { content: "\\2014\\00a0"; color: ${TEAL}; font-weight: 700; }

/* Contents */
.toc { list-style: none; margin: 8pt 0 0; padding: 0; }
.toc li { display: flex; align-items: baseline; padding: 9pt 0; font-size: 12pt; color: ${NAVY}; }
.toc .toc-num { color: ${TEAL}; font-weight: 700; width: 28pt; }
.toc .toc-dots { flex: 1; border-bottom: 1pt dotted ${GRAY}; margin: 0 8pt; transform: translateY(-3pt); }
.toc .toc-page { font-weight: 700; min-width: 18pt; text-align: right; }

/* Subsections */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

/* Survey Design — question list */
.survey-questions { margin-bottom: 12pt; }
.q-item { margin-bottom: 10pt; padding: 10pt 12pt; background: ${ROW_TINT}; border-radius: 4pt; }
.q-header { display: flex; align-items: baseline; gap: 8pt; flex-wrap: wrap; }
.q-num { font-size: 10pt; font-weight: 700; color: ${TEAL}; min-width: 18pt; }
.q-text { font-size: 11pt; color: ${INK}; flex: 1; }
.q-type-badge { font-size: 8pt; color: ${GRAY}; font-style: italic; white-space: nowrap; }
.q-tags { display: flex; gap: 4pt; flex-wrap: wrap; }
.q-tag { font-size: 7.5pt; font-weight: 700; color: ${TEAL}; background: ${WHITE}; border: 0.5pt solid ${TEAL}; padding: 1pt 5pt; border-radius: 10pt; }
.q-options { margin: 5pt 0 0 26pt; padding: 0; list-style: disc; font-size: 10pt; color: ${GRAY}; }
.q-options li { margin-bottom: 2pt; }
.q-note { font-size: 9.5pt; color: ${GRAY}; font-style: italic; margin-top: 10pt; }
.empty-note { color: ${GRAY}; font-style: italic; }

/* Quant section */
.resp-total { font-size: 10pt; color: ${GRAY}; font-style: italic; margin-bottom: 10pt; }
.quant-block { margin-bottom: 14pt; }
.q-block-text { font-size: 11pt; font-weight: 700; color: ${NAVY}; margin-bottom: 6pt; }
.resp-count { font-weight: 400; color: ${GRAY}; }
.dist-note { font-size: 9pt; color: ${GRAY}; font-style: italic; margin-top: 5pt; }
.banner-label { font-size: 11pt; font-weight: 700; color: ${NAVY}; margin-bottom: 6pt; }
.quant-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.quant-table th { background: ${NAVY}; color: ${WHITE}; font-weight: 700; padding: 6pt 8pt; text-align: left; border: 0.5pt solid #D5D8DC; font-size: 9.5pt; }
.quant-table td { padding: 5pt 8pt; border: 0.5pt solid #D5D8DC; color: ${INK}; vertical-align: top; }
.quant-table tr.shade td { background: ${ROW_TINT}; }
.quant-table .bold-cell { font-weight: 700; }
.quant-table .wide-col { width: 66%; }
.quant-table .seg-val { font-weight: 700; }
.banner-q-head { text-align: center; border-bottom: 1pt solid rgba(255,255,255,0.3); }
.banner-sub-head { font-size: 8pt; text-align: center; letter-spacing: 0.5pt; color: rgba(255,255,255,0.85); }
.banner-t2b { font-weight: 700; text-align: center; color: ${NAVY}; }
.banner-mean { text-align: center; color: ${GRAY}; font-size: 9.5pt; }
.banner-no-data { text-align: center; color: ${GRAY}; }

/* Analyst Perspective callout */
.perspective-callout {
  margin: 12pt 0;
  padding: 12pt 16pt;
  background: ${ROW_TINT};
  border-left: 4pt solid ${NAVY};
  border-radius: 0 4pt 4pt 0;
}
.perspective-callout .perspective-label {
  font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase;
  color: ${NAVY}; margin-bottom: 6pt;
}
.perspective-callout p { margin: 0; font-style: italic; font-size: 11pt; color: ${INK}; }

/* Analyst Note */
.note p { font-style: italic; font-size: 12pt; line-height: 1.6; color: ${INK}; margin-bottom: 12pt; }
.signature { margin-top: 26pt; padding-top: 10pt; border-top: 2pt solid ${NAVY}; width: 3in; }
.sig-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.sig-title { color: ${GRAY}; font-size: 10pt; }
.voc-closing { margin-top: 18pt; font-size: 10pt; color: ${GRAY}; font-style: italic; }
.brand-footer { display: flex; align-items: center; gap: 12pt; margin-top: 24pt; padding: 14pt 16pt; background: ${WHITE}; border: 1pt solid ${CREAM}; border-top: 3pt solid ${TEAL}; border-radius: 4pt; }
.brand-footer img { width: 40pt; height: 40pt; object-fit: contain; }
.brand-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.brand-meta { color: ${GRAY}; font-size: 9.5pt; }

/* VoC Thematic Analysis cards */
.voc-themes { display: flex; flex-direction: column; gap: 12pt; margin-bottom: 8pt; }
.voc-theme-card { display: flex; gap: 14pt; padding: 12pt 14pt; background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; break-inside: avoid; }
.voc-theme-num { font-size: 22pt; font-weight: 700; color: ${TEAL}; opacity: 0.6; line-height: 1; min-width: 28pt; padding-top: 2pt; }
.voc-theme-body { flex: 1; }
.voc-theme-title { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin-bottom: 5pt; }
.voc-theme-text p { margin: 0 0 5pt; font-size: 11pt; }

/* VoC Recommendation cards */
.voc-rec-list { display: flex; flex-direction: column; gap: 10pt; margin-top: 12pt; }
.voc-rec-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 0 4pt 4pt 0; padding: 12pt 14pt; break-inside: avoid; }
.voc-rec-title { font-size: 12pt; font-weight: 700; margin-bottom: 5pt; }
.voc-rec-body p { margin: 0 0 5pt; font-size: 11pt; }
`;

// ── Document ───────────────────────────────────────────────────────────────

export function buildVocReportHtml(
  order:      VocOrderInfo,
  reportData: VocReportData,
  opts:       BuildOptions = {},
): string {
  // Pre-parse any JSON-stringified values in aiDraft (strips code fences too)
  const parsedDraft: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(reportData.aiDraft)) {
    if (typeof v !== "string") { parsedDraft[k] = v; continue; }
    const stripped = v.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
      try { parsedDraft[k] = JSON.parse(stripped); continue; } catch { /* fall through */ }
    }
    parsedDraft[k] = v;
  }
  const d = parsedDraft as Record<string, unknown>;

  const { analystNote, analystPerspectives, questionMap } = reportData;
  const aiDraft = d;
  const LAST_ID = VOC_SECTIONS[VOC_SECTIONS.length - 1].id;

  const section = (id: VocSectionId, title: string): string => {
    const isLast = id === LAST_ID;
    let content = "";

    if (id === "survey_design") {
      content = surveyDesignContent(questionMap);
    } else if (id === "quantitative_summary") {
      content = quantSectionContent(reportData);
    } else {
      // Map section IDs to their aiDraft keys
      const draftKey: Record<string, string> = {
        thematic_analysis:       "thematic_analysis",
        visual_findings_summary: "visual_findings_summary",
        analyst_interpretation:  "analyst_interpretation",
      };
      const key = draftKey[id] ?? id;
      const rawContent = aiDraft[key] ?? "";
      // For thematic analysis and visual findings: render numbered theme cards if structured
      const renderedContent = (id === "thematic_analysis" || id === "visual_findings_summary")
        ? vocThematicContent(rawContent)
        : id === "analyst_interpretation"
          ? vocInterpretationContent(rawContent)
          : paragraphs(rawContent);
      content = `
        ${renderedContent}
        ${perspectiveCallout(analystPerspectives[key] ?? "")}`;
    }

    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${content}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNoteBlock(analystNote, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  const COVER_SECTIONS = [
    "Survey Design",
    "Quantitative Summary",
    "Thematic Analysis",
    "Visual Findings Summary",
    "Analyst Interpretation & Recommendations",
  ];

  let pages: string;
  if (opts.only) {
    const s = VOC_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Voice of Customer Survey</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-includes">
            <div class="cover-includes-head">This Report Contains</div>
            <ul>${COVER_SECTIONS.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>
          <div class="cover-confidential">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${VOC_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + VOC_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Voice of Customer Survey</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
