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
  LevelFormat, PageBreak, Header, Footer, ImageRun, TableBorders, TableLayoutType
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
const CREAM = "F4EADA";
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

// ── LOGO BUFFERS ──────────────────────────────────────────
// Decoded once at module load from the embedded base64 asset module.
const coverLogoData = Buffer.from(logoAssets.coverLogo, 'base64');
const iconLogoData  = Buffer.from(logoAssets.iconLogo,  'base64');

// ── DATE FORMATTER ────────────────────────────────────────
// Uses hardcoded month names + UTC parts so output is always
// "June 10, 2026" regardless of server locale or ICU data.
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
function fmtDate(str) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return String(str || '');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

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

const sp = (n=1) => new Paragraph({
  spacing: { before: n*80, after: 0 },
  children: [new TextRun("")]
});

const body = (text, opts={}) => new Paragraph({
  spacing: { before: 80, after: 100 },
  children: [new TextRun({ text: stripMd(text), size: 22, font: MT, color: INK, ...opts })]
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

// ── EXECUTIVE SUMMARY CALLOUT BOXES ──────────────────────
// Two side-by-side colored cards: Your Edge (navy) and Priority Action (teal).
function execSummaryCallouts(yourEdge, priorityAction) {
  const HALF = 4480;
  const GAP  =  400;
  // HALF + GAP + HALF = 9360 ✓

  const makeCard = (label, text, bgFill, labelColor, textColor, ruleColor) =>
    new TableCell({
      borders:        noBdrs,
      width:          { size: HALF, type: WidthType.DXA },
      shading:        { fill: bgFill, type: ShadingType.CLEAR },
      margins:        { top: 180, bottom: 200, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: label, bold: true, size: 17, font: MT,
            color: labelColor, allCaps: true })] }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2,
            color: ruleColor, space: 6 } },
          spacing: { before: 0, after: 100 },
          children: [new TextRun("")]
        }),
        new Paragraph({ spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: stripMd(text), size: 21, font: MT,
            color: textColor })] }),
      ]
    });

  return new Table({
    width:        { size: 9360, type: WidthType.DXA },
    columnWidths: [HALF, GAP, HALF],
    rows: [new TableRow({
      children: [
        makeCard("Your Edge",       yourEdge,       NAVY,  TEAL,  WHITE, TEAL),
        new TableCell({
          borders: noBdrs,
          width:   { size: GAP, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun('')] })]
        }),
        makeCard("Priority Action", priorityAction, TEAL,  NAVY,  NAVY,  NAVY),
      ]
    })]
  });
}

// ── BUSINESS SNAPSHOT DASHBOARD ──────────────────────────
// Renders structured business_snapshot data as a 2-column card grid.
function snapshotDashboard(snap) {
  if (!snap || typeof snap !== 'object') return [];
  const val = v => Array.isArray(v) ? v.join(', ') : String(v || '—');

  const CARD_W = 4560;
  const GAP_W  = 240;
  // CARD_W + GAP_W + CARD_W = 9360 ✓

  // Icon prefix per label — no explicit font so Word falls back to its emoji font.
  const ICONS = {
    'Location':           '📍',
    'Time in Business':   '⏱',
    'Business Type':      '🏷',
    'Primary Offering':   '★',
    'Target Customer':    '👤',
    'Top Competitors':    '🚩',
    'Marketing Channels': '📣',
    'Key Challenge':      '⚠',
    'Success Goal':       '🎯',
  };

  const cardCell = (label, value) => {
    const icon = ICONS[label];
    const labelChildren = icon
      ? [
          new TextRun({ text: icon + ' ', size: 15, color: TEAL }),
          new TextRun({ text: label.toUpperCase(), bold: true, size: 15, font: MT, color: TEAL }),
        ]
      : [new TextRun({ text: label.toUpperCase(), bold: true, size: 15, font: MT, color: TEAL })];

    return new TableCell({
      borders: noBdrs,
      width: { size: CARD_W, type: WidthType.DXA },
      shading: { fill: 'EEF2F8', type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 40 }, children: labelChildren }),
        new Paragraph({ spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: val(value), size: 21, font: MT, color: NAVY })] }),
      ]
    });
  };

  const gapCell = () => new TableCell({
    borders: noBdrs,
    width: { size: GAP_W, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun('')] })]
  });

  const pairs = [
    ['Business Name', snap.business_name, 'Location', snap.location],
    ['Time in Business', snap.time_in_business, 'Business Type', snap.business_type],
    ['Primary Offering', snap.primary_offering, 'Target Customer', snap.target_customer],
    ['Top Competitors', snap.top_competitors, 'Marketing Channels', snap.marketing_channels],
    ['Key Challenge', snap.key_challenge, 'Success Goal', snap.success_goal],
  ];

  return pairs.flatMap((row, i) => {
    const [l1, v1, l2, v2] = row;
    const table = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [CARD_W, GAP_W, CARD_W],
      rows: [new TableRow({ children: [cardCell(l1, v1), gapCell(), cardCell(l2, v2)] })]
    });
    return i < pairs.length - 1 ? [table, sp(0.5)] : [table];
  });
}

