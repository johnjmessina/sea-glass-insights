// ── SSR report → self-contained HTML (printed to PDF by ./render.ts) ──────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.
// Adds per-section Analyst Perspective callout boxes (navy left border).
// Visual upgrade: inline SVG charts, bullet-format cards, reduced prose density.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY      = "#0A2F61";
const TEAL      = "#00CED1";
const CREAM     = "#F4EADA";
const WHITE     = "#FFFFFF";
const INK       = "#1C1C1C";
const GRAY      = "#6B7280";
const ROW_TINT  = "#E8EDF4";
const LIGHT_TEAL = "#E0F7F7";

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

// Convert a string with bullet-like lines to an HTML list
function bulletList(v: unknown): string {
  const s = String(v ?? "").trim();
  const lines = s.split(/\n/).map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  if (lines.length <= 1) return `<p>${text(s)}</p>`;
  return `<ul class="card-bullets">${lines.map(l => `<li>${text(l)}</li>`).join("")}</ul>`;
}

// Parse likelihood string into 0–100 numeric score for charting
function parseLikelihood(raw: string): number | null {
  const s = raw.toLowerCase();
  // "high", "very high", "low", numeric, or "X/10", "X%"
  if (/very\s+high|extremely\s+high/.test(s)) return 88;
  if (/\bhigh\b/.test(s)) return 75;
  if (/\bmedium\b|\bmoderate\b/.test(s)) return 50;
  if (/\blow\b/.test(s)) return 25;
  if (/very\s+low/.test(s)) return 12;
  const pct = s.match(/(\d+)\s*%/);
  if (pct) return Math.min(100, parseInt(pct[1], 10));
  const outOf10 = s.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (outOf10) return Math.round(parseFloat(outOf10[1]) * 10);
  const outOf5 = s.match(/(\d+(?:\.\d+)?)\s*\/\s*5/);
  if (outOf5) return Math.round(parseFloat(outOf5[1]) * 20);
  const digit = s.match(/\b([1-9][0-9]?)\b/);
  if (digit) {
    const n = parseInt(digit[1], 10);
    if (n <= 10) return n * 10;
    if (n <= 100) return n;
  }
  return null;
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
    const val = (c as Obj)[k];
    const body = Array.isArray(val)
      ? `<ul class="card-bullets">${val.map(i => `<li>${text(String(i))}</li>`).join("")}</ul>`
      : paragraphs(val);
    return `<div class="subsection">
      <h3 class="subsection-head">${esc(label)}</h3>
      ${body}
    </div>`;
  }).join("");
}

// ── SVG Inline Charts ──────────────────────────────────────────────────────

// Horizontal bar chart for likelihood scores across all personas
function likelihoodChart(personas: Array<{ name: string; score: number }>): string {
  if (!personas.length) return "";
  const BAR_H = 18;
  const GAP   = 10;
  const LABEL_W = 110;
  const BAR_MAX = 260;
  const PAD = 10;
  const totalH = personas.length * (BAR_H + GAP) - GAP + PAD * 2;
  const totalW = LABEL_W + BAR_MAX + 50; // 50 for score label

  const bars = personas.map((p, i) => {
    const y = PAD + i * (BAR_H + GAP);
    const barW = Math.round((p.score / 100) * BAR_MAX);
    const color = p.score >= 70 ? "#059669" : p.score >= 45 ? TEAL : "#DC6B6B";
    return `
      <text x="0" y="${y + BAR_H - 4}" font-family="Georgia,serif" font-size="9" fill="${NAVY}" text-anchor="start">${esc(p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name)}</text>
      <rect x="${LABEL_W}" y="${y}" width="${barW}" height="${BAR_H}" rx="3" fill="${color}" opacity="0.85"/>
      <text x="${LABEL_W + barW + 5}" y="${y + BAR_H - 4}" font-family="Georgia,serif" font-size="9" fill="${GRAY}">${p.score}%</text>`;
  }).join("");

  return `
    <div class="chart-block">
      <div class="chart-title">Likelihood to Convert — Overview</div>
      <svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%">
        ${bars}
        <line x1="${LABEL_W}" y1="${PAD}" x2="${LABEL_W}" y2="${totalH - PAD}" stroke="#DDD" stroke-width="1"/>
      </svg>
    </div>`;
}

