// ── SSR report → self-contained HTML (printed to PDF by ./render.ts) ──────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.
// Adds per-section Analyst Perspective callout boxes (navy left border).

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

export type SsrOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  location?: string | null;
  created_at: string;
};

export type SsrSectionId =
  | "research_question_framework"
  | "customer_personas"
  | "persona_response_simulation"
  | "thematic_analysis"
  | "directional_recommendations"
  | "methodology_disclosure"
  | "honest_limitations_statement";

export const SSR_SECTIONS: { id: SsrSectionId; title: string }[] = [
  { id: "research_question_framework",  title: "Research Question Framework" },
  { id: "customer_personas",            title: "Customer Personas" },
  { id: "persona_response_simulation",  title: "Persona Response Simulation" },
  { id: "thematic_analysis",            title: "Thematic Analysis" },
  { id: "directional_recommendations",  title: "Directional Recommendations" },
  { id: "methodology_disclosure",       title: "Methodology Disclosure" },
  { id: "honest_limitations_statement", title: "Honest Limitations Statement" },
];

export type BuildOptions = {
  only?: SsrSectionId;
  pageNumbers?: Partial<Record<SsrSectionId, number>>;
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

// Generic narrative section: handles plain string or keyed object
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

// Persona cards — if AI returns an array of persona objects, render as cards;
// otherwise fall back to narrativeSection prose
function personaCards(content: unknown): string {
  if (Array.isArray(content) && content.length) {
    const PERSONA_ACCENTS = [TEAL, NAVY, "#059669", "#8FADC8", "#DC6B6B", "#059669"];
    return `<div class="persona-grid">${content.map((p, i) => {
      const g = obj(p);
      const accent = PERSONA_ACCENTS[i % PERSONA_ACCENTS.length];
      const name   = String(g.name ?? g.persona_name ?? `Persona ${i + 1}`);
      const desc   = String(g.description ?? g.desc ?? g.profile ?? "");
      const motivation = String(g.motivation ?? g.motivations ?? g.primary_motivation ?? "");
      const concern    = String(g.concern ?? g.concerns ?? g.primary_concern ?? g.objection ?? "");
      const likelihood = String(g.likelihood ?? g.subscription_likelihood ?? g.likelihood_to_subscribe ?? "");
      const quote      = String(g.quote ?? g.simulated_response ?? g.representative_response ?? "");
      return `<div class="persona-card" style="border-top:3pt solid ${accent}">
        <div class="persona-name" style="color:${accent}">${esc(name)}</div>
        ${desc ? `<p class="persona-desc">${text(desc)}</p>` : ""}
        ${motivation ? `<div class="persona-field"><span class="persona-field-label">Motivation</span>${text(motivation)}</div>` : ""}
        ${concern    ? `<div class="persona-field"><span class="persona-field-label">Concern</span>${text(concern)}</div>` : ""}
        ${likelihood ? `<div class="persona-field"><span class="persona-field-label">Likelihood</span>${text(likelihood)}</div>` : ""}
        ${quote      ? `<div class="persona-quote">&ldquo;${text(quote)}&rdquo;</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }
  return narrativeSection(content);
}

// Directional recommendations — if AI returns array, render tiered rec cards
function recommendationCards(content: unknown): string {
  if (Array.isArray(content) && content.length) {
    return `<div class="rec-list">${content.map((r, i) => {
      const g = obj(r);
      const title    = String(g.title ?? g.recommendation ?? g.action ?? `Recommendation ${i + 1}`);
      const body     = String(g.body ?? g.description ?? g.rationale ?? "");
      const rawLabel = String(g.label ?? g.priority ?? "");
      const p1 = rawLabel === "P1" || rawLabel === "1" || Number(g.priority) === 1;
      const p2 = rawLabel === "P2" || rawLabel === "2" || Number(g.priority) === 2;
      const accent   = p1 ? NAVY : p2 ? TEAL : "#6B7280";
      const label    = p1 ? "Priority 1" : p2 ? "Priority 2" : rawLabel ? `Priority ${rawLabel.replace(/^P/, "")}` : `Rec ${i + 1}`;
      return `<div class="ssr-rec" style="border-left:4pt solid ${accent}">
        <div class="ssr-rec-label" style="color:${accent}">${esc(label)}</div>
        <div class="ssr-rec-title">${text(title)}</div>
        ${body ? `<p class="ssr-rec-body">${text(body)}</p>` : ""}
      </div>`;
    }).join("")}</div>`;
  }
  return narrativeSection(content);
}

// Thematic analysis — pull out numbered themes if structured, else fallback
function thematicAnalysis(content: unknown): string {
  if (Array.isArray(content) && content.length) {
    return `<div class="themes">${content.map((t, i) => {
      const g = obj(t);
      const title   = String(g.theme ?? g.title ?? g.finding ?? `Theme ${i + 1}`);
      const body    = String(g.body ?? g.description ?? g.detail ?? "");
      const support = String(g.evidence ?? g.support ?? "");
      return `<div class="theme-card">
        <div class="theme-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="theme-body">
          <div class="theme-title">${text(title)}</div>
          ${body    ? `<p>${text(body)}</p>` : ""}
          ${support ? `<p class="theme-evidence">${text(support)}</p>` : ""}
        </div>
      </div>`;
    }).join("")}</div>`;
  }
  return narrativeSection(content);
}

// Analyst Perspective callout — navy left border, light navy background
function perspectiveCallout(perspectiveText: string): string {
  if (!perspectiveText || !perspectiveText.trim()) return "";
  return `
    <div class="perspective-callout">
      <div class="perspective-label">Analyst Perspective</div>
      <p>${text(perspectiveText)}</p>
    </div>`;
}

function analystNote(
  note: string,
  perspectives: Record<string, string>,
  icon: string,
): string {
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
      ${SSR_SECTIONS.filter(s => perspectives[s.id]?.trim()).map(s => `
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
    `@page cover { margin: 1in; }`,
    `@page contents { ${chrome("Contents")} }`,
    ...SSR_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .card, .subsection, .perspective-callout, .perspective-item { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${SSR_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
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

/* Subsections */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

/* Persona Cards */
.persona-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 8pt; }
.persona-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.persona-name { font-size: 13pt; font-weight: 700; margin-bottom: 6pt; }
.persona-desc { font-size: 11pt; color: ${INK}; margin: 0 0 8pt; }
.persona-field { font-size: 10pt; margin-bottom: 5pt; color: ${INK}; }
.persona-field-label { font-weight: 700; color: ${NAVY}; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 1pt; margin-right: 6pt; }
.persona-quote { margin-top: 8pt; padding: 8pt 10pt; background: ${ROW_TINT}; border-left: 3pt solid ${TEAL}; font-style: italic; font-size: 10.5pt; color: ${INK}; border-radius: 0 3pt 3pt 0; }

/* Thematic Analysis */
.themes { display: flex; flex-direction: column; gap: 12pt; }
.theme-card { display: flex; gap: 14pt; padding: 12pt 14pt; background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; break-inside: avoid; }
.theme-num { font-size: 22pt; font-weight: 700; color: ${TEAL}; opacity: 0.6; line-height: 1; min-width: 28pt; padding-top: 2pt; }
.theme-body { flex: 1; }
.theme-title { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin-bottom: 5pt; }
.theme-body p { margin: 0 0 5pt; font-size: 11pt; }
.theme-evidence { font-style: italic; color: ${GRAY}; font-size: 10.5pt; }

/* Directional Recommendations */
.rec-list { display: flex; flex-direction: column; gap: 10pt; }
.ssr-rec { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 0 4pt 4pt 0; padding: 12pt 14pt; break-inside: avoid; }
.ssr-rec-label { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 4pt; }
.ssr-rec-title { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin-bottom: 5pt; }
.ssr-rec-body { margin: 0; font-size: 11pt; color: ${INK}; }

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

export function buildSsrReportHtml(
  order: SsrOrderInfo,
  draft: Obj,
  analystNoteText: string,
  analystPerspectives: Record<string, string> = {},
  opts: BuildOptions = {},
): string {
  // Pre-parse any JSON-stringified values (strips code fences too)
  const parsedDraft: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(draft)) {
    if (typeof v !== "string") { parsedDraft[k] = v; continue; }
    const stripped = v.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
      try { parsedDraft[k] = JSON.parse(stripped); continue; } catch { /* fall through */ }
    }
    parsedDraft[k] = v;
  }
  const d = parsedDraft as Record<string, unknown>;

  const LAST_ID = SSR_SECTIONS[SSR_SECTIONS.length - 1].id;

  const sectionBody = (id: SsrSectionId, content: unknown): string => {
    if (id === "customer_personas")           return personaCards(content);
    if (id === "persona_response_simulation") return personaCards(content);
    if (id === "thematic_analysis")           return thematicAnalysis(content);
    if (id === "directional_recommendations") return recommendationCards(content);
    return narrativeSection(content);
  };

  const section = (id: SsrSectionId, title: string) => {
    const isLast = id === LAST_ID;
    const content = d[id];
    const perspective = analystPerspectives[id] ?? "";
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${sectionBody(id, content)}
      ${perspectiveCallout(perspective)}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNote(analystNoteText, analystPerspectives, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  let pages: string;
  if (opts.only) {
    const s = SSR_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Synthetic Survey Report</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-confidential">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${SSR_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + SSR_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Synthetic Survey Report</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