// ── CUSTOMER PROFILE CARDS ───────────────────────────────
// Renders customer_profile segments as a 2-column grid of profile cards:
// navy header (segment letter + name) over a white body with teal field labels.
// Each pair of cards is one table: row 1 = headers, row 2 = bodies, so the
// headers and bodies line up across the pair.
function profileCards(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  const CARD_W = 4560;
  const GAP_W  = 240;
  // CARD_W + GAP_W + CARD_W = 9360 ✓

  const creamB   = { style: BorderStyle.SINGLE, size: 12, color: CREAM };
  const navyB    = { style: BorderStyle.SINGLE, size: 12, color: NAVY };
  const headBdrs = { top: navyB, left: navyB, right: navyB, bottom: navyB };
  const bodyBdrs = { top: noBdr, left: creamB, right: creamB, bottom: creamB };

  // Icon prefix matches the Business Snapshot cards — no explicit font so Word
  // falls back to its emoji font.
  const fieldLabel = (icon, text) => new Paragraph({ spacing: { before: 140, after: 40 },
    children: [
      new TextRun({ text: icon + ' ', size: 15, color: TEAL }),
      new TextRun({ text: text.toUpperCase(), bold: true, size: 15, font: MT, color: TEAL }),
    ] });
  const fieldValue = (text) => new Paragraph({ spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: stripMd(text || '—'), size: 20, font: MT, color: NAVY })] });

  const headerCell = (seg, i) => new TableCell({
    borders: headBdrs,
    width: { size: CARD_W, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: { top: 140, bottom: 140, left: 180, right: 180 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ keepNext: true, spacing: { before: 0, after: 20 },
        children: [new TextRun({ text: `SEGMENT ${'ABCDEFGH'[i] || i + 1}`, bold: true, size: 14, font: MT, color: TEAL })] }),
      new Paragraph({ keepNext: true, spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: stripMd(seg.name || ''), bold: true, size: 26, font: CG, color: WHITE })] }),
    ]
  });

  const bodyCell = (seg) => new TableCell({
    borders: bodyBdrs,
    width: { size: CARD_W, type: WidthType.DXA },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 140, bottom: 160, left: 180, right: 180 },
    children: [
      new Paragraph({ spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: stripMd(seg.desc || ''), size: 20, font: MT, color: INK })] }),
      fieldLabel('💡', 'Motivation'),
      fieldValue(seg.motivation),
      fieldLabel('🔑', 'Key Need'),
      fieldValue(seg.key_need),
    ]
  });

  const emptyCell = () => new TableCell({
    borders: noBdrs,
    width: { size: CARD_W, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun('')] })]
  });

  const gapCell = () => new TableCell({
    borders: noBdrs,
    width: { size: GAP_W, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun('')] })]
  });

  const rows = [];
  for (let i = 0; i < segments.length; i += 2) rows.push([i, i + 1]);

  return rows.flatMap(([a, b], r) => {
    const hasB = b < segments.length;
    const table = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [CARD_W, GAP_W, CARD_W],
      borders: TableBorders.NONE,
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ cantSplit: true, children: [
          headerCell(segments[a], a), gapCell(), hasB ? headerCell(segments[b], b) : emptyCell()
        ] }),
        new TableRow({ cantSplit: true, children: [
          bodyCell(segments[a]), gapCell(), hasB ? bodyCell(segments[b]) : emptyCell()
        ] }),
      ]
    });
    return r < rows.length - 1 ? [table, sp(1)] : [table];
  });
}