// Horizontal bar chart for thematic analysis — shows theme count/strength visually
function themeStrengthChart(themes: Array<{ title: string; strength?: number }>): string {
  if (!themes.length) return "";
  const BAR_H = 16;
  const GAP   = 10;
  const LABEL_W = 140;
  const BAR_MAX = 230;
  const PAD = 10;
  const totalH = themes.length * (BAR_H + GAP) - GAP + PAD * 2;
  const totalW = LABEL_W + BAR_MAX + 30;

  // Assign decreasing weights if not provided (first theme = highest)
  const bars = themes.map((t, i) => {
    const y = PAD + i * (BAR_H + GAP);
    const strength = t.strength ?? Math.round(100 - (i * (100 / (themes.length + 1))));
    const barW = Math.round((strength / 100) * BAR_MAX);
    const opacity = 0.9 - i * 0.08;
    return `
      <text x="0" y="${y + BAR_H - 3}" font-family="Georgia,serif" font-size="9" fill="${NAVY}">${esc(t.title.length > 20 ? t.title.slice(0, 19) + "…" : t.title)}</text>
      <rect x="${LABEL_W}" y="${y}" width="${barW}" height="${BAR_H}" rx="3" fill="${TEAL}" opacity="${Math.max(0.35, opacity)}"/>`;
  }).join("");

  return `
    <div class="chart-block">
      <div class="chart-title">Theme Signal Strength</div>
      <svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%">
        ${bars}
        <line x1="${LABEL_W}" y1="${PAD}" x2="${LABEL_W}" y2="${totalH - PAD}" stroke="#DDD" stroke-width="1"/>
      </svg>
      <div class="chart-note">Relative signal strength — themes listed in order of prominence</div>
    </div>`;
}

