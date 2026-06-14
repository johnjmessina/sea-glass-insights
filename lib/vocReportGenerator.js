/**
 * Sea Glass Insights — Voice of Customer Survey Report Generator (v2)
 *
 * Phase 1: Survey Design (formatted question map).
 * Phase 2: Quantitative tables (T2B/B2B, frequencies, banner cuts) + AI narrative sections.
 */

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Table, TableRow, TableCell,
  LevelFormat, PageBreak, Header, Footer, ImageRun
} = require('docx');
const JSZip      = require('jszip');
const logoAssets = require('./logoAssets');

// ── BRAND ─────────────────────────────────────────────────
const NAVY = "0A2F61";
const TEAL = "00CED1";
const GRAY = "6B7280";
const INK  = "1C1C1C";
const LGRY = "F3F6FA";
const CG   = "Cormorant Garamond";
const MT   = "Montserrat";

const coverLogoData = Buffer.from(logoAssets.coverLogo, 'base64');
const iconLogoData  = Buffer.from(logoAssets.iconLogo,  'base64');

// ── POST-PROCESS ──────────────────────────────────────────
async function postProcessDocx(buf) {
  const zip  = await JSZip.loadAsync(buf);
  const xmls = Object.keys(zip.files).filter(f => f.match(/^word\/(document|header\d*|footer\d*)\.xml$/));
  for (const p of xmls) {
    let xml = await zip.file(p).async('string');
    if (!xml.includes('<pic:spPr')) continue;
    xml = xml.replace(/(<\/a:prstGeom>)(<\/pic:spPr>)/g, '$1<a:noFill/><a:ln><a:noFill/></a:ln>$2');
    xml = xml.replace(/(<pic:spPr[^>]*>)([\s\S]*?)(<\/pic:spPr>)/g,
      (m, o, i, c) => o + i.replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/g, '') + c);
    zip.file(p, xml);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ── PARAGRAPH HELPERS ─────────────────────────────────────

function stripMd(text) {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{3}([^*\n]+)\*{3}/g, "$1")
    .replace(/\*{2}([^*\n]+)\*{2}/g, "$1")
    .replace(/_{2}([^_\n]+)_{2}/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

const sp = (n = 1) => new Paragraph({ spacing: { before: n * 80, after: 0 }, children: [new TextRun("")] });

const body = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text: stripMd(text), size: 22, font: MT, color: INK, ...opts })]
});

const sectionHead = (num, text) => new Paragraph({
  spacing: { before: 440, after: 0 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
  children: [
    new TextRun({ text: `${num}. `, bold: true, size: 34, font: CG, color: TEAL }),
    new TextRun({ text, bold: true, size: 34, font: CG, color: NAVY })
  ]
});

const phaseLabel = (text) => new Paragraph({
  spacing: { before: 480, after: 120 },
  children: [new TextRun({ text, size: 16, font: MT, bold: true, color: TEAL, allCaps: true })]
});

const subHead = (text) => new Paragraph({
  spacing: { before: 240, after: 80 },
  children: [new TextRun({ text, size: 18, font: MT, bold: true, color: NAVY, allCaps: true })]
});

// ── ANALYST PERSPECTIVE CALLOUT ───────────────────────────
function analystCallout(text) {
  if (!text || !text.trim()) return [];
  const noBdr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return [sp(0.5), new Table({
    width: { size: 9720, type: WidthType.DXA }, columnWidths: [9720],
    rows: [new TableRow({ children: [new TableCell({
      borders: { left: { style: BorderStyle.THICK, size: 16, color: NAVY }, top: noBdr, bottom: noBdr, right: noBdr },
      shading: { fill: "EEF3F9", type: ShadingType.CLEAR },
      margins: { left: 220, right: 160, top: 120, bottom: 120 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "ANALYST PERSPECTIVE", size: 16, font: MT, bold: true, color: NAVY, allCaps: true })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: text.trim(), size: 21, font: MT, color: INK, italics: true })] }),
      ],
    })]})],
  }), sp(0.5)];
}