// ── KEY INSIGHT CARDS ────────────────────────────────────
// Renders insights as numbered cards in a 2-column grid, styled like the
// Customer Profile cards: white body, cream outline, teal left accent,
// "INSIGHT 01" tag over a bold navy headline. An odd final card spans
// the full width so the grid never has an empty slot.
function insightCards(insights) {
  if (!Array.isArray(insights) || insights.length === 0) return [];

  const CARD_W = 4560;
  const GAP_W  = 240;
  const FULL_W = 9360;
  // CARD_W + GAP_W + CARD_W = FULL_W ✓

  const creamB  = { style: BorderStyle.SINGLE, size: 12, color: CREAM };
  const accentB = { style: BorderStyle.SINGLE, size: 24, color: TEAL };
  const cardBdrs = { top: creamB, right: creamB, bottom: creamB, left: accentB };

  const card = (ins, i, width, span) => new TableCell({
    borders: cardBdrs,
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 160, bottom: 180, left: 220, right: 200 },
    children: [
      new Paragraph({ spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: `INSIGHT ${String(i + 1).padStart(2, '0')}`, bold: true, size: 14, font: MT, color: TEAL })] }),
      new Paragraph({ spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: stripMd(ins.title || ''), bold: true, size: 26, font: CG, color: NAVY })] }),
      new Paragraph({ spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: stripMd(ins.body || ''), size: 20, font: MT, color: INK })] }),
    ]
  });

  const gapCell = () => new TableCell({
    borders: noBdrs,
    width: { size: GAP_W, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun('')] })]
  });

  const rows = [];
  for (let i = 0; i < insights.length; i += 2) rows.push(i);

  return rows.flatMap((a, r) => {
    const hasB = a + 1 < insights.length;
    const table = new Table({
      width: { size: FULL_W, type: WidthType.DXA },
      columnWidths: [CARD_W, GAP_W, CARD_W],
      borders: TableBorders.NONE,
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ cantSplit: true, children: hasB
        ? [card(insights[a], a, CARD_W), gapCell(), card(insights[a + 1], a + 1, CARD_W)]
        : [card(insights[a], a, FULL_W, 3)] })]
    });
    return r < rows.length - 1 ? [table, sp(1)] : [table];
  });
}

// ── RECOMMENDATION PRIORITY TIERS ────────────────────────
// Groups recommendations into Priority 1/2/3 tiers. Each tier is a table with
// a colored header (navy → teal → cream) over rows of action | rationale.
// Drafts generated before `priority` existed fall back to list order, which
// the prompt already asks to be ranked by impact (4 items → 1, 1, 2, 3).
function recTier(rec, i, n) {
  const p = Number(rec && rec.priority);
  if (p === 1 || p === 2 || p === 3) return p;
  return Math.min(3, 1 + Math.floor(i * 3 / n));
}

