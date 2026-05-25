/**
 * Sea Glass Insights — Report Generator
 *
 * Usage: Called from the dashboard API route when John clicks "Generate Final Report"
 *
 * Input:  orderData object (from Supabase) + aiContent object (from Claude API) + analystNote string
 * Output: Buffer containing the branded .docx file
 *
 * Install dependencies:
 *   npm install docx
 *
 * To integrate into Next.js:
 *   1. Place this file at: lib/reportGenerator.js
 *   2. Call generateReport(orderData, aiContent, analystNote) from your API route
 *   3. Return the buffer as a file download or save to storage for email delivery
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, PageBreak, Header, Footer, ImageRun
} = require('docx');
const JSZip = require('jszip');

// Logos embedded as base64 — Vercel serves public/ via CDN only so
// fs.readFileSync cannot reach it at runtime inside a serverless function.
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

// ── BORDERS ───────────────────────────────────────────────
const bdr    = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const bdrs   = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const noBdr  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBdrs = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr };
const tealL  = { style: BorderStyle.SINGLE, size: 10, color: TEAL };

// ── LOGO BUFFERS ──────────────────────────────────────────
// Decoded once at module load from the embedded base64 asset module.
const coverLogoData = Buffer.from(logoAssets.coverLogo, 'base64');
const iconLogoData  = Buffer.from(logoAssets.iconLogo,  'base64');

// ── POST-PROCESS DOCX BUFFER ──────────────────────────────
// Fixes transparent PNG rendering: the docx library generates <pic:spPr>
// with no fill declaration, so renderers default to solid white.
// Injecting <a:noFill/> and <a:ln><a:noFill/></a:ln> removes that box.
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
const sp = (n=1) => new Paragraph({
  spacing: { before: n*80, after: 0 },
  children: [new TextRun("")]
});

const body = (text, opts={}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text, size: 22, font: MT, color: INK, ...opts })]
});

const blt = (text, label=null) => {
  const kids = [];
  if (label) kids.push(new TextRun({ text: label+' ', bold: true, size: 22, font: MT, color: NAVY }));
  kids.push(new TextRun({ text, size: 22, font: MT, color: INK }));
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: kids
  });
};

const sectionHead = (num, text) => new Paragraph({
  spacing: { before: 440, after: 0 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
  children: [
    new TextRun({ text: `${num}. `, bold: true, size: 34, font: CG, color: TEAL }),
    new TextRun({ text, bold: true, size: 34, font: CG, color: NAVY })
  ]
});

const subHead = (text) => new Paragraph({
  spacing: { before: 200, after: 60 },
  children: [new TextRun({ text, bold: true, size: 26, font: CG, color: NAVY })]
});

const insightBox = (num, title, bodyText) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [760, 8600],
  margins: { top: 80, bottom: 80 },
  rows: [new TableRow({
    children: [
      new TableCell({
        borders: noBdrs,
        width: { size: 760, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: num, bold: true, size: 40, font: CG, color: WHITE })]
        })]
      }),
      new TableCell({
        borders: { top: noBdr, bottom: noBdr, right: noBdr, left: tealL },
        width: { size: 8600, type: WidthType.DXA },
        shading: { fill: SAND, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 200, right: 160 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: title, bold: true, size: 26, font: CG, color: NAVY })] }),
          new Paragraph({ spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: bodyText, size: 22, font: MT, color: INK })] })
        ]
      })
    ]
  })]
});

const recBox = (num, title, text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [700, 8660],
  margins: { top: 80, bottom: 80 },
  rows: [new TableRow({
    children: [
      new TableCell({
        borders: bdrs,
        width: { size: 700, type: WidthType.DXA },
        shading: { fill: TEAL, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 60, right: 60 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: num, bold: true, size: 36, font: CG, color: WHITE })]
        })]
      }),
      new TableCell({
        borders: bdrs,
        width: { size: 8660, type: WidthType.DXA },
        margins: { top: 140, bottom: 140, left: 200, right: 160 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: title, bold: true, size: 24, font: CG, color: NAVY })] }),
          new Paragraph({ spacing: { before: 0, after: 0 },
            children: [new TextRun({ text, size: 22, font: MT, color: INK })] })
        ]
      })
    ]
  })]
});

// ── MAIN EXPORT ───────────────────────────────────────────
/**
 * generateReport(orderData, aiContent, analystNote)
 *
 * @param {Object} orderData - From Supabase order record
 *   orderData.customer_name    — e.g. "Jane Smith"
 *   orderData.business_name    — e.g. "The Corner Cafe"
 *   orderData.location         — e.g. "Asbury Park, NJ"
 *   orderData.created_at       — ISO date string
 *
 * @param {Object} aiContent - Parsed JSON from Claude API response
 *   aiContent.snapshot              — string
 *   aiContent.customer_profile      — array of { name, desc, motivation, key_need }
 *   aiContent.competitive_landscape — array of { name, strength, edge }
 *   aiContent.positioning           — { strengths: string[], vulnerabilities: string[] }
 *   aiContent.insights              — array of { title, body }
 *   aiContent.recommendations       — array of { title, body }
 *
 * @param {string} analystNote - John's personal closing paragraph
 *
 * @returns {Promise<Buffer>} - The .docx file as a buffer
 */
