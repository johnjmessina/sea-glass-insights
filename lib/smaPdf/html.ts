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

/* Subsections */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

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

  const section = (id: SmaSectionId, title: string) => {
    const isLast = id === LAST_ID;
    const content = draft[id];
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${narrativeSection(content)}
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
          <div class="cover-title">SOCIAL MEDIA AUDIT</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-conf">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
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