// ── TABLE CELL BUILDERS ───────────────────────────────────
const bdr   = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const allBdr= { top: bdr, bottom: bdr, left: bdr, right: bdr };
const hdBdr = { top: bdr, bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY }, left: bdr, right: bdr };

function hCell(text, w) {
  return new TableCell({
    borders: hdBdr,
    shading: { fill: "0A2F61", type: ShadingType.CLEAR },
    width: { size: w, type: WidthType.DXA },
    margins: { left: 100, right: 80, top: 80, bottom: 80 },
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, size: 18, font: MT, bold: true, color: "FFFFFF" })] })]
  });
}

function dCell(text, w, shade, bold) {
  return new TableCell({
    borders: allBdr,
    shading: { fill: shade ? LGRY : "FFFFFF", type: ShadingType.CLEAR },
    width: { size: w, type: WidthType.DXA },
    margins: { left: 100, right: 80, top: 60, bottom: 60 },
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: String(text ?? ""), size: 19, font: MT, color: INK, bold: !!bold })] })]
  });
}

// ── QUANT TABLE BUILDERS ──────────────────────────────────
function buildScaleTable(q, stat) {
  if (!stat) return [];
  const dist    = stat.distribution ?? {};
  const distStr = [1,2,3,4,5,6,7].map(i => `${i}: ${dist[String(i)] ?? 0}`).join("   ");
  return [
    sp(0.3),
    new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: q.text, size: 21, font: MT, color: INK, bold: true })] }),
    new Table({
      width: { size: 9720, type: WidthType.DXA }, columnWidths: [3240, 3240, 3240],
      rows: [
        new TableRow({ children: [hCell("T2B (6-7)", 3240), hCell("Mean Score", 3240), hCell("B2B (1-2)", 3240)] }),
        new TableRow({ children: [dCell(`${stat.t2b ?? 0}%`, 3240, false, true), dCell(String(stat.mean ?? 0), 3240, false, false), dCell(`${stat.b2b ?? 0}%`, 3240, false, false)] }),
      ]
    }),
    new Paragraph({ spacing: { before: 60, after: 0 }, children: [new TextRun({ text: `Distribution (n=${stat.totalResponded ?? 0}): ${distStr}`, size: 18, font: MT, color: GRAY, italics: true })] }),
    sp(0.3),
  ];
}

function buildFreqTable(q, stat) {
  if (!stat?.frequencies) return [];
  const entries = Object.entries(stat.frequencies).sort(([,a],[,b]) => b - a);
  return [
    sp(0.3),
    new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: `${q.text} (n=${stat.totalResponded ?? 0})`, size: 21, font: MT, color: INK, bold: true })] }),
    new Table({
      width: { size: 9720, type: WidthType.DXA }, columnWidths: [6480, 1620, 1620],
      rows: [
        new TableRow({ children: [hCell("Response", 6480), hCell("Count", 1620), hCell("%", 1620)] }),
        ...entries.map(([opt, cnt], i) => new TableRow({ children: [
          dCell(opt, 6480, i % 2 === 1, false),
          dCell(String(cnt), 1620, i % 2 === 1, false),
          dCell(`${stat.percentages?.[opt] ?? 0}%`, 1620, i % 2 === 1, false),
        ]})),
      ]
    }),
    sp(0.3),
  ];
}

