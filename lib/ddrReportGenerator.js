/**
 * Sea Glass Insights — Deep Dive Report Generator
 *
 * Generates a branded .docx for Deep Dive Report orders.
 * Sections: 9 AI-generated narrative sections + optional Analyst Perspective
 * callout per section + closing Analyst Note.
 *
 * Usage: called from /api/generate-ddr-pdf when the analyst clicks
 * "Save as Word Document" on a DDR order in the dashboard.
 */

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Table, TableRow, TableCell,
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

// ── HELPERS ───────────────────────────────────────────────
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

// ── ANALYST PERSPECTIVE CALLOUT ───────────────────────────
// Renders a navy-left-bordered callout box. Returns [] if text is empty.
function analystCallout(text) {
  if (!text || !text.trim()) return [];
  const noBdr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return [
    sp(0.5),
    new Table({
      width: { size: 9720, type: WidthType.DXA },
      columnWidths: [9720],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                left:   { style: BorderStyle.THICK, size: 16, color: NAVY },
                top:    noBdr,
                bottom: noBdr,
                right:  noBdr,
              },
              shading: { fill: "EEF3F9", type: ShadingType.CLEAR },
              margins: { left: 220, right: 160, top: 120, bottom: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 80 },
                  children: [
                    new TextRun({
                      text: "ANALYST PERSPECTIVE",
                      size: 16, font: MT, bold: true, color: NAVY, allCaps: true,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: text.trim(), size: 21, font: MT, color: INK, italics: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    sp(0.5),
  ];
}

// ── DDR SECTIONS ──────────────────────────────────────────
const DDR_SECTIONS = [
  { key: "executive_summary",               label: "Executive Summary" },
  { key: "business_snapshot",              label: "Business Snapshot" },
  { key: "customer_segments",              label: "Customer Segments" },
  { key: "competitive_intelligence",       label: "Competitive Intelligence" },
  { key: "market_context",                label: "Market Context & Trend Analysis" },
  { key: "decision_specific_analysis",     label: "Decision-Specific Analysis" },
  { key: "extended_recommendations",       label: "Extended Recommendations" },
  { key: "priority_action_framework",      label: "Priority Action Framework" },
  { key: "expanded_analyst_interpretation",label: "Expanded Analyst Interpretation" },
];

// ── DATE FORMATTER ────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
function fmtDate(str) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return String(str || '');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// ── MAIN EXPORT ───────────────────────────────────────────
/**
 * generateDDRReport(orderData, aiDraft, analystNote, analystPerspectives)
 *
 * @param {Object} orderData           - Supabase order record
 * @param {Object} aiDraft             - ai_draft JSONB (9 section keys)
 * @param {string} analystNote         - Analyst's personal closing paragraph
 * @param {Object} analystPerspectives - { [sectionKey]: calloutText } — empty string = omit
 * @returns {Promise<Buffer>}          - The .docx file as a buffer
 */
async function generateDDRReport(orderData, aiDraft, analystNote, analystPerspectives) {
  const date = fmtDate(orderData.created_at);

  const CLIENT   = orderData.business_name;
  const CUSTOMER = orderData.customer_name;
  const LOCATION = orderData.location || '';
  const DATE     = date;

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

          // Cover logo
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 480 },
            children: [new ImageRun({
              data: coverLogoData,
              transformation: { width: 420, height: 128 },
              type: 'png'
            })]
          }),

          // Thin teal rule
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 0 } },
            spacing: { before: 0, after: 360 },
            children: [new TextRun("")]
          }),

          // Report type label
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: "DEEP DIVE REPORT",
              size: 18, font: MT, bold: true, color: TEAL, allCaps: true })]
          }),

          // Client name — hero
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: CLIENT,
              bold: true, size: 80, font: CG, color: NAVY })]
          }),

          // Meta line
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({
              text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? '  |  ' + LOCATION : ''}  |  ${DATE}`,
              size: 20, font: MT, color: GRAY
            })]
          }),

          // Thick teal rule
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } },
            spacing: { before: 240, after: 1080 },
            children: [new TextRun("")]
          }),

          // What's inside
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: "THIS REPORT CONTAINS",
              size: 16, font: MT, color: TEAL, allCaps: true, bold: true })]
          }),

          ...DDR_SECTIONS.map(s =>
            new Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
                new TextRun({ text: s.label, size: 20, font: CG, bold: true, color: NAVY })
              ]
            })
          ),

          // Push confidential line to bottom
          new Paragraph({ spacing: { before: 720, after: 0 }, children: [new TextRun("")] }),

          // Bottom line
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
                  new TextRun({ text: `${CLIENT} — Confidential`,
                    size: 18, font: MT, color: GRAY }),
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

          // ── 9 NARRATIVE SECTIONS ───────────────────────
          ...DDR_SECTIONS.flatMap((section, i) => [
            sectionHead(String(i + 1), section.label),
            sp(0.5),
            body(aiDraft[section.key] || ""),
            ...analystCallout((analystPerspectives || {})[section.key] || ""),
            sp(2),
          ]),

          // ── ANALYST NOTE ────────────────────────────────
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
            "This report was prepared as an analyst-reviewed Deep Dive Report. Findings are based on information provided during intake combined with analyst-directed market research and competitive intelligence. This report is intended for internal business use only.",
            { color: GRAY, italics: true, size: 18 }
          ),
        ]
      }
    ]
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return await postProcessDocx(docxBuffer);
}

module.exports = { generateDDRReport };
