/**
 * Sea Glass Insights — Secret Shopping Report Generator
 *
 * Generates a branded .docx for Secret Shopping orders.
 * Sections: Visit Overview, Experience Scorecard, Analyst Observations,
 *           Narrative Notes (7), Summary & Recommendations, Analyst Note.
 *
 * Usage: called from /api/generate-ss-pdf when the analyst clicks
 * "Save as Word Document" on a Secret Shopping order in the dashboard.
 */

const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Header, Footer, ImageRun
} = require('docx');
const JSZip = require('jszip');

const logoAssets = require('./logoAssets');

// ── BRAND COLORS ──────────────────────────────────────────
const NAVY  = "0A2F61";
const TEAL  = "00CED1";
const GRAY  = "6B7280";
const SAND  = "FDF5E6";
const WHITE = "FFFFFF";
const INK   = "1C1C1C";

// ── FONTS ─────────────────────────────────────────────────
const CG = "Cormorant Garamond";
const MT = "Montserrat";

// ── LOGO BUFFERS ──────────────────────────────────────────
const coverLogoData = Buffer.from(logoAssets.coverLogo, 'base64');
const iconLogoData  = Buffer.from(logoAssets.iconLogo,  'base64');

// ── TABLE BORDERS ─────────────────────────────────────────
const bdr    = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const bdrs   = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const noBdr  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tealL  = { style: BorderStyle.SINGLE, size: 10, color: TEAL };

// ── DIMENSION DATA (mirrors SecretShoppingScorecard.tsx) ──
const SS_DIMS = [
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

// ── SCORING ───────────────────────────────────────────────
function dimScore(dim, sc) {
  let total = 0, max = 0;
  for (const k of dim.yesno) { max += 1; if (sc[k] === true) total += 1; }
  for (const k of dim.rated)  { max += 5; const v = sc[k]; if (typeof v === 'number') total += v; }
  return max === 0 ? 0 : Math.round((total / max) * 100);
}

function totalScore(sc) {
  return Math.round(SS_DIMS.reduce((acc, d) => acc + (dimScore(d, sc) / 100) * d.weight * 100, 0));
}

function band(score) {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Average";
  if (score >= 45) return "Below Average";
  return "Critical";
}

// ── POST-PROCESS DOCX BUFFER ──────────────────────────────
async function postProcessDocx(docxBuffer) {
  const zip = await JSZip.loadAsync(docxBuffer);
  const xmlFilesToFix = Object.keys(zip.files).filter(f =>
    f.match(/^word\/(document|header\d*|footer\d*)\.xml$/)
  );
  for (const xmlPath of xmlFilesToFix) {
    let xml = await zip.file(xmlPath).async('string');
    if (!xml.includes('<pic:spPr')) continue;
    xml = xml.replace(
      /(<\/a:prstGeom>)(<\/pic:spPr>)/g,
      '$1<a:noFill/><a:ln><a:noFill/></a:ln>$2'
    );
    xml = xml.replace(
      /(<pic:spPr[^>]*>)([\s\S]*?)(<\/pic:spPr>)/g,
      (match, open, inner, close) =>
        open + inner.replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/g, '') + close
    );
    zip.file(xmlPath, xml);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ── PARAGRAPH HELPERS ─────────────────────────────────────
const sp = (n = 1) => new Paragraph({
  spacing: { before: n * 80, after: 0 },
  children: [new TextRun("")]
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text: text || "", size: 22, font: MT, color: INK, ...opts })]
});

const sectionHead = (num, text) => new Paragraph({
  spacing: { before: 440, after: 0 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
  children: [
    new TextRun({ text: `${num}. `, bold: true, size: 34, font: CG, color: TEAL }),
    new TextRun({ text, bold: true, size: 34, font: CG, color: NAVY })
  ]
});

const subHead = (text) => new Paragraph({
  spacing: { before: 220, after: 60 },
  children: [new TextRun({ text, bold: true, size: 24, font: CG, color: NAVY })]
});

// ── CELL HELPER ───────────────────────────────────────────
function cell(text, width, opts = {}) {
  const {
    bg = WHITE, bold = false, color = INK, size = 18, isHeader = false,
  } = opts;
  return new TableCell({
    borders: bdrs,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 130, right: 130 },
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), bold, size, font: MT, color: isHeader ? WHITE : color })]
    })]
  });
}

// ── SS REPORT SECTIONS LIST (for cover page) ──────────────
const COVER_SECTIONS = [
  "Visit Overview",
  "Experience Scorecard",
  "Analyst Observations",
  "Narrative Notes",
  "Summary & Recommendations",
];