async function generateReport(orderData, aiContent, analystNote) {

  // coverLogoData and iconLogoData are module-level constants (base64-decoded)

  // Format date nicely
  const date = new Date(orderData.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

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
        page: { size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [

        // Cover logo — 420×128 pt, 40 pt spacing above and below
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800, after: 800 },
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

        // Label
        new Paragraph({ spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: "MARKET INTELLIGENCE REPORT",
            size: 18, font: MT, bold: true, color: TEAL, allCaps: true })]
        }),

        // Client name — hero
        new Paragraph({ spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: CLIENT,
            bold: true, size: 80, font: CG, color: NAVY })]
        }),

        // Meta line
        new Paragraph({ spacing: { before: 0, after: 200 },
          children: [new TextRun({
            text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? '  |  ' + LOCATION : ''}  |  ${DATE}`,
            size: 20, font: MT, color: GRAY
          })]
        }),

        // Thick teal rule — larger gap below pushes section list toward center
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } },
          spacing: { before: 200, after: 1200 },
          children: [new TextRun("")]
        }),

        // What's inside
        new Paragraph({ spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "THIS REPORT CONTAINS",
            size: 16, font: MT, color: TEAL, allCaps: true, bold: true })]
        }),

        ...["Business Snapshot", "Customer Profile", "Competitive Landscape",
            "Market Positioning", "Key Insights", "Recommendations"].map(s =>
          new Paragraph({ spacing: { before: 100, after: 100 },
            children: [
              new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
              new TextRun({ text: s, size: 20, font: CG, bold: true, color: NAVY })
            ]
          })
        ),

        // Spacer — pushes confidential line to page bottom
        new Paragraph({ spacing: { before: 2400, after: 0 }, children: [new TextRun("")] }),

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
        page: { size: { width: 12240, height: 15840 },
                margin: { top: 1000, right: 1260, bottom: 1200, left: 1260 } }
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              // 9720 = page width (12240) minus left+right body margins (1260+1260)
              width: { size: 9720, type: WidthType.DXA },
              columnWidths: [8280, 1440],
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: NAVY, space: 4 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
                insideH: { style: BorderStyle.NONE, size: 0 },
                insideV: { style: BorderStyle.NONE, size: 0 },
              },
              rows: [new TableRow({
                children: [
                  // Left: report title text
                  new TableCell({
                    borders: noBdrs,
                    width: { size: 8280, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 0, right: 120 },
                    children: [new Paragraph({
                      alignment: AlignmentType.LEFT,
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({ text: `${CLIENT} — Market Intelligence Report`,
                          size: 17, font: MT, color: GRAY }),
                        new TextRun({ text: "   |   CONFIDENTIAL",
                          size: 17, font: MT, color: GRAY })
                      ]
                    })]
                  }),
                  // Right: icon logo — 80×54 pt
                  new TableCell({
                    borders: noBdrs,
                    width: { size: 1440, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 120, right: 0 },
                    children: [new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 0, after: 0 },
                      children: [new ImageRun({
                        data: iconLogoData,
                        transformation: { width: 80, height: 54 },
                        type: 'png'
                      })]
                    })]
                  }),
                ]
              })]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 4 } },
            spacing: { before: 80, after: 0 },
            children: [
              new TextRun({ text: `seaglassinsights.com   |   John Messina, Founder   |   ${DATE}`,
                size: 16, font: MT, color: GRAY }),
            ]
          })]
        })
      },
      children: [

        // ── 1. BUSINESS SNAPSHOT ────────────────────────
        sectionHead("1", "Business Snapshot"),
        sp(0.5),
        body(aiContent.snapshot),
        sp(2),

        // ── 2. CUSTOMER PROFILE ─────────────────────────
        sectionHead("2", "Customer Profile"),
        sp(0.5),
        body("The following customer segments emerge from the business profile and market context. Understanding each segment's motivations and needs is the foundation for addressing growth opportunities."),
        sp(),

        ...aiContent.customer_profile.flatMap((seg, i) => [
          subHead(`Segment ${['A','B','C','D','E'][i]}: ${seg.name}`),
          body(seg.desc),
          blt(seg.motivation, "Motivation:"),
          blt(seg.key_need, "Key Need:"),
          sp(0.5),
        ]),

        sp(2),

        // ── 3. COMPETITIVE LANDSCAPE ────────────────────
        sectionHead("3", "Competitive Landscape"),
        sp(0.5),
        body("The competitive environment and where this business holds a genuine edge."),
        sp(),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 3380, 3380],
          rows: [
            new TableRow({ children: [
              ...[["Competitor", 2600], ["Their Strength", 3380], ["Your Edge", 3380]].map(([label, w]) =>
                new TableCell({
                  borders: bdrs, width: { size: w, type: WidthType.DXA },
                  shading: { fill: NAVY, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [
                    new TextRun({ text: label, bold: true, size: 19, font: MT, color: WHITE })
                  ]})]
                })
              )
            ]}),
            ...aiContent.competitive_landscape.map((c, i) =>
              new TableRow({ children: [
                ...[
                  [c.name, 2600, true],
                  [c.strength, 3380, false],
                  [c.edge, 3380, false]
                ].map(([txt, w, bold]) =>
                  new TableCell({
                    borders: bdrs, width: { size: w, type: WidthType.DXA },
                    shading: { fill: i%2===0 ? SAND : WHITE, type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 140, right: 140 },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: txt, bold, size: 19, font: MT,
                        color: bold ? NAVY : INK })
                    ]})]
                  })
                )
              ]})
            )
          ]
        }),

        sp(2),

        // ── 4. MARKET POSITIONING ───────────────────────
        sectionHead("4", "Market Positioning"),
        sp(0.5),
        subHead("Strengths"),
        ...aiContent.positioning.strengths.map(s => blt(s)),
        sp(),
        subHead("Vulnerabilities"),
        ...aiContent.positioning.vulnerabilities.map(v => blt(v)),

        sp(2),

        // ── 5. KEY INSIGHTS ─────────────────────────────
        sectionHead("5", "Key Insights"),
        sp(0.5),
        body("The following insights represent the analyst's interpretation of the data — what the findings mean for this business and what should drive decisions in the months ahead."),
        sp(),
        ...aiContent.insights.flatMap((ins, i) => [
          insightBox(String(i+1), ins.title, ins.body),
          sp(0.5),
        ]),

        sp(2),

        // ── 6. RECOMMENDATIONS ──────────────────────────
        sectionHead("6", "Recommendations"),
        sp(0.5),
        body("Four recommendations, ordered by impact and feasibility. The first two can be implemented within thirty days at minimal cost."),
        sp(),
        ...aiContent.recommendations.flatMap((rec, i) => [
          recBox(String(i+1), rec.title, rec.body),
          sp(0.5),
        ]),

        sp(2),

        // ── ANALYST NOTE ────────────────────────────────
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "A Note from the Analyst",
            bold: true, size: 30, font: CG, color: NAVY })]
        }),
        body(analystNote),
        sp(),
        new Paragraph({ spacing: { before: 120, after: 60 },
          children: [
            new TextRun({ text: "John Messina", bold: true, size: 22, font: CG, color: NAVY }),
            new TextRun({ text: "  |  Founder, Sea Glass Insights  |  seaglassinsights.com",
              size: 19, font: MT, color: GRAY })
          ]
        }),
        body("This report was prepared as a premium analyst-reviewed market intelligence report. Findings are based on information provided during intake combined with analyst interpretation of local and category market conditions.",
          { color: GRAY, italics: true, size: 18 }),
      ]
    }]
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return await postProcessDocx(docxBuffer);
}

module.exports = { generateReport };