// Mini donut / gauge for a single likelihood score inside a persona card
function likelihoodGauge(score: number, color: string): string {
  const r = 18;
  const cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5"
      stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
      stroke-dashoffset="${(circ * 0.25).toFixed(1)}"
      stroke-linecap="round"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="bold" fill="${NAVY}">${score}%</text>
  </svg>`;
}

// ── Persona Cards ──────────────────────────────────────────────────────────

function personaCards(content: unknown, showLikelihoodChart = false): string {
  if (Array.isArray(content) && content.length) {
    const PERSONA_ACCENTS = [TEAL, NAVY, "#059669", "#8FADC8", "#DC6B6B", "#059669"];

    // Collect likelihood data for the overview chart
    const chartData: Array<{ name: string; score: number }> = [];
    content.forEach((p) => {
      const g = obj(p);
      const name = String(g.name ?? g.persona_name ?? "");
      const rawLikelihood = String(g.likelihood ?? g.subscription_likelihood ?? g.likelihood_to_subscribe ?? "");
      const score = parseLikelihood(rawLikelihood);
      if (name && score !== null) chartData.push({ name, score });
    });

    const cards = content.map((p, i) => {
      const g = obj(p);
      const accent = PERSONA_ACCENTS[i % PERSONA_ACCENTS.length];
      const name   = String(g.name ?? g.persona_name ?? `Persona ${i + 1}`);
      const desc   = String(g.description ?? g.desc ?? g.profile ?? "");
      const motivation = String(g.motivation ?? g.motivations ?? g.primary_motivation ?? "");
      const concern    = String(g.concern ?? g.concerns ?? g.primary_concern ?? g.objection ?? "");
      const rawLikelihood = String(g.likelihood ?? g.subscription_likelihood ?? g.likelihood_to_subscribe ?? "");
      const quote   = String(g.quote ?? g.simulated_response ?? g.representative_response ?? "");
      const score   = parseLikelihood(rawLikelihood);
      const gaugeColor = score !== null ? (score >= 70 ? "#059669" : score >= 45 ? TEAL : "#DC6B6B") : accent;

      // Extra fields — demographics, behaviors, tags, etc.
      const SKIP = new Set(["name","persona_name","description","desc","profile","motivation","motivations","primary_motivation","concern","concerns","primary_concern","objection","likelihood","subscription_likelihood","likelihood_to_subscribe","quote","simulated_response","representative_response"]);
      const extraFields = Object.entries(g)
        .filter(([k]) => !SKIP.has(k) && g[k])
        .slice(0, 4);

      return `<div class="persona-card" style="border-top:3pt solid ${accent}">
        <div class="persona-header">
          <div class="persona-name" style="color:${accent}">${esc(name)}</div>
          ${score !== null ? likelihoodGauge(score, gaugeColor) : ""}
        </div>
        ${desc ? `<p class="persona-desc">${text(desc)}</p>` : ""}
        <div class="persona-fields">
          ${motivation ? `<div class="persona-field"><span class="persona-field-label">Motivation</span><span>${text(motivation)}</span></div>` : ""}
          ${concern    ? `<div class="persona-field"><span class="persona-field-label">Concern</span><span>${text(concern)}</span></div>` : ""}
          ${rawLikelihood && score === null ? `<div class="persona-field"><span class="persona-field-label">Likelihood</span><span>${text(rawLikelihood)}</span></div>` : ""}
          ${extraFields.map(([k, v]) => {
            const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            const valStr = Array.isArray(v)
              ? v.slice(0, 3).map(x => String(x)).join(" · ")
              : String(v);
            return `<div class="persona-field"><span class="persona-field-label">${esc(label)}</span><span>${text(valStr)}</span></div>`;
          }).join("")}
        </div>
        ${quote ? `<div class="persona-quote">&ldquo;${text(quote)}&rdquo;</div>` : ""}
      </div>`;
    }).join("");

    return `
      ${showLikelihoodChart && chartData.length >= 2 ? likelihoodChart(chartData) : ""}
      <div class="persona-grid">${cards}</div>`;
  }
  return narrativeSection(content);
}

// ── Thematic Analysis ──────────────────────────────────────────────────────

function thematicAnalysis(content: unknown): string {
  if (Array.isArray(content) && content.length) {
    // Build chart data
    const chartThemes = content.map((t) => {
      const g = obj(t);
      const title = String(g.theme ?? g.title ?? g.finding ?? "Theme");
      const strength = typeof g.strength === "number" ? g.strength as number : undefined;
      return { title, strength };
    });

    const cards = content.map((t, i) => {
      const g = obj(t);
      const title   = String(g.theme ?? g.title ?? g.finding ?? `Theme ${i + 1}`);
      const body    = String(g.body ?? g.description ?? g.detail ?? "");
      const support = String(g.evidence ?? g.support ?? "");
      const implications = arr(g.implications ?? g.action_items ?? []);

      return `<div class="theme-card">
        <div class="theme-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="theme-body">
          <div class="theme-title">${text(title)}</div>
          ${body    ? `<p>${text(body)}</p>` : ""}
          ${support ? `<p class="theme-evidence">${text(support)}</p>` : ""}
          ${implications.length ? `<ul class="card-bullets theme-bullets">${implications.map(x => `<li>${text(String(x))}</li>`).join("")}</ul>` : ""}
        </div>
      </div>`;
    }).join("");

    return `
      ${themeStrengthChart(chartThemes)}
      <div class="themes">${cards}</div>`;
  }
  return narrativeSection(content);
}

// ── Directional Recommendations ────────────────────────────────────────────

function recommendationCards(content: unknown): string {
  if (Array.isArray(content) && content.length) {
    return `<div class="rec-list">${content.map((r, i) => {
      const g = obj(r);
      const title    = String(g.title ?? g.recommendation ?? g.action ?? `Recommendation ${i + 1}`);
      const body     = String(g.body ?? g.description ?? g.rationale ?? "");
      const steps    = arr(g.steps ?? g.action_items ?? g.next_steps ?? []);
      const rawLabel = String(g.label ?? g.priority ?? "");
      const p1 = rawLabel === "P1" || rawLabel === "1" || Number(g.priority) === 1;
      const p2 = rawLabel === "P2" || rawLabel === "2" || Number(g.priority) === 2;
      const accent   = p1 ? NAVY : p2 ? TEAL : "#6B7280";
      const label    = p1 ? "Priority 1" : p2 ? "Priority 2" : rawLabel ? `Priority ${rawLabel.replace(/^P/, "")}` : `Rec ${i + 1}`;
      return `<div class="ssr-rec" style="border-left:4pt solid ${accent}">
        <div class="ssr-rec-header">
          <div>
            <div class="ssr-rec-label" style="color:${accent}">${esc(label)}</div>
            <div class="ssr-rec-title">${text(title)}</div>
          </div>
          <div class="rec-priority-badge" style="background:${accent}">${esc(label.replace("Priority ", "P"))}</div>
        </div>
        ${body  ? `<p class="ssr-rec-body">${text(body)}</p>` : ""}
        ${steps.length ? `<ul class="card-bullets">${steps.map(s => `<li>${text(String(s))}</li>`).join("")}</ul>` : ""}
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
p { margin: 0 0 7pt; }
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

/* Bullet lists inside cards */
.card-bullets { margin: 5pt 0 6pt 14pt; padding: 0; }
.card-bullets li { font-size: 10.5pt; color: ${INK}; margin-bottom: 3pt; line-height: 1.4; }
.theme-bullets { margin-top: 6pt; }
.theme-bullets li { font-size: 10pt; color: ${GRAY}; }

/* Chart blocks */
.chart-block {
  margin: 0 0 16pt;
  padding: 12pt 14pt;
  background: ${ROW_TINT};
  border-radius: 4pt;
  border-left: 3pt solid ${TEAL};
  break-inside: avoid; page-break-inside: avoid;
}
.chart-title {
  font-size: 9.5pt; font-weight: 700; color: ${NAVY}; text-transform: uppercase;
  letter-spacing: 1pt; margin-bottom: 10pt;
}
.chart-note { font-size: 8.5pt; color: ${GRAY}; font-style: italic; margin-top: 6pt; }

/* Persona Cards */
.persona-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 8pt; }
.persona-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.persona-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6pt; }
.persona-name { font-size: 13pt; font-weight: 700; flex: 1; padding-right: 8pt; }
.persona-desc { font-size: 10.5pt; color: ${INK}; margin: 0 0 8pt; line-height: 1.4; }
.persona-fields { display: flex; flex-direction: column; gap: 4pt; margin-bottom: 6pt; }
.persona-field { font-size: 10pt; color: ${INK}; display: flex; gap: 5pt; align-items: baseline; }
.persona-field-label { font-weight: 700; color: ${NAVY}; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.8pt; flex-shrink: 0; }
.persona-quote { margin-top: 8pt; padding: 7pt 10pt; background: ${LIGHT_TEAL}; border-left: 3pt solid ${TEAL}; font-style: italic; font-size: 10pt; color: ${INK}; border-radius: 0 3pt 3pt 0; line-height: 1.4; }

/* Thematic Analysis */
.themes { display: flex; flex-direction: column; gap: 10pt; }
.theme-card { display: flex; gap: 14pt; padding: 11pt 14pt; background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; break-inside: avoid; }
.theme-num { font-size: 22pt; font-weight: 700; color: ${TEAL}; opacity: 0.6; line-height: 1; min-width: 28pt; padding-top: 2pt; }
.theme-body { flex: 1; }
.theme-title { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin-bottom: 4pt; }
.theme-body p { margin: 0 0 4pt; font-size: 10.5pt; }
.theme-evidence { font-style: italic; color: ${GRAY}; font-size: 10pt; }

/* Directional Recommendations */
.rec-list { display: flex; flex-direction: column; gap: 10pt; }
.ssr-rec { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 0 4pt 4pt 0; padding: 12pt 14pt; break-inside: avoid; }
.ssr-rec-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6pt; }
.ssr-rec-label { font-size: 8pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 3pt; }
.ssr-rec-title { font-size: 12pt; font-weight: 700; color: ${NAVY}; }
.ssr-rec-body { margin: 0 0 5pt; font-size: 10.5pt; color: ${INK}; }
.rec-priority-badge {
  font-size: 8pt; font-weight: 700; color: ${WHITE}; padding: 3pt 8pt;
  border-radius: 10pt; white-space: nowrap; flex-shrink: 0; margin-left: 8pt;
}

/* Analyst Perspective callout */
.perspective-callout {
  margin: 12pt 0;
  padding: 11pt 16pt;
  background: ${ROW_TINT};
  border-left: 4pt solid ${NAVY};
  border-radius: 0 4pt 4pt 0;
}
.perspective-callout .perspective-label {
  font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase;
  color: ${NAVY}; margin-bottom: 5pt;
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
    if (id === "customer_personas")           return personaCards(content, false);
    if (id === "persona_response_simulation") return personaCards(content, true); // chart on simulation page
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
          <div class="cover-type">Synthetic Customer Profiles</div>
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
<title>${esc(order.business_name)} | Synthetic Customer Profiles</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