const NARRATIVES = [
  { key: "narrative_first_impression",     label: "First Impression" },
  { key: "narrative_physical_environment", label: "Physical Environment" },
  { key: "narrative_staff_engagement",     label: "Staff Engagement" },
  { key: "narrative_core_experience",      label: "Core Experience" },
  { key: "narrative_purchase_process",     label: "Purchase Process" },
  { key: "narrative_digital_touchpoints",  label: "Digital Touchpoints" },
  { key: "narrative_lasting_impression",   label: "Lasting Impression" },
];

// ── MAIN EXPORT ───────────────────────────────────────────
/**
 * generateSSReport(orderData, analystNote)
 *
 * @param {Object} orderData   - Supabase order record (includes service_data + ai_draft)
 * @param {string} analystNote - Analyst's personal closing paragraph
 * @returns {Promise<Buffer>}  - The .docx file as a buffer
 */
async function generateSSReport(orderData, analystNote) {
  const date = new Date(orderData.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const CLIENT   = orderData.business_name;
  const CUSTOMER = orderData.customer_name;
  const DATE     = date;

  const sd                = (orderData.service_data) || {};
  const visitOV           = sd.ss_visit_overview   || {};
  const scorecard         = sd.ss_scorecard        || {};
  const analystObs        = sd.ss_analyst_obs      || {};
  const aiDraft           = (orderData.ai_draft)   || {};
  const summaryAnalystNote = sd.ss_summary_analyst_note || "";

  const total     = totalScore(scorecard);
  const totalBand = band(total);

  // ── Visit overview rows ──────────────────────────────
  const ovRows = [
    ["Business Name",    visitOV.business_name    || "—"],
    ["Location",         visitOV.location         || "—"],
    ["Date of Visit",    visitOV.date_of_visit    || "—"],
    ["Time of Visit",    visitOV.time_of_visit    || "—"],
    ["Shopper Scenario", visitOV.shopper_scenario || "—"],
    ["Template Used",    visitOV.template_used    || "—"],
  ];

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 440, hanging: 280 } } } }]
      }]
    },
    styles: {
      default: { document: { run: { font: MT, size: 22 } } }
    },

    sections: [

      // ══ COVER PAGE ════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: [

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 480 },
            children: [new ImageRun({
              data: coverLogoData,
              transformation: { width: 420, height: 128 },
              type: 'png'
            })]
          }),

          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 0 } },
            spacing: { before: 0, after: 360 },
            children: [new TextRun("")]
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: "SECRET SHOPPING REPORT",
              size: 18, font: MT, bold: true, color: TEAL, allCaps: true })]
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: CLIENT,
              bold: true, size: 80, font: CG, color: NAVY })]
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({
              text: `Prepared for ${CUSTOMER}  |  ${CLIENT}  |  ${DATE}`,
              size: 20, font: MT, color: GRAY
            })]
          }),

          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } },
            spacing: { before: 240, after: 1080 },
            children: [new TextRun("")]
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: "THIS REPORT CONTAINS",
              size: 16, font: MT, color: TEAL, allCaps: true, bold: true })]
          }),

          ...COVER_SECTIONS.map(s =>
            new Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
                new TextRun({ text: s, size: 20, font: CG, bold: true, color: NAVY })
              ]
            })
          ),

          new Paragraph({ spacing: { before: 960, after: 0 }, children: [new TextRun("")] }),

          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 8 } },
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "Sea Glass Insights  |  John Messina, Founder  |  seaglassinsights.com",
                size: 17, font: MT, color: GRAY }),
              new TextRun({ text: "     CONFIDENTIAL",
                size: 17, font: MT, color: TEAL, bold: true })
            ]
          }),

          new Paragraph({ children: [new PageBreak()] }),
        ]
      },

      // ══ REPORT BODY ═══════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1000, right: 1260, bottom: 1440, left: 1260, footer: 720 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [new ImageRun({
                  data: iconLogoData,
                  transformation: { width: 72, height: 49 },
                  type: 'png'
                })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 4 } },
                spacing: { before: 60, after: 0 },
                children: [
                  new TextRun({ text: `${CLIENT} — Confidential`, size: 18, font: MT, color: GRAY }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: `Sea Glass Insights  |  John Messina, Founder  |  ${DATE}`,
                    size: 18, font: MT, color: GRAY }),
                ]
              }),
            ]
          })
        },
        children: [

          // ── Section 1: Visit Overview ──────────────────
          sectionHead("1", "Visit Overview"),
          sp(0.5),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2520, 6840],
            rows: ovRows.map(([label, value], i) =>
              new TableRow({
                children: [
                  cell(label, 2520, { bg: i % 2 === 0 ? SAND : WHITE, bold: true, color: NAVY }),
                  cell(value, 6840, { bg: i % 2 === 0 ? SAND : WHITE }),
                ]
              })
            )
          }),
          sp(2),

          // ── Section 2: Experience Scorecard ───────────
          sectionHead("2", "Experience Scorecard"),
          sp(0.5),

          // Total score callout
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [new TableRow({
              children: [new TableCell({
                borders: { top: noBdr, bottom: noBdr, right: noBdr, left: tealL },
                width: { size: 9360, type: WidthType.DXA },
                shading: { fill: SAND, type: ShadingType.CLEAR },
                margins: { top: 140, bottom: 140, left: 220, right: 200 },
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: 80 },
                    children: [
                      new TextRun({ text: "Total Score: ", bold: true, size: 32, font: CG, color: NAVY }),
                      new TextRun({ text: `${total}/100`, bold: true, size: 32, font: CG, color: TEAL }),
                      new TextRun({ text: `  —  ${totalBand}`, size: 28, font: CG, color: NAVY }),
                    ]
                  }),
                  new Paragraph({
                    spacing: { before: 0, after: 0 },
                    children: [new TextRun({
                      text: "90-100 Exceptional  ·  75-89 Strong  ·  60-74 Average  ·  45-59 Below Average  ·  Below 45 Critical",
                      size: 16, font: MT, color: GRAY
                    })]
                  })
                ]
              })]
            })]
          }),
          sp(1),

          // Dimension scores table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3960, 1560, 1200, 2640],
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({ borders: bdrs, width: { size: 3960, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "Dimension", bold: true, size: 18, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 1560, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, size: 18, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 1200, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "Weight", bold: true, size: 18, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 2640, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "Rating", bold: true, size: 18, font: MT, color: WHITE })] })] }),
                ]
              }),
              // Dimension rows
              ...SS_DIMS.map((dim, i) => {
                const raw = dimScore(dim, scorecard);
                const dimBand = band(raw);
                const rowBg = i % 2 === 0 ? SAND : WHITE;
                return new TableRow({
                  children: [
                    cell(dim.label, 3960, { bg: rowBg, bold: true, color: NAVY }),
                    cell(`${raw}/100`,  1560, { bg: rowBg }),
                    cell(`${Math.round(dim.weight * 100)}%`, 1200, { bg: rowBg }),
                    cell(dimBand, 2640, { bg: rowBg }),
                  ]
                });
              }),
              // Total row
              new TableRow({
                children: [
                  new TableCell({ borders: bdrs, width: { size: 3960, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL WEIGHTED SCORE", bold: true, size: 19, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 1560, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: `${total}/100`, bold: true, size: 19, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 1200, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: "100%", size: 18, font: MT, color: WHITE })] })] }),
                  new TableCell({ borders: bdrs, width: { size: 2640, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 130, right: 130 }, children: [new Paragraph({ children: [new TextRun({ text: totalBand, bold: true, size: 19, font: MT, color: TEAL })] })] }),
                ]
              }),
            ]
          }),
          sp(2),

          // ── Section 3: Analyst Observations ───────────
          sectionHead("3", "Analyst Observations"),
          sp(0.5),
          subHead("Best Moment"),
          body(analystObs.best_moment || ""),
          sp(0.5),
          subHead("Biggest Missed Opportunity"),
          body(analystObs.biggest_miss || ""),
          sp(0.5),
          subHead("Immediate Fix"),
          body(analystObs.immediate_fix || ""),
          sp(0.5),
          subHead("Additional Observations"),
          body(analystObs.additional_observations || ""),
          sp(2),

          // ── Section 4: Narrative Notes ─────────────────
          sectionHead("4", "Narrative Notes"),
          sp(0.5),
          ...NARRATIVES.flatMap(({ key, label }) => [
            subHead(label),
            body(aiDraft[key] || ""),
            sp(0.5),
          ]),
          sp(1.5),

          // ── Section 5: Summary & Recommendations ───────
          sectionHead("5", "Summary & Recommendations"),
          sp(0.5),
          body(aiDraft.summary_and_recommendations || ""),
          ...(summaryAnalystNote ? [
            sp(0.5),
            subHead("Analyst Notes"),
            body(summaryAnalystNote, { color: GRAY, italics: true }),
          ] : []),
          sp(2),

          // ── Analyst Note ────────────────────────────────
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "A Note from the Analyst",
              bold: true, size: 30, font: CG, color: NAVY })]
          }),
          body(analystNote || ""),
          new Paragraph({
            spacing: { before: 80, after: 60 }, keepNext: true,
            children: [
              new TextRun({ text: "John Messina", bold: true, size: 22, font: CG, color: NAVY }),
              new TextRun({ text: "  |  Founder, Sea Glass Insights  |  seaglassinsights.com",
                size: 19, font: MT, color: GRAY })
            ]
          }),
          body(
            "This report was prepared as an analyst-conducted secret shopping evaluation. Findings are based on an in-person visit conducted by a Sea Glass Insights researcher, scored against a standardized 7-dimension framework.",
            { color: GRAY, italics: true, size: 18 }
          ),

        ]
      }
    ]
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return await postProcessDocx(docxBuffer);
}

module.exports = { generateSSReport };
