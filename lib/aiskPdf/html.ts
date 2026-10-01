// ── AISK (AI Starter Kit) report → self-contained HTML ─────────────────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.
// Prompt sections rendered with teal-bordered card, monospace prompt text,
// and optional italic instructions below. revision_notes omitted when empty.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const CREAM = "#F4EADA";
const WHITE = "#FFFFFF";
const INK   = "#1C1C1C";
const GRAY  = "#6B7280";
const LGRY  = "#F3F6FA";

type Obj = Record<string, unknown>;

export type AiskOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  location?: string | null;
  created_at: string;
};

export type AiskSectionId =
  | "business_type_analysis"
  | "ai_best_practices_introduction"
  | "custom_prompt_1"
  | "custom_prompt_2"
  | "custom_prompt_3"
  | "custom_prompt_4"
  | "custom_prompt_5"
  | "custom_prompt_6"
  | "real_use_case_examples"
  | "revision_notes";

export const AISK_SECTIONS: { id: AiskSectionId; title: string; isPrompt: boolean }[] = [
  { id: "business_type_analysis",         title: "Business Type Analysis",        isPrompt: false },
  { id: "ai_best_practices_introduction", title: "AI Best Practices Introduction", isPrompt: false },
  { id: "custom_prompt_1",               title: "Custom Prompt 1",                isPrompt: true  },
  { id: "custom_prompt_2",               title: "Custom Prompt 2",                isPrompt: true  },
  { id: "custom_prompt_3",               title: "Custom Prompt 3",                isPrompt: true  },
  { id: "custom_prompt_4",               title: "Custom Prompt 4",                isPrompt: true  },
  { id: "custom_prompt_5",               title: "Custom Prompt 5",                isPrompt: true  },
  { id: "custom_prompt_6",               title: "Custom Prompt 6",                isPrompt: true  },
  { id: "real_use_case_examples",        title: "Real Use Case Examples",         isPrompt: false },
  { id: "revision_notes",               title: "Revision Notes",                 isPrompt: false },
];

export type BuildOptions = {
  only?: AiskSectionId;
  pageNumbers?: Partial<Record<AiskSectionId, number>>;
};

/** Sections that will actually appear — revision_notes only when non-empty */
export function effectiveAiskSections(draft: Record<string, unknown>) {
  return AISK_SECTIONS.filter(s => {
    if (s.id === "revision_notes") return !!String(draft[s.id] ?? "").trim();
    return true;
  });
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

/** Prompt card: split on \n---\n; prompt in monospace box, instructions below in italic */
function promptCard(content: unknown): string {
  const raw    = String(content ?? "").trim();
  const parts  = raw.split(/\n---\n/);
  const prompt = (parts[0] ?? raw).trim();
  const instruc = (parts[1] ?? "").trim();
  return `
    <div class="prompt-card">
      <div class="prompt-label">Your Prompt</div>
      <pre class="prompt-text">${esc(prompt)}</pre>
    </div>
    ${instruc ? `<p class="prompt-instructions">${text(instruc)}</p>` : ""}`;
}

function analystNote(note: string, icon: string): string {
  return `
    ${note.trim() ? `<div class="note">${paragraphs(note)}</div>` : ""}
    <div class="signature">
      <div class="sig-name">John Messina</div>
      <div class="sig-title">Founder, Sea Glass Insights</div>
    </div>
    <p class="brand-note">These prompts were written specifically for your business type, voice, and real use cases by a Sea Glass Insights analyst. They are designed to work immediately in ChatGPT, Claude, or any major AI chatbot. This kit includes one round of revisions — reach out with any feedback.</p>
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
    ...AISK_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
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
.keep, .subsection, .prompt-card { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${AISK_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
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
.cover-includes { margin-top: 24pt; text-align: left; width: 4in; }
.cover-includes-head { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; color: ${TEAL}; margin-bottom: 10pt; }
.cover-includes ul { list-style: none; margin: 0; padding: 0; }
.cover-includes li { font-size: 11pt; color: ${NAVY}; margin-bottom: 5pt; }
.cover-includes li::before { content: "\\2014\\00a0"; color: ${TEAL}; font-weight: 700; }
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

/* Prompt card */
.prompt-card {
  margin: 12pt 0;
  padding: 14pt 18pt;
  background: ${LGRY};
  border-left: 5pt solid ${TEAL};
  border-top: 1pt solid ${TEAL};
  border-bottom: 1pt solid ${TEAL};
  border-radius: 0 4pt 4pt 0;
}
.prompt-label {
  font-size: 8.5pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase;
  color: ${TEAL}; margin-bottom: 8pt;
}
.prompt-text {
  font-family: "Courier New", Courier, monospace;
  font-size: 10pt; color: ${INK}; white-space: pre-wrap; line-height: 1.5;
  margin: 0;
}
.prompt-instructions {
  margin-top: 10pt; font-style: italic; color: ${GRAY}; font-size: 10.5pt;
  margin-bottom: 0;
}

/* Analyst Note */
.note p { font-style: italic; font-size: 12pt; line-height: 1.6; color: ${INK}; margin-bottom: 12pt; }
.signature { margin-top: 26pt; padding-top: 10pt; border-top: 2pt solid ${NAVY}; width: 3in; }
.sig-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.sig-title { color: ${GRAY}; font-size: 10pt; }
.brand-note { margin-top: 18pt; font-size: 10pt; color: ${GRAY}; font-style: italic; }
.brand-footer { display: flex; align-items: center; gap: 12pt; margin-top: 24pt; padding: 14pt 16pt; background: ${WHITE}; border: 1pt solid ${CREAM}; border-top: 3pt solid ${TEAL}; border-radius: 4pt; }
.brand-footer img { width: 40pt; height: 40pt; object-fit: contain; }
.brand-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.brand-meta { color: ${GRAY}; font-size: 9.5pt; }
`;

// ── Document ───────────────────────────────────────────────────────────────

export function buildAiskReportHtml(
  order: AiskOrderInfo,
  draft: Obj,
  analystNoteText: string,
  opts: BuildOptions = {},
): string {
  const effective = effectiveAiskSections(draft);
  const LAST_ID   = effective[effective.length - 1]?.id ?? AISK_SECTIONS[AISK_SECTIONS.length - 1].id;

  const section = (s: typeof AISK_SECTIONS[0]) => {
    const isLast  = s.id === LAST_ID;
    const content = draft[s.id];
    return `
    <section class="page sec-${s.id}">
      <h1 class="section-title">${esc(s.title)}</h1>
      ${s.isPrompt ? promptCard(content) : narrativeSection(content)}
      ${isLast ? `
        <div style="margin-top:32pt;padding-top:14pt;border-top:2pt solid ${TEAL}">
          <h2 style="font-size:14pt;font-weight:700;color:${NAVY};margin:0 0 10pt">Analyst Note</h2>
          ${analystNote(analystNoteText, logoAssets.iconLogo)}
        </div>` : ""}
    </section>`;
  };

  let pages: string;

  if (opts.only) {
    const s = AISK_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s);
  } else {
    const nums = opts.pageNumbers ?? {};

    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">AI Starter Kit</div>
          <div class="cover-title">AI STARTER KIT</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-includes">
            <div class="cover-includes-head">This Kit Includes</div>
            <ul>${AISK_SECTIONS.filter(s => s.id !== "revision_notes").map(s => `<li>${esc(s.title)}</li>`).join("")}</ul>
          </div>
          <div class="cover-conf">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;

    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${effective.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;

    pages = cover + contents + effective.map(s => section(s)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | AI Starter Kit</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
