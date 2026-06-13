/**
 * Sea Glass Insights — Voice of Customer Survey Report Generator
 *
 * Generates a branded .docx for Voice of Customer Survey orders.
 * Sections: Phase 1 (Survey Design) + Phase 2 (Response Summary, Thematic
 * Analysis, Visual Findings, Analyst Interpretation) + Analyst Note.
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

const phaseLabel = (text) => new Paragraph({
  spacing: { before: 480, after: 120 },
  children: [new TextRun({
    text, size: 16, font: MT, bold: true, color: TEAL, allCaps: true,
  })]
});

// ── ANALYST PERSPECTIVE CALLOUT ───────────────────────────
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
                  children: [new TextRun({
                    text: "ANALYST PERSPECTIVE",
                    size: 16, font: MT, bold: true, color: NAVY, allCaps: true,
                  })],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({
                    text: text.trim(), size: 21, font: MT, color: INK, italics: true,
                  })],
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

// ── VOC SECTIONS ──────────────────────────────────────────
const VOC_REPORT_SECTIONS = [
  // Phase 1
  { key: "survey_design",          label: "Survey Design",                          phase: 1 },
  // Phase 2
  { key: "thematic_analysis",      label: "Thematic Analysis",                      phase: 2 },
  { key: "visual_findings_summary",label: "Visual Findings Summary",                phase: 2 },
  { key: "analyst_interpretation", label: "Analyst Interpretation & Recommendations",phase: 2 },
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
 * generateVOCReport(orderData, aiDraft, analystNote, analystPerspectives, vocResponses)
 *
 * @param {Object} orderData            - Supabase order record
 * @param {Object} aiDraft              - ai_draft JSONB (section keys)
 * @param {string} analystNote          - Analyst's personal closing paragraph
 * @param {Object} analystPerspectives  - { [sectionKey]: calloutText }
 * @param {string} vocResponses         - The pasted survey responses
 * @returns {Promise<Buffer>}           - The .docx file as a buffer
 */
async function generateVOCReport(orderData, aiDraft, analystNote, analystPerspectives, vocResponses) {
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
            children: [new TextRun({ text: "VOICE OF CUSTOMER SURVEY",
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
              text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? '  |  ' + LOCATION : ''}  |  ${DATE}`,
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

          ...VOC_REPORT_SECTIONS.map(s =>
            new Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
                new TextRun({ text: s.label, size: 20, font: CG, bold: true, color: NAVY })
              ]
            })
          ),

          new Paragraph({ spacing: { before: 720, after: 0 }, children: [new TextRun("")] }),

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

          // ── PHASE 1: SURVEY DESIGN ──────────────────────
          phaseLabel("Phase 1 — Survey Design"),
          sectionHead("1", "Survey Design"),
          sp(0.5),
          body(aiDraft["survey_design"] || ""),
          body(
            "Copy these questions directly into Google Forms or your preferred survey tool.",
            { color: GRAY, italics: true, size: 20 }
          ),
          ...analystCallout((analystPerspectives || {})["survey_design"] || ""),
          sp(2),

          // ── PHASE 2: ANALYSIS ────────────────────────────
          phaseLabel("Phase 2 — Analysis"),

          // Response Summary
          sectionHead("2", "Response Summary"),
          sp(0.5),
          body(vocResponses || "(No responses provided)"),
          sp(2),

          // Thematic Analysis
          sectionHead("3", "Thematic Analysis"),
          sp(0.5),
          body(aiDraft["thematic_analysis"] || ""),
          ...analystCallout((analystPerspectives || {})["thematic_analysis"] || ""),
          sp(2),

          // Visual Findings Summary
          sectionHead("4", "Visual Findings Summary"),
          sp(0.5),
          body(aiDraft["visual_findings_summary"] || ""),
          ...analystCallout((analystPerspectives || {})["visual_findings_summary"] || ""),
          sp(2),

          // Analyst Interpretation
          sectionHead("5", "Analyst Interpretation & Recommendations"),
          sp(0.5),
          body(aiDraft["analyst_interpretation"] || ""),
          ...analystCallout((analystPerspectives || {})["analyst_interpretation"] || ""),
          sp(2),

          // ── ANALYST NOTE ────────────────────────────────
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "Analyst Note",
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
            "This report was prepared as a Voice of Customer Survey Report. Customer survey questions were designed based on the business intake. Survey responses were collected from the client's customer contacts. Analysis and findings are grounded in the actual responses provided. This report is intended for internal business use only.",
            { color: GRAY, italics: true, size: 18 }
          ),
        ]
      }
    ]
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return await postProcessDocx(docxBuffer);
}

module.exports = { generateVOCReport };