function recommendationTiers(recs) {
  if (!Array.isArray(recs) || recs.length === 0) return [];

  const ACTION_W = 3500;
  const WHY_W    = 5860;
  // ACTION_W + WHY_W = 9360 ✓

  const TIERS = {
    1: { label: 'PRIORITY 1', sub: 'Do first',   fill: NAVY,  text: WHITE, subColor: TEAL, edge: NAVY },
    2: { label: 'PRIORITY 2', sub: 'Do next',    fill: TEAL,  text: NAVY,  subColor: NAVY, edge: TEAL },
    3: { label: 'PRIORITY 3', sub: 'When ready', fill: CREAM, text: NAVY,  subColor: GRAY, edge: CREAM },
  };

  const creamB = { style: BorderStyle.SINGLE, size: 8, color: CREAM };

  // Number recommendations continuously across tiers in tier order.
  const grouped = [1, 2, 3].map(t => recs
    .map((rec, i) => ({ rec, tier: recTier(rec, i, recs.length) }))
    .filter(x => x.tier === t)
    .map(x => x.rec));
  let num = 0;

  return grouped.flatMap((items, ti) => {
    if (items.length === 0) return [];
    const t = TIERS[ti + 1];
    const edgeB = { style: BorderStyle.SINGLE, size: 12, color: t.edge };

    const header = new TableRow({ cantSplit: true, children: [new TableCell({
      columnSpan: 2,
      borders: { top: edgeB, left: edgeB, right: edgeB, bottom: edgeB },
      width: { size: ACTION_W + WHY_W, type: WidthType.DXA },
      shading: { fill: t.fill, type: ShadingType.CLEAR },
      margins: { top: 110, bottom: 110, left: 180, right: 180 },
      children: [new Paragraph({ keepNext: true, spacing: { before: 0, after: 0 }, children: [
        new TextRun({ text: t.label, bold: true, size: 18, font: MT, color: t.text }),
        new TextRun({ text: `   ${t.sub.toUpperCase()}`, bold: true, size: 14, font: MT, color: t.subColor }),
      ] })]
    })] });

    const rows = items.map((rec, ri) => {
      num += 1;
      const last = ri === items.length - 1;
      const rowBdrs = { top: noBdr, left: edgeB, right: edgeB, bottom: last ? edgeB : creamB };
      return new TableRow({ cantSplit: true, children: [
        new TableCell({
          borders: { ...rowBdrs, right: creamB },
          width: { size: ACTION_W, type: WidthType.DXA },
          shading: { fill: WHITE, type: ShadingType.CLEAR },
          margins: { top: 140, bottom: 140, left: 180, right: 160 },
          children: [new Paragraph({ keepNext: !last, spacing: { before: 0, after: 0 }, children: [
            new TextRun({ text: `${num}. `, bold: true, size: 24, font: CG, color: TEAL }),
            new TextRun({ text: stripMd(rec.title || ''), bold: true, size: 24, font: CG, color: NAVY }),
          ] })]
        }),
        new TableCell({
          borders: { ...rowBdrs, left: noBdr },
          width: { size: WHY_W, type: WidthType.DXA },
          shading: { fill: WHITE, type: ShadingType.CLEAR },
          margins: { top: 140, bottom: 140, left: 180, right: 180 },
          children: [new Paragraph({ keepNext: !last, spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: stripMd(rec.body || ''), size: 20, font: MT, color: INK })] })]
        }),
      ] });
    });

    const table = new Table({
      width: { size: ACTION_W + WHY_W, type: WidthType.DXA },
      columnWidths: [ACTION_W, WHY_W],
      borders: TableBorders.NONE,
      layout: TableLayoutType.FIXED,
      rows: [header, ...rows]
    });
    return [table, sp(1.5)];
  }).slice(0, -1);
}

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
 *   aiContent.executive_summary     — string
 *   aiContent.business_snapshot     — { business_name, location, time_in_business, business_type, primary_offering, target_customer, top_competitors: string[], marketing_channels: string[], key_challenge, success_goal }
 *   aiContent.customer_profile      — array of { name, desc, motivation, key_need }
 *   aiContent.competitive_landscape — array of { name, strength, edge }
 *   aiContent.positioning           — { strengths: string[], vulnerabilities: string[] }
 *   aiContent.insights              — array of { title, body }
 *   aiContent.recommendations       — array of { title, body, priority?: 1|2|3 }
 *
 * @param {string} analystNote - John's personal closing paragraph
 *
 * @returns {Promise<Buffer>} - The .docx file as a buffer
 */