function buildBannerTables(questions, quantData) {
  if (!quantData?.bannerCuts) return [];
  const result  = [];
  const scaleQs = questions.filter(q => q.type === "scale_1_7");
  for (const [svId, cuts] of Object.entries(quantData.bannerCuts)) {
    const sv   = questions.find(q => q.id === svId);
    if (!sv) continue;
    const tgtQs  = scaleQs.filter(q => q.id !== svId);
    if (!tgtQs.length) continue;
    const firstW = 2400;
    const restW  = Math.floor((9720 - firstW) / tgtQs.length);
    const widths = [firstW, ...tgtQs.map(() => restW)];
    result.push(sp(0.5));
    result.push(new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: `Banner: "${sv.text}"`, size: 21, font: MT, color: NAVY, bold: true })] }));
    result.push(new Table({
      width: { size: 9720, type: WidthType.DXA }, columnWidths: widths,
      rows: [
        new TableRow({ children: [hCell("Segment", firstW), ...tgtQs.map((tq, i) => hCell(tq.text.slice(0, 28) + (tq.text.length > 28 ? "…" : ""), widths[i + 1]))] }),
        ...Object.entries(cuts).map(([sv2, segData], ri) => new TableRow({ children: [
          dCell(sv2, firstW, ri % 2 === 1, true),
          ...tgtQs.map((tq, ci) => {
            const cell = segData[tq.id];
            return dCell(cell ? `T2B: ${cell.t2b}%  Mean: ${cell.mean}` : "—", widths[ci + 1], ri % 2 === 1, false);
          }),
        ]})),
      ]
    }));
    result.push(sp(0.5));
  }
  return result;
}

// ── DATE ──────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? String(str || '') : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// ── QUESTION MAP TEXT ─────────────────────────────────────
function fmtQuestionMap(questions) {
  const typeLabels = { scale_1_7: "Linear Scale 1–7", multiple_choice: "Multiple Choice", select_all: "Checkboxes", open_ended: "Paragraph" };
  return (questions || []).map((q, i) => {
    let out = `${i + 1}. ${q.text}\n   [${typeLabels[q.type] ?? q.type}]`;
    if ((q.type === "multiple_choice" || q.type === "select_all") && q.options?.length)
      out += "\n" + q.options.map(o => `   • ${o}`).join("\n");
    return out;
  }).join("\n\n");
}

