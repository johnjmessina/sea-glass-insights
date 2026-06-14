/**
 * Sea Glass Insights — AI Starter Kit Report Generator
 *
 * Generates a branded .docx for AI Starter Kit orders.
 * Sections: 2 intro + 6 custom prompts (each in styled box) + real use cases
 *           + optional revision notes + closing analyst note.
 */

const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Table, TableRow, TableCell,
  LevelFormat, PageBreak, Header, Footer, ImageRun,
} = require('docx');
const JSZip      = require('jszip');
const logoAssets = require('./logoAssets');

const NAVY = "0A2F61";
const TEAL = "00CED1";
const GRAY = "6B7280";
const INK  = "1C1C1C";
const LGRY = "F3F6FA";

const CG = "Cormorant Garamond";
const MT = "Montserrat";

const coverLogoData = Buffer.from(logoAssets.coverLogo, 'base64');
const iconLogoData  = Buffer.from(logoAssets.iconLogo,  'base64');

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

function stripMd(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/\*{3}([^*\n]+)\*{3}/g, "$1")
    .replace(/\*{2}([^*\n]+)\*{2}/g, "$1")
    .replace(/_{2}([^_\n]+)_{2}/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

const sp = (n = 1) => new Paragraph({
  spacing: { before: n * 80, after: 0 },
  children: [new TextRun("")],
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text: stripMd(text), size: 22, font: MT, color: INK, ...opts })],
});