async function generateReport(orderData, aiContent, analystNote) {

  // coverLogoData and iconLogoData are module-level constants (base64-decoded)

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
        page: { size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [

        // Cover logo — 420×128 pt. before:1440 places the logo centre at
        // ~26% from the top of the page (≈ quarter-page). after:480 gives
        // breathing room between the logo and the thin teal rule below.
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

        // Label
        new Paragraph({ spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "MARKET INTELLIGENCE REPORT",
            size: 18, font: MT, bold: true, color: TEAL, allCaps: true })]
        }),

        // Client name — hero
        new Paragraph({ spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: CLIENT,
            bold: true, size: 80, font: CG, color: NAVY })]
        }),

        // Meta line
        new Paragraph({ spacing: { before: 0, after: 240 },
          children: [new TextRun({
            text: `Prepared for ${CUSTOMER}  |  ${CLIENT}${LOCATION ? '  |  ' + LOCATION : ''}  |  ${DATE}`,
            size: 20, font: MT, color: GRAY
          })]
        }),

        // Thick teal rule — gap below separates client info from section list
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 0 } },
          spacing: { before: 240, after: 1080 },
          children: [new TextRun("")]
        }),

        // What's inside
        new Paragraph({ spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "THIS REPORT CONTAINS",
            size: 16, font: MT, color: TEAL, allCaps: true, bold: true })]
        }),

        ...["Executive Summary", "Business Snapshot", "Customer Profile", "Competitive Landscape",
            "Market Positioning", "Key Insights", "Recommendations"].map(s =>
          new Paragraph({ spacing: { before: 120, after: 120 },
            children: [
              new TextRun({ text: "— ", size: 20, font: MT, color: TEAL }),
              new TextRun({ text: s, size: 20, font: CG, bold: true, color: NAVY })
            ]
          })
        ),

        // Spacer — pushes confidential line to page bottom.
        // Reduced from 1800 to match the extra space added above the logo.
        new Paragraph({ spacing: { before: 960, after: 0 }, children: [new TextRun("")] }),

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

      ]
    },

    // ══ REPORT BODY ═══════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          // footer: 720 pins footer ½" from page edge; bottom: 1440 keeps
          // body content clear of the footer zone.
          margin: { top: 1000, right: 1260, bottom: 1440, left: 1260, footer: 720 }
        }
      },
      headers: {
        // Logo only — no text. Right-aligned so it sits in the top-right corner.
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
        // Two centered lines, Montserrat 9pt gray, thin gray rule above.
        // Pinned to page bottom by the footer margin set in page properties.
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

        // ── 1. EXECUTIVE SUMMARY ─────────────────────────
        sectionHead("1", "Executive Summary"),
        sp(0.5),
        ...(typeof aiContent.executive_summary === 'object' && aiContent.executive_summary ? [
          body(aiContent.executive_summary.intro),
          sp(0.5),
          ...aiContent.executive_summary.bullets.map(b => blt(b)),
          sp(0.5),
          execSummaryCallouts(
            aiContent.executive_summary.your_edge,
            aiContent.executive_summary.priority_action
          ),
        ] : [
          body(aiContent.executive_summary || ''),
        ]),
        sp(2),

        // ── 2. BUSINESS SNAPSHOT ────────────────────────
        sectionHead("2", "Business Snapshot"),
        sp(0.5),
        ...snapshotDashboard(aiContent.business_snapshot),
        sp(2),

        // ── 3. CUSTOMER PROFILE ─────────────────────────
        sectionHead("3", "Customer Profile"),
        sp(0.5),
        body("The following customer segments emerge from the business profile and market context. Understanding each segment's motivations and needs is the foundation for addressing growth opportunities."),
        sp(),

        ...profileCards(aiContent.customer_profile),

        sp(2),

        // ── 4. COMPETITIVE LANDSCAPE ────────────────────
        sectionHead("4", "Competitive Landscape"),
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

        // ── 5. MARKET POSITIONING ───────────────────────
        sectionHead("5", "Market Positioning"),
        sp(0.5),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4500, 360, 4500],
          rows: [new TableRow({
            children: [
              new TableCell({
                borders: noBdrs,
                width: { size: 4500, type: WidthType.DXA },
                shading: { fill: 'EEF2F8', type: ShadingType.CLEAR },
                margins: { top: 140, bottom: 160, left: 200, right: 160 },
                children: [
                  new Paragraph({ spacing: { before: 0, after: 80 },
                    children: [new TextRun({ text: "STRENGTHS", bold: true, size: 17, font: MT, color: NAVY })] }),
                  new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: NAVY, space: 6 } },
                    spacing: { before: 0, after: 100 },
                    children: [new TextRun("")]
                  }),
                  ...aiContent.positioning.strengths.map(s =>
                    new Paragraph({
                      numbering: { reference: "bullets", level: 0 },
                      spacing: { before: 60, after: 60 },
                      children: [new TextRun({ text: s, size: 20, font: MT, color: INK })]
                    })
                  ),
                ]
              }),
              new TableCell({
                borders: noBdrs,
                width: { size: 360, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun('')] })]
              }),
              new TableCell({
                borders: noBdrs,
                width: { size: 4500, type: WidthType.DXA },
                shading: { fill: 'EEF2F8', type: ShadingType.CLEAR },
                margins: { top: 140, bottom: 160, left: 200, right: 160 },
                children: [
                  new Paragraph({ spacing: { before: 0, after: 80 },
                    children: [new TextRun({ text: "VULNERABILITIES", bold: true, size: 17, font: MT, color: TEAL })] }),
                  new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 6 } },
                    spacing: { before: 0, after: 100 },
                    children: [new TextRun("")]
                  }),
                  ...aiContent.positioning.vulnerabilities.map(v =>
                    new Paragraph({
                      numbering: { reference: "bullets", level: 0 },
                      spacing: { before: 60, after: 60 },
                      children: [new TextRun({ text: v, size: 20, font: MT, color: INK })]
                    })
                  ),
                ]
              }),
            ]
          })]
        }),

        sp(2),

        // ── 6. KEY INSIGHTS ─────────────────────────────
        sectionHead("6", "Key Insights"),
        sp(0.5),
        body("The following insights represent the analyst's interpretation of the data — what the findings mean for this business and what should drive decisions in the months ahead."),
        sp(),
        ...insightCards(aiContent.insights),

        sp(2),

        // ── 7. RECOMMENDATIONS ──────────────────────────
        sectionHead("7", "Recommendations"),
        sp(0.5),
        body("Recommendations are grouped by priority. Start with Priority 1: these carry the most impact for the effort involved. Priority 2 and 3 build on that momentum."),
        sp(),
        ...recommendationTiers(aiContent.recommendations),

        sp(1),

        // ── ANALYST NOTE ────────────────────────────────
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 3, color: TEAL, space: 8 } },
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "A Note from the Analyst",
            bold: true, size: 30, font: CG, color: NAVY })]
        }),
        body(analystNote),
        // keepNext: true on the signature ensures the disclaimer cannot
        // be orphaned onto its own page — it stays with the signature line.
        new Paragraph({ spacing: { before: 80, after: 60 }, keepNext: true,
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