// ── MAIN EXPORT ───────────────────────────────────────────
async function generateVOCReport(orderData, aiDraft, analystNote, analystPerspectives, questionMap, quantData) {
  const CLIENT   = orderData.business_name ?? "Client";
  const CUSTOMER = orderData.customer_name ?? "";
  const LOCATION = orderData.location ?? "";
  const DATE     = fmtDate(orderData.created_at);
  const qMap     = questionMap ?? [];
  const ap       = analystPerspectives ?? {};

  const scaleQs = qMap.filter(q => q.type === "scale_1_7");
  const mcQs    = qMap.filter(q => q.type === "multiple_choice" || q.type === "select_all");
  const scaleTbls  = scaleQs.flatMap(q => buildScaleTable(q, quantData?.questionStats?.[q.id]));
  const freqTbls   = mcQs.flatMap(q => buildFreqTable(q, quantData?.questionStats?.[q.id]));
  const bannerTbls = buildBannerTables(qMap, quantData);
  const hasQuant   = quantData && (scaleTbls.length + freqTbls.length + bannerTbls.length) > 0;

  const COVER_SECTIONS = ["Survey Design", "Quantitative Summary", "Thematic Analysis", "Visual Findings Summary", "Analyst Interpretation & Recommendations"];

  const doc = new Document({
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 280 } } } }] }] },
    styles: { default: { document: { run: { font: MT, size: 22 } } } },
    sections: [
      // ── COVER ──────────────────────────────────────────────
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 480 }, children: [new ImageRun({ data: coverLogoData, transformation: { width: 420, height: 128 }, type: 'png' })] }),
          new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 0 } }, spacing: { before: 0, after: 360 }, children: [new TextRun("")] }),
          new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: "VOICE OF CUSTOMER SURVEY", size: 18, font: MT, bold: true, color: TEAL, allCaps: true })] }),
          new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: CLIENT, bold: true, size: 80, font: CG, color: NAVY })] }),
          new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? "  |  " + LOCATION : ""}  |  ${DATE}`, size: 20, font: MT, color: GRAY })] }),
          new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } }, spacing: { before: 240, after: 1080 }, children: [new TextRun("")] }),
          new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: "THIS REPORT CONTAINS", size: 16, font: MT, color: TEAL, allCaps: true, bold: true })] }),
          ...COVER_SECTIONS.map(s => new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }), new TextRun({ text: s, size: 20, font: CG, bold: true, color: NAVY })] })),
          sp(4),
          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 8 } }, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Sea Glass Insights  |  John Messina, Founder  |  seaglassinsights.com", size: 17, font: MT, color: GRAY }), new TextRun({ text: "     CONFIDENTIAL", size: 17, font: MT, color: TEAL, bold: true })] }),
          new Paragraph({ children: [new PageBreak()] }),
        ]
      },
      // ── BODY ───────────────────────────────────────────────
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, right: 1260, bottom: 1440, left: 1260, footer: 720 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0 }, children: [new ImageRun({ data: iconLogoData, transformation: { width: 72, height: 49 }, type: 'png' })] })] }) },
        footers: { default: new Footer({ children: [
          new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 4 } }, spacing: { before: 60, after: 0 }, children: [new TextRun({ text: `${CLIENT} — Confidential`, size: 18, font: MT, color: GRAY })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `Sea Glass Insights  |  John Messina, Founder  |  ${DATE}`, size: 18, font: MT, color: GRAY })] }),
        ]})},
        children: [
          phaseLabel("Phase 1 — Survey Design"),
          sectionHead("1", "Survey Design"),
          sp(0.5),
          body(fmtQuestionMap(qMap)),
          body("Copy these questions directly into Google Forms or your preferred survey tool.", { color: GRAY, italics: true, size: 20 }),
          ...analystCallout(ap["survey_design"] || ""),
          sp(2),

          phaseLabel("Phase 2 — Analysis"),

          sectionHead("2", "Quantitative Summary"),
          sp(0.5),
          ...(hasQuant ? [
            new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: `Total responses: ${quantData.totalResponses}`, size: 20, font: MT, color: GRAY, italics: true })] }),
            ...(scaleTbls.length ? [subHead("Rating Scales (1–7)"), ...scaleTbls] : []),
            ...(freqTbls.length  ? [subHead("Frequency Breakdowns"), ...freqTbls]  : []),
            ...(bannerTbls.length? [subHead("Banner Cut Tables"),    ...bannerTbls] : []),
            sp(1),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Narrative Summary", size: 24, font: CG, bold: true, color: NAVY })] }),
          ] : []),
          body(aiDraft["quant_summary"] || ""),
          ...analystCallout(ap["quant_summary"] || ""),
          sp(2),

          sectionHead("3", "Thematic Analysis"),
          sp(0.5),
          body(aiDraft["thematic_analysis"] || ""),
          ...analystCallout(ap["thematic_analysis"] || ""),
          sp(2),

          sectionHead("4", "Visual Findings Summary"),
          sp(0.5),
          body(aiDraft["visual_findings_summary"] || ""),
          ...analystCallout(ap["visual_findings_summary"] || ""),
          sp(2),

          sectionHead("5", "Analyst Interpretation & Recommendations"),
          sp(0.5),
          body(aiDraft["analyst_interpretation"] || ""),
          ...analystCallout(ap["analyst_interpretation"] || ""),
          sp(2),

          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } }, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Analyst Note", bold: true, size: 30, font: CG, color: NAVY })] }),
          body(analystNote || ""),
          new Paragraph({ spacing: { before: 80, after: 60 }, keepNext: true, children: [new TextRun({ text: "John Messina", bold: true, size: 22, font: CG, color: NAVY }), new TextRun({ text: "  |  Founder, Sea Glass Insights  |  seaglassinsights.com", size: 19, font: MT, color: GRAY })] }),
          body("This report was prepared as a Voice of Customer Survey. Survey questions were designed from the business intake and administered to the client's customer contacts. Quantitative and qualitative findings are grounded in actual customer responses. This report is intended for internal business use only.", { color: GRAY, italics: true, size: 18 }),
        ]
      }
    ]
  });

  return await postProcessDocx(await Packer.toBuffer(doc));
}

module.exports = { generateVOCReport };