const sectionHead = (num, text) => new Paragraph({
  spacing: { before: 440, after: 0 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
  children: [
    new TextRun({ text: `${num}. `, bold: true, size: 34, font: CG, color: TEAL }),
    new TextRun({ text, bold: true, size: 34, font: CG, color: NAVY }),
  ],
});

function promptBox(content) {
  const parts   = content.split(/\n---\n/);
  const prompt  = (parts[0] ?? content).trim();
  const instruc = (parts[1] ?? "").trim();

  const noBdr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  const boxTable = new Table({
    width: { size: 9720, type: WidthType.DXA },
    columnWidths: [9720],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 3,  color: TEAL },
              left:   { style: BorderStyle.THICK,  size: 16, color: TEAL },
              bottom: { style: BorderStyle.SINGLE, size: 3,  color: TEAL },
              right:  noBdr,
            },
            shading: { fill: LGRY, type: ShadingType.CLEAR },
            margins: { left: 220, right: 220, top: 160, bottom: 160 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [new TextRun({
                  text: "YOUR PROMPT",
                  size: 16, font: MT, bold: true, color: TEAL, allCaps: true,
                })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({
                  text: prompt, size: 20, font: "Courier New", color: INK,
                })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const result = [sp(0.5), boxTable];
  if (instruc) {
    result.push(sp(0.5));
    result.push(body(instruc, { color: GRAY, italics: true }));
  }
  return result;
}

const AISK_SECTIONS = [
  { key: "business_type_analysis",        label: "Business Type Analysis",        isPrompt: false },
  { key: "ai_best_practices_introduction",label: "AI Best Practices Introduction", isPrompt: false },
  { key: "custom_prompt_1",               label: "Custom Prompt 1",                isPrompt: true  },
  { key: "custom_prompt_2",               label: "Custom Prompt 2",                isPrompt: true  },
  { key: "custom_prompt_3",               label: "Custom Prompt 3",                isPrompt: true  },
  { key: "custom_prompt_4",               label: "Custom Prompt 4",                isPrompt: true  },
  { key: "custom_prompt_5",               label: "Custom Prompt 5",                isPrompt: true  },
  { key: "custom_prompt_6",               label: "Custom Prompt 6",                isPrompt: true  },
  { key: "real_use_case_examples",        label: "Real Use Case Examples",         isPrompt: false },
  { key: "revision_notes",                label: "Revision Notes",                 isPrompt: false },
];

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
function fmtDate(str) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return String(str || '');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * generateAISKReport(orderData, aiDraft, analystNote)
 *
 * @param {Object} orderData   - Supabase order record
 * @param {Object} aiDraft     - ai_draft JSONB (section keys → text)
 * @param {string} analystNote - Analyst's personal closing paragraph
 * @returns {Promise<Buffer>}  - The .docx file as a Buffer
 */
async function generateAISKReport(orderData, aiDraft, analystNote) {
  const DATE     = fmtDate(orderData.created_at);
  const CLIENT   = orderData.business_name;
  const CUSTOMER = orderData.customer_name;
  const LOCATION = orderData.location || '';

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 440, hanging: 280 } } },
        }],
      }],
    },
    styles: { default: { document: { run: { font: MT, size: 22 } } } },

    sections: [

      // ══ COVER PAGE ════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 480 },
            children: [new ImageRun({
              data: coverLogoData,
              transformation: { width: 420, height: 128 },
              type: 'png',
            })],
          }),

          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 0 } },
            spacing: { before: 0, after: 360 },
            children: [new TextRun("")],
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({
              text: "AI STARTER KIT", size: 18, font: MT, bold: true, color: TEAL, allCaps: true,
            })],
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: CLIENT, bold: true, size: 80, font: CG, color: NAVY })],
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({
              text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? '  |  ' + LOCATION : ''}  |  ${DATE}`,
              size: 20, font: MT, color: GRAY,
            })],
          }),

          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } },
            spacing: { before: 240, after: 1080 },
            children: [new TextRun("")],
          }),

          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({
              text: "THIS KIT INCLUDES", size: 16, font: MT, color: TEAL, allCaps: true, bold: true,
            })],
          }),

          ...AISK_SECTIONS.filter(s => s.key !== 'revision_notes').map(s =>
            new Paragraph({
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
                new TextRun({ text: s.label, size: 20, font: CG, bold: true, color: NAVY }),
              ],
            })
          ),

          new Paragraph({ spacing: { before: 720, after: 0 }, children: [new TextRun("")] }),

          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 8 } },
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: "Sea Glass Insights  |  John Messina, Founder  |  seaglassinsights.com",
                size: 17, font: MT, color: GRAY,
              }),
              new TextRun({ text: "     CONFIDENTIAL", size: 17, font: MT, color: TEAL, bold: true }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),
        ],
      },

      // ══ REPORT BODY ═══════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1000, right: 1260, bottom: 1440, left: 1260, footer: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 0, after: 0 },
              children: [new ImageRun({
                data: iconLogoData,
                transformation: { width: 72, height: 49 },
                type: 'png',
              })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC", space: 4 } },
                spacing: { before: 60, after: 0 },
                children: [new TextRun({ text: `${CLIENT} — Confidential`, size: 18, font: MT, color: GRAY })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({
                  text: `Sea Glass Insights  |  John Messina, Founder  |  ${DATE}`,
                  size: 18, font: MT, color: GRAY,
                })],
              }),
            ],
          }),
        },
        children: [

          ...AISK_SECTIONS.flatMap((section, i) => {
            const content = (aiDraft[section.key] || "").trim();
            if (section.key === 'revision_notes' && !content) return [];

            if (section.isPrompt) {
              return [
                sectionHead(String(i + 1), section.label),
                ...promptBox(content || "(Prompt not yet generated)"),
                sp(2),
              ];
            }

            return [
              sectionHead(String(i + 1), section.label),
              sp(0.5),
              body(content),
              sp(2),
            ];
          }),

          // ── ANALYST NOTE ──────────────────────────────────
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "Analyst Note", bold: true, size: 30, font: CG, color: NAVY })],
          }),
          body(analystNote || ""),
          new Paragraph({
            spacing: { before: 80, after: 60 }, keepNext: true,
            children: [
              new TextRun({ text: "John Messina", bold: true, size: 22, font: CG, color: NAVY }),
              new TextRun({
                text: "  |  Founder, Sea Glass Insights  |  seaglassinsights.com",
                size: 19, font: MT, color: GRAY,
              }),
            ],
          }),
          body(
            "These prompts were written specifically for your business type, voice, and real use cases by a Sea Glass Insights analyst. They are designed to work immediately in ChatGPT, Claude, or any major AI chatbot. This kit includes one round of revisions — reach out with any feedback.",
            { color: GRAY, italics: true, size: 18 }
          ),
        ],
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return await postProcessDocx(docxBuffer);
}

module.exports = { generateAISKReport };
